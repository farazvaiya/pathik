import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { FeedPost } from '../../models/FeedPost';
import { FeedComment } from '../../models/FeedComment';
import { Notification } from '../../models/Notification';
import { User } from '../../models/User';
import { AppError } from '../../middleware/errorHandler';
import { cleanInput } from '../../utils/cleaners';
import { uploadToSupabase } from './feed.upload';
import { getIO, emitNotification } from '../../sockets/socketServer';
import { sendBulkPushNotification } from '../../services/pushNotifications';
import { classifyText } from '../../services/aiOrchestrator';
import { z } from 'zod';

const ALLOWED_TYPES = ['traffic', 'accident', 'danger', 'tip', 'event', 'other'] as const;

const createPostSchema = z.object({
  type: z.enum(ALLOWED_TYPES).default('tip'),
  from: z.string().max(120).default(''),
  to: z.string().max(120).default(''),
  message: z.string().min(1, 'Message is required').max(1200),
  deviceId: z.string().max(100).optional(),
  locationName: z.string().max(200).optional(),
  isAnonymous: z.boolean().default(true),
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

    // Attach comment counts
    const postIds = posts.map(p => p._id);
    const commentCounts = await FeedComment.aggregate([
      { $match: { postId: { $in: postIds }, status: 'active', isDeleted: false } },
      { $group: { _id: '$postId', count: { $sum: 1 } } },
    ]);
    const countMap: Record<string, number> = {};
    commentCounts.forEach(c => { countMap[String(c._id)] = c.count; });
    const postsWithCounts = posts.map(p => ({ ...p, commentCount: countMap[String(p._id)] || 0 }));

    res.json({
      success: true,
      data: postsWithCounts,
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

    let imageUrl: string | null = null;
    if (req.file) {
      const uploaded = await uploadToSupabase(req.file, 'posts');
      imageUrl = uploaded.url;
    }

    let location: { type: 'Point'; coordinates: [number, number] } | null = null;
    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      location = { type: 'Point', coordinates: [lng, lat] };
    }

    const post = await FeedPost.create({
      type: body.type,
      from: cleanInput(body.from, 120),
      to: cleanInput(body.to, 120),
      message: cleanInput(body.message, 1200),
      image: imageUrl,
      location,
      locationName: body.locationName ? cleanInput(body.locationName, 200) : undefined,
      authorId,
      deviceId,
      isAnonymous: body.isAnonymous,
      status: 'active',
    });

    // Notify nearby users if post has location
    if (location) {
      const isEmergency = body.type === 'accident' || body.type === 'danger';
      const radius = isEmergency ? 2000 : 500; // 2km for emergency, 500m for normal posts

      const nearbyUsers = await User.find({
        _id: { $ne: authorId },
        jurisdictionLocation: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radius,
          },
        },
      }).select('_id').limit(50);

      if (nearbyUsers.length > 0) {
        const notifType = isEmergency ? 'sos_alert' : 'sighting_nearby';
        const notifications = nearbyUsers.map(user => ({
          userId: user._id,
          type: notifType as 'sos_alert' | 'sighting_nearby',
          title: isEmergency ? 'জরুরি পোস্ট!' : 'নতুন পোস্ট',
          body: `${body.type} - ${body.locationName || 'আপনার এলাকায়'}`,
          data: { postId: post._id, type: body.type },
          sentVia: ['push'],
        }));
        await Notification.insertMany(notifications);

        for (const user of nearbyUsers) {
          emitNotification(String(user._id), {
            type: notifType,
            title: isEmergency ? 'জরুরি পোস্ট!' : 'নতুন পোস্ট',
            body: `${body.type} - ${body.locationName || 'আপনার এলাকায়'}`,
            postId: post._id,
          });
        }

        // Send push notification to nearby users (browser popup)
        const userIds = nearbyUsers.map(u => String(u._id));
        sendBulkPushNotification(userIds, {
          title: isEmergency ? '🚨 জরুরি পোস্ট!' : '📢 নতুন পোস্ট',
          body: `${body.type} - ${body.locationName || 'আপনার এলাকায়'}`,
          url: '/',
          data: { postId: post._id, type: body.type },
        }).catch(() => {}); // Non-blocking
      }
    }

    // Broadcast new post to all connected clients
    try {
      const io = getIO();
      io.emit('feed:new_post', post.toJSON());
    } catch {
      // Socket not yet initialized — skip broadcast
    }

    res.status(201).json({ success: true, data: post.toJSON() });

    // Non-blocking AI classification via Groq (response already sent, user doesn't wait)
    classifyText(body.message, 'feed', String(post._id))
      .then((aiResult) => {
        if (!aiResult) return;
        FeedPost.findByIdAndUpdate(post._id, {
          aiCategory: aiResult.category,
          aiSeverity: aiResult.severity,
          aiIsEmergency: aiResult.is_emergency,
          aiConfidence: aiResult.confidence,
        }).catch(() => {});
      })
      .catch(() => {});
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

    let mediaUrl: string | null = null;
    let mediaType: 'image' | 'video' | null = null;
    if (req.file) {
      const uploaded = await uploadToSupabase(req.file, 'comments');
      mediaUrl = uploaded.url;
      mediaType = uploaded.mediaType;
    }

    const comment = await FeedComment.create({
      postId: toObjectId(body.postId),
      parentId: body.parentId ? toObjectId(body.parentId) : null,
      message: cleanInput(body.message, 600),
      media: mediaUrl,
      mediaType,
      authorId,
      deviceId,
    });

    res.status(201).json({ success: true, data: comment.toJSON() });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/feed/comments/:postId/replies
export async function getReplies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = cleanInput(req.params.postId, 80);
    if (!postId) throw new AppError(400, 'VALIDATION_ERROR', 'postId is required');

    const comments = await FeedComment.find({
      postId: toObjectId(postId),
      parentId: { $ne: null },
      status: 'active',
      isDeleted: false,
    }).sort({ createdAt: 1 }).lean();

    res.json({ success: true, data: comments });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/feed/nearby
export async function getNearbyPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = Math.min(50, Math.max(0.1, parseFloat(req.query.radius as string) || 5));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    if (isNaN(lat) || isNaN(lng)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'lat and lng query parameters are required');
    }

    const posts = await FeedPost.find({
      status: 'active',
      isDeleted: false,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      },
    }).limit(limit).lean();

    res.json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/feed/:id
export async function getPostById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = cleanInput(req.params.id, 80);
    if (!postId) throw new AppError(400, 'VALIDATION_ERROR', 'Post ID is required');

    const post = await FeedPost.findOne({
      _id: toObjectId(postId),
      status: 'active',
      isDeleted: false,
    }).lean();

    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/feed/:id
export async function deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = cleanInput(req.params.id, 80);
    if (!postId) throw new AppError(400, 'VALIDATION_ERROR', 'Post ID is required');

    const post = await FeedPost.findOne({ _id: toObjectId(postId), isDeleted: false });
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');

    // Only author or admin can delete
    const userId = req.user?._id;
    const isAdmin = req.user?.role === 'admin';
    const isAuthor = post.authorId?.toString() === userId;

    if (!isAdmin && !isAuthor) {
      throw new AppError(403, 'FORBIDDEN', 'You can only delete your own posts');
    }

    post.status = 'deleted';
    post.isDeleted = true;
    await post.save();

    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
}
