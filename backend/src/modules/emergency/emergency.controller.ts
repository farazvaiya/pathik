import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Alert } from '../../models/Alert';
import { Sighting } from '../../models/Sighting';
import { FeedPost } from '../../models/FeedPost';
import { Notification } from '../../models/Notification';
import { User } from '../../models/User';
import { AppError } from '../../middleware/errorHandler';
import { createAlertSchema, sightingSchema, confirmSightingSchema, flagAlertSchema, resolveAlertSchema } from './emergency.schema';
import { cleanInput } from '../../utils/cleaners';
import { emitNewAlert, emitSighting, emitAlertUpdate, emitNotification, broadcastNotification, emitAdminEvent } from '../../sockets/socketServer';
import { uploadToSupabase } from '../feed/feed.upload';

// Emergency radius — 5km for all SOS types
const EMERGENCY_RADIUS = 5000;

const EMERGENCY_TYPES = new Set([
  'accident', 'assault', 'robbery', 'harassment', 'medical',
  'fire', 'missing_person', 'stolen_vehicle', 'escaped_criminal', 'natural_disaster',
]);

function toObjectId(val: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(val);
}

// POST /api/v1/emergency/sos
export async function createSOS(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Pre-parse FormData string values before Zod validation
    if (req.body.lat != null) req.body.lat = parseFloat(req.body.lat);
    if (req.body.lng != null) req.body.lng = parseFloat(req.body.lng);
    if (req.body.isAnonymous != null) req.body.isAnonymous = req.body.isAnonymous === 'true' || req.body.isAnonymous === true;

    const body = createAlertSchema.parse(req.body);
    const userId = req.user ? new mongoose.Types.ObjectId(req.user._id) : null;
    const deviceId = req.deviceId || req.body.deviceId || null;

    if (!userId && !deviceId) {
      throw new AppError(400, 'MISSING_IDENTITY', 'SOS requires an authenticated user or a deviceId');
    }

    // Handle media upload (photo/video)
    let mediaUrl: string | null = null;
    let mediaType: 'image' | 'video' | null = null;
    if (req.file) {
      const uploaded = await uploadToSupabase(req.file, 'sos');
      mediaUrl = uploaded.url;
      mediaType = uploaded.mediaType;
    }

    // Determine alert type — AI will classify later, for now use user input or default
    const alertType = body.type || 'other';
    const isEmergency = EMERGENCY_TYPES.has(alertType);
    const radius = EMERGENCY_RADIUS;

    // Create the alert
    const alert = await Alert.create({
      type: alertType,
      severity: isEmergency ? 'high' : 'medium',
      isEmergency,
      originalText: cleanInput(body.message, 1200),
      originalPostId: new mongoose.Types.ObjectId(), // placeholder, will be linked after feed post
      location: { type: 'Point', coordinates: [body.lng, body.lat] },
      locationName: body.locationName ? cleanInput(body.locationName, 200) : undefined,
      from: body.from ? cleanInput(body.from, 120) : undefined,
      to: body.to ? cleanInput(body.to, 120) : undefined,
      radius,
      status: 'active',
      creatorId: userId,
      creatorDeviceId: deviceId,
    });

    // Create associated feed post
    const feedPost = await FeedPost.create({
      type: alertType === 'other' ? 'danger' : 'accident',
      from: body.from ? cleanInput(body.from, 120) : '',
      to: body.to ? cleanInput(body.to, 120) : '',
      message: cleanInput(body.message, 1200),
      location: { type: 'Point', coordinates: [body.lng, body.lat] },
      locationName: body.locationName ? cleanInput(body.locationName, 200) : undefined,
      image: mediaUrl,
      authorId: userId,
      deviceId,
      isAnonymous: body.isAnonymous,
      aiCategory: alertType as any,
      aiSeverity: alert.severity as any,
      aiIsEmergency: isEmergency,
      aiConfidence: 0.8, // placeholder until AI processing
      alertId: alert._id,
      status: 'active',
    });

    // Link alert to feed post
    alert.originalPostId = feedPost._id;
    await alert.save();

    // Find nearby users for notification (best-effort, don't fail SOS if notification breaks)
    let notifiedCount = 0;
    try {
      // Find users whose lastKnownLocation is within 5km radius
      const creatorIdStr = userId ? String(userId) : null;
      const nearbyUsers = await User.find({
        _id: { $ne: userId },
        lastKnownLocation: {
          $near: {
            $geometry: { type: 'Point', coordinates: [body.lng, body.lat] },
            $maxDistance: radius,
          },
        },
      }).select('_id').limit(500);

      // Also find police/RAB with jurisdictionLocation nearby
      const nearbyJurisdictionUsers = await User.find({
        _id: { $ne: userId },
        role: { $in: ['police', 'rab'] },
        jurisdictionLocation: {
          $near: {
            $geometry: { type: 'Point', coordinates: [body.lng, body.lat] },
            $maxDistance: radius,
          },
        },
      }).select('_id').limit(100);

      // Merge both sets, exclude the creator
      const nearbyUserIds = new Set<string>();
      for (const u of nearbyUsers) {
        const id = String(u._id);
        if (id !== creatorIdStr) nearbyUserIds.add(id);
      }
      for (const u of nearbyJurisdictionUsers) {
        const id = String(u._id);
        if (id !== creatorIdStr) nearbyUserIds.add(id);
      }

      // Create notifications for all target users
      if (nearbyUserIds.size > 0) {
        const notifType = isEmergency ? 'sos_alert' : 'sighting_nearby';
        const notifications = Array.from(nearbyUserIds).map(uid => ({
          userId: new mongoose.Types.ObjectId(uid),
          type: notifType as 'sos_alert' | 'sighting_nearby',
          title: isEmergency ? 'জরুরি অ্যালার্ট!' : 'নতুন রিপোর্ট',
          body: `${alertType} - ${body.locationName || 'আপনার এলাকায়'}`,
          data: { alertId: alert._id, type: alertType },
          sentVia: ['push'],
        }));
        await Notification.insertMany(notifications);

        // Emit real-time notifications
        for (const uid of nearbyUserIds) {
          emitNotification(uid, {
            type: notifType,
            title: isEmergency ? 'জরুরি অ্যালার্ট!' : 'নতুন রিপোর্ট',
            body: `${alertType} - ${body.locationName || 'আপনার এলাকায়'}`,
            alertId: alert._id,
          });
        }
      }
      notifiedCount = nearbyUserIds.size;
    } catch (notifErr) {
      console.error('[SOS] Notification failed (SOS still saved):', (notifErr as Error).message);
    }

    // Emit real-time alert to all connected clients
    emitNewAlert(alert.toJSON());
    emitAdminEvent('admin:new_alert', { alertId: alert._id, type: alertType, severity: alert.severity });

    // Broadcast SOS notification to ALL connected sockets
    broadcastNotification({
      type: 'sos_alert',
      title: isEmergency ? 'জরুরি অ্যালার্ট!' : 'নতুন রিপোর্ট',
      body: `${alertType} - ${body.locationName || 'আপনার এলাকায়'}`,
      alertId: alert._id,
      createdAt: alert.createdAt,
    });

    res.status(201).json({
      success: true,
      data: {
        alert: alert.toJSON(),
        feedPost: feedPost.toJSON(),
        nearbyUsersNotified: notifiedCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/emergency/alerts
export async function getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const status = (req.query.status as string) || 'active';
    const type = req.query.type as string;

    const filter: Record<string, unknown> = { status };
    if (type) filter.type = type;

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

// GET /api/v1/emergency/alerts/nearby
export async function getNearbyAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = Math.min(50, Math.max(0.1, parseFloat(req.query.radius as string) || 5));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    if (isNaN(lat) || isNaN(lng)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'lat and lng query parameters are required');
    }

    const alerts = await Alert.find({
      status: 'active',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      },
    }).limit(limit).lean();

    res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/emergency/alerts/:id
export async function getAlertById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const alert = await Alert.findOne({
      _id: toObjectId(id),
      status: { $ne: 'deleted' },
    }).lean();

    if (!alert) throw new AppError(404, 'NOT_FOUND', 'Alert not found');
    res.json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/emergency/alerts/:id/sighting
export async function reportSighting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const alertId = req.params.id as string;
    const body = sightingSchema.parse(req.body);
    const userId = req.user ? new mongoose.Types.ObjectId(req.user._id) : null;
    const deviceId = req.deviceId || req.body.deviceId || null;

    if (!userId && !deviceId) {
      throw new AppError(400, 'MISSING_IDENTITY', 'Sighting requires an authenticated user or a deviceId');
    }

    const alert = await Alert.findById(toObjectId(alertId));
    if (!alert || alert.status !== 'active') {
      throw new AppError(404, 'NOT_FOUND', 'Alert not found or not active');
    }

    // Get reporter trust score
    let reporterTrustScore = 0.5;
    if (userId) {
      const user = await User.findById(userId).select('trustScore');
      if (user) reporterTrustScore = user.trustScore;
    }

    const sighting = await Sighting.create({
      alertId: alert._id,
      reporterId: userId || undefined,
      deviceId,
      location: { type: 'Point', coordinates: [body.lng, body.lat] },
      locationName: body.locationName ? cleanInput(body.locationName, 200) : undefined,
      description: body.description ? cleanInput(body.description, 500) : undefined,
      reporterTrustScore,
      confirmationCount: 1,
      confirmedBy: [{ userId, deviceId, createdAt: new Date() }],
    });

    // Update alert sighting count
    alert.sightingCount += 1;
    alert.lastSightingAt = new Date();
    await alert.save();

    // Notify alert creator
    if (alert.creatorId) {
      const notif = await Notification.create({
        userId: alert.creatorId,
        type: 'sighting_confirmed',
        title: 'কেউ আপনার রিপোর্ট দেখেছেন!',
        body: `${body.locationName || 'একটি সাইটিং'} - ${sighting.confirmationCount} জন কনফার্ম করেছেন`,
        data: { alertId: alert._id, sightingId: sighting._id },
        sentVia: ['push'],
      });
      emitNotification(String(alert.creatorId), notif.toJSON());
    }

    // Emit real-time sighting update
    emitSighting(sighting.toJSON(), String(alert._id));
    emitAlertUpdate({ ...alert.toJSON(), sightingCount: alert.sightingCount });

    res.status(201).json({ success: true, data: sighting.toJSON() });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/emergency/alerts/:id/confirm
export async function confirmSighting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sightingId } = confirmSightingSchema.parse(req.body);
    const userId = req.user ? new mongoose.Types.ObjectId(req.user._id) : null;
    const deviceId = req.deviceId || req.body.deviceId || null;

    if (!userId && !deviceId) {
      throw new AppError(400, 'MISSING_IDENTITY', 'Confirmation requires an authenticated user or a deviceId');
    }

    const sighting = await Sighting.findById(toObjectId(sightingId));
    if (!sighting) throw new AppError(404, 'NOT_FOUND', 'Sighting not found');

    // Check if already confirmed
    const alreadyConfirmed = sighting.confirmedBy.some(
      c => (userId && c.userId?.equals(userId)) || (deviceId && c.deviceId === deviceId)
    );
    if (alreadyConfirmed) {
      throw new AppError(409, 'ALREADY_CONFIRMED', 'You have already confirmed this sighting');
    }

    sighting.confirmedBy.push({ userId: userId || undefined, deviceId, createdAt: new Date() });
    sighting.confirmationCount += 1;
    await sighting.save();

    res.json({ success: true, data: sighting.toJSON() });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/emergency/alerts/:id/flag
export async function flagAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = flagAlertSchema.parse(req.body);
    const userId = req.user ? new mongoose.Types.ObjectId(req.user._id) : null;
    const deviceId = req.deviceId || req.body.deviceId || null;

    if (!userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Flagging requires authentication');
    }

    // Check trust score
    const user = await User.findById(userId).select('trustScore');
    if (!user || user.trustScore < 0.6) {
      throw new AppError(403, 'INSUFFICIENT_TRUST', 'Trust score of 0.6 required to flag');
    }

    const alert = await Alert.findById(toObjectId(req.params.id as string));
    if (!alert) throw new AppError(404, 'NOT_FOUND', 'Alert not found');

    // Check if already flagged by this user
    const alreadyFlagged = alert.flaggedBy.some(f => f.userId.equals(userId));
    if (alreadyFlagged) {
      throw new AppError(409, 'ALREADY_FLAGGED', 'You have already flagged this alert');
    }

    alert.flaggedBy.push({ userId, deviceId, reason: body.reason });
    alert.flagCount += 1;

    // If 5+ trusted users flag within 5 minutes, auto-hide
    if (alert.flagCount >= 5) {
      alert.status = 'pending_review';
    }

    await alert.save();

    res.json({ success: true, data: { flagCount: alert.flagCount, status: alert.status } });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/emergency/alerts/:id/resolve (admin only)
export async function resolveAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = resolveAlertSchema.parse(req.body);

    if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    if (!['admin', 'police', 'rab'].includes(req.user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Admin/police/RAB only');
    }

    const alert = await Alert.findById(toObjectId(req.params.id as string));
    if (!alert) throw new AppError(404, 'NOT_FOUND', 'Alert not found');

    alert.status = body.status;
    alert.resolution = cleanInput(body.resolution, 500);
    alert.reviewedBy = new mongoose.Types.ObjectId(req.user._id);
    alert.reviewedAt = new Date();
    await alert.save();

    // Notify alert creator
    if (alert.creatorId) {
      const notif = await Notification.create({
        userId: alert.creatorId,
        type: 'alert_resolved',
        title: body.status === 'resolved' ? 'আপনার অ্যালার্ট সমাধান হয়েছে' : 'আপনার অ্যালার্ট বাতিল করা হয়েছে',
        body: body.resolution,
        data: { alertId: alert._id, status: body.status },
        sentVia: ['push'],
      });
      emitNotification(String(alert.creatorId), notif.toJSON());
    }

    // Emit real-time update
    emitAlertUpdate(alert.toJSON());
    emitAdminEvent('admin:alert_resolved', { alertId: alert._id, status: body.status });

    res.json({ success: true, data: alert.toJSON() });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/emergency/alerts/:id/vote
export async function voteAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const alertId = req.params.id as string;
    const { vote, deviceId: bodyDeviceId } = req.body;
    const deviceId = bodyDeviceId || req.deviceId || null;
    const userId = req.user ? new mongoose.Types.ObjectId(req.user._id) : null;

    if (!userId && !deviceId) {
      throw new AppError(400, 'MISSING_IDENTITY', 'Vote requires an authenticated user or a deviceId');
    }

    if (!vote || !['up', 'down'].includes(vote)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'vote must be "up" or "down"');
    }

    // Find the alert and its linked feed post
    const alert = await Alert.findById(toObjectId(alertId));
    if (!alert || alert.status !== 'active') {
      throw new AppError(404, 'NOT_FOUND', 'Alert not found or not active');
    }

    const feedPost = await FeedPost.findById(alert.originalPostId);
    if (!feedPost) {
      throw new AppError(404, 'NOT_FOUND', 'Linked feed post not found');
    }

    // Apply vote to the linked feed post
    const value = vote === 'up' ? 1 : -1;
    const existingIdx = feedPost.votedBy.findIndex(
      (v) => (userId && v.userId?.equals(userId)) || (deviceId && v.deviceId === deviceId)
    );

    if (existingIdx >= 0) {
      const existing = feedPost.votedBy[existingIdx];
      if (existing.value === value) {
        // Toggle off
        feedPost.votedBy.splice(existingIdx, 1);
        if (value === 1) feedPost.upvotes = Math.max(0, feedPost.upvotes - 1);
        else feedPost.downvotes = Math.max(0, feedPost.downvotes - 1);
      } else {
        // Switch vote
        if (existing.value === 1) { feedPost.upvotes = Math.max(0, feedPost.upvotes - 1); feedPost.downvotes++; }
        else { feedPost.downvotes = Math.max(0, feedPost.downvotes - 1); feedPost.upvotes++; }
        feedPost.votedBy[existingIdx].value = value as 1 | -1;
      }
    } else {
      feedPost.votedBy.push({ userId, deviceId, value: value as 1 | -1 });
      if (value === 1) feedPost.upvotes++;
      else feedPost.downvotes++;
    }

    await feedPost.save();

    // Sync vote counts back to the alert
    alert.upvotes = feedPost.upvotes;
    alert.downvotes = feedPost.downvotes;
    await alert.save();

    // Emit real-time update
    emitAlertUpdate({ ...alert.toJSON(), upvotes: feedPost.upvotes, downvotes: feedPost.downvotes });

    res.json({
      success: true,
      data: {
        upvotes: feedPost.upvotes,
        downvotes: feedPost.downvotes,
        feedPostId: feedPost._id,
      },
    });
  } catch (err) {
    next(err);
  }
}
