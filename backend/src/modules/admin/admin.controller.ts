import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Alert } from '../../models/Alert';
import { FeedPost } from '../../models/FeedPost';
import { User } from '../../models/User';
import { Sighting } from '../../models/Sighting';
import { AppError } from '../../middleware/errorHandler';
import { cleanInput } from '../../utils/cleaners';

function toObjectId(val: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(val);
}

// GET /api/v1/admin/dashboard
export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [
      totalAlerts,
      activeAlerts,
      totalPosts,
      totalUsers,
      totalSightings,
      resolvedAlerts,
      falseAlarms,
    ] = await Promise.all([
      Alert.countDocuments(),
      Alert.countDocuments({ status: 'active' }),
      FeedPost.countDocuments({ isDeleted: false }),
      User.countDocuments({ isDeleted: false }),
      Sighting.countDocuments(),
      Alert.countDocuments({ status: 'resolved' }),
      Alert.countDocuments({ status: 'false_alarm' }),
    ]);

    // Alerts by type
    const alertsByType = await Alert.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Alerts by severity
    const alertsBySeverity = await Alert.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalAlerts,
          activeAlerts,
          totalPosts,
          totalUsers,
          totalSightings,
          resolvedAlerts,
          falseAlarms,
        },
        alertsByType,
        alertsBySeverity,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/alerts
export async function getAdminAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const status = req.query.status as string;
    const type = req.query.type as string;
    const severity = req.query.severity as string;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (severity) filter.severity = severity;

    const [alerts, total] = await Promise.all([
      Alert.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Alert.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: alerts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page < Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/heatmap
export async function getHeatmapData(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days as string) || 30));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const heatmapPoints = await Alert.aggregate([
      { $match: { createdAt: { $gte: startDate }, location: { $ne: null } } },
      {
        $project: {
          lat: { $arrayElemAt: ['$location.coordinates', 1] },
          lng: { $arrayElemAt: ['$location.coordinates', 0] },
          type: 1,
          severity: 1,
          weight: {
            $switch: {
              branches: [
                { case: { $eq: ['$severity', 'critical'] }, then: 4 },
                { case: { $eq: ['$severity', 'high'] }, then: 3 },
                { case: { $eq: ['$severity', 'medium'] }, then: 2 },
              ],
              default: 1,
            },
          },
        },
      },
    ]);

    res.json({ success: true, data: heatmapPoints });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/sighting-clusters
export async function getSightingClusters(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const alertId = req.query.alertId as string;
    if (!alertId) throw new AppError(400, 'VALIDATION_ERROR', 'alertId is required');

    const sightings = await Sighting.find({ alertId: toObjectId(alertId) })
      .sort({ createdAt: -1 })
      .lean();

    // Simple clustering for now
    const clusters: Record<string, any> = {};
    for (const sighting of sightings) {
      const key = `${Math.round((sighting.location as any).coordinates[1] * 100)}_${Math.round((sighting.location as any).coordinates[0] * 100)}`;
      if (!clusters[key]) {
        clusters[key] = {
          lat: (sighting.location as any).coordinates[1],
          lng: (sighting.location as any).coordinates[0],
          sightings: [],
          count: 0,
        };
      }
      clusters[key].sightings.push(sighting._id);
      clusters[key].count++;
    }

    res.json({ success: true, data: Object.values(clusters) });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/admin/verify-user
export async function verifyUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, officialId, officialEmail, role } = req.body;
    if (!userId || !role) throw new AppError(400, 'VALIDATION_ERROR', 'userId and role required');

    if (!['police', 'rab'].includes(role)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Role must be police or rab');
    }

    const user = await User.findById(toObjectId(userId));
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

    user.role = role as any;
    user.officialId = officialId;
    user.officialEmail = officialEmail;
    user.isOfficiallyVerified = true;
    await user.save();

    res.json({ success: true, data: { id: user._id, role: user.role, isOfficiallyVerified: true } });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/admin/review/:id
export async function reviewPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = req.params.id as string;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Action must be approve or reject');
    }

    const post = await FeedPost.findById(toObjectId(postId));
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');

    if (action === 'approve') {
      post.status = 'active';
    } else {
      post.status = 'hidden';
      // Penalize trust score
      if (post.authorId) {
        await User.findByIdAndUpdate(post.authorId, { $inc: { trustScore: -0.1 } });
      }
    }

    await post.save();
    res.json({ success: true, data: post.toJSON() });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/pending-reviews
export async function getPendingReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [posts, total] = await Promise.all([
      FeedPost.find({ status: 'pending_review', isDeleted: false })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FeedPost.countDocuments({ status: 'pending_review', isDeleted: false }),
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
