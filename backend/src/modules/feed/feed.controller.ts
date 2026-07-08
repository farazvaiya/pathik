import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { FeedPost } from '../../models/FeedPost';
import { FeedComment } from '../../models/FeedComment';
import { AppError } from '../../middleware/errorHandler';
import { cleanInput } from '../../utils/cleaners';
import { z } from 'zod';

const ALLOWED_TYPES = ['traffic', 'accident', 'danger', 'tip', 'event', 'other'] as const;

const createPostSchema = z.object({
  type: z.enum(ALLOWED_TYPES).default('tip'),
  from: z.string().max(120).default(''),
  to: z.string().max(120).default(''),
  message: z.string().min(1, 'Message is required').max(1200),
  deviceId: z.string().max(100).optional(),
});

const voteSchema = z.object({
  id: z.string().min(1),
  vote: z.enum(['up', 'down']),
  deviceId: z.string().max(100).optional(),
});

const createCommentSchema = z.object({
  postId: z.string().min(1),
  message: z.string().min(1).max(600),
  parentId: z.string().optional().nullable(),
  deviceId: z.string().max(100).optional(),
});

function toObjectId(val: string | string[]): mongoose.Types.ObjectId {
  const s = Array.isArray(val) ? val[0] : val;
  return new mongoose.Types.ObjectId(s);
}

// GET /api/v1/feed
export async function getPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const type = req.query.type as string;
    const sort = (req.query.sort as string) || 'newest';

    const filter: Record<string, unknown> = { status: 'active', isDeleted: false };
    if (type && ALLOWED_TYPES.includes(type as any)) filter.type = type;

    const sortObj: Record<string, 1 | -1> =
      sort === 'top' ? { upvotes: -1 } : sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const [posts, total] = await Promise.all([
      FeedPost.find(filter).sort(sortObj).skip((page - 1) * limit).limit(limit).lean(),
      FeedPost.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page < Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/feed
export async function createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createPostSchema.parse(req.body);
    const deviceId = body.deviceId || req.deviceId || (req.body.deviceId as string) || null;
    const authorId = req.user ? new mongoose.Types.ObjectId(req.user._id) : null;

    if (!authorId && !deviceId) {
      throw new AppError(400, 'MISSING_IDENTITY', 'Post requires an authenticated user or a deviceId');
    }

    const post = await FeedPost.create({
      type: body.type,
      from: cleanInput(body.from, 120),
      to: cleanInput(body.to, 120),
      message: cleanInput(body.message, 1200),
      authorId,
      deviceId,
    });

    res.status(201).json({ success: true, data: post.toJSON() });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/feed/vote
export async function voteOnPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, vote, deviceId: bodyDeviceId } = voteSchema.parse(req.body);
    const deviceId = bodyDeviceId || req.deviceId || null;
    const userId = req.user ? new mongoose.Types.ObjectId(req.user._id) : null;

    if (!userId && !deviceId) {
      throw new AppError(400, 'MISSING_IDENTITY', 'Vote requires an authenticated user or a deviceId');
    }

    const post = await FeedPost.findById(toObjectId(id));
    if (!post || post.isDeleted) throw new AppError(404, 'NOT_FOUND', 'Post not found');

    const value = vote === 'up' ? 1 : -1;
    const existingIdx = post.votedBy.findIndex(
      (v) => (userId && v.userId?.equals(userId)) || (deviceId && v.deviceId === deviceId)
    );

    if (existingIdx >= 0) {
      const existing = post.votedBy[existingIdx];
      if (existing.value === value) {
        // Toggle off
        post.votedBy.splice(existingIdx, 1);
        if (value === 1) post.upvotes = Math.max(0, post.upvotes - 1);
        else post.downvotes = Math.max(0, post.downvotes - 1);
      } else {
        // Switch vote
        if (existing.value === 1) { post.upvotes = Math.max(0, post.upvotes - 1); post.downvotes++; }
        else { post.downvotes = Math.max(0, post.downvotes - 1); post.upvotes++; }
        post.votedBy[existingIdx].value = value;
      }
    } else {
      post.votedBy.push({ userId, deviceId, value });
      if (value === 1) post.upvotes++;
      else post.downvotes++;
    }

    await post.save();
    res.json({ success: true, data: post.toJSON() });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/feed/comments
export async function getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = cleanInput(req.query.postId as string, 80);
    if (!postId) throw new AppError(400, 'VALIDATION_ERROR', 'postId is required');

    const comments = await FeedComment.find({
      postId: toObjectId(postId),
      status: 'active',
      isDeleted: false,
    }).sort({ createdAt: 1 }).lean();

    res.json({ success: true, data: comments });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/feed/comments
export async function createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createCommentSchema.parse(req.body);
    const deviceId = body.deviceId || req.deviceId || null;
    const authorId = req.user ? new mongoose.Types.ObjectId(req.user._id) : null;

    if (!authorId && !deviceId) {
      throw new AppError(400, 'MISSING_IDENTITY', 'Comment requires an authenticated user or a deviceId');
    }

    const comment = await FeedComment.create({
      postId: toObjectId(body.postId),
      parentId: body.parentId ? toObjectId(body.parentId) : null,
      message: cleanInput(body.message, 600),
      authorId,
      deviceId,
    });

    res.status(201).json({ success: true, data: comment.toJSON() });
  } catch (err) {
    next(err);
  }
}
