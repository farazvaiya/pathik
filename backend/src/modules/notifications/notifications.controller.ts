import { Request, Response, NextFunction } from 'express';
import { subscribe, unsubscribe, getVapidPublicKey, sendPushNotification } from '../../services/pushNotifications';
import { Notification } from '../../models/Notification';
import { AppError } from '../../middleware/errorHandler';

// GET /api/v1/notifications/vapid-key
export async function getVapidKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const key = getVapidPublicKey();
    res.json({ success: true, data: { publicKey: key } });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/notifications/subscribe
export async function pushSubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid subscription payload');
    }

    await subscribe(req.user._id, { endpoint, keys }, req.headers['user-agent']);
    res.json({ success: true, message: 'Push subscription saved' });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/notifications/unsubscribe
export async function pushUnsubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { endpoint } = req.body;
    if (!endpoint) throw new AppError(400, 'VALIDATION_ERROR', 'Endpoint is required');

    await unsubscribe(endpoint);
    res.json({ success: true, message: 'Push subscription removed' });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/notifications
export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId: req.user._id }),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page < Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/notifications/read
export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

    const { ids } = req.body;
    if (ids && Array.isArray(ids)) {
      await Notification.updateMany(
        { _id: { $in: ids }, userId: req.user._id },
        { isRead: true, readAt: new Date() }
      );
    } else {
      await Notification.updateMany(
        { userId: req.user._id, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    }

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/notifications/test (admin only)
export async function sendTestNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    if (req.user.role !== 'admin') throw new AppError(403, 'FORBIDDEN', 'Admin only');

    const { userId, title, body } = req.body;
    if (!userId || !title) throw new AppError(400, 'VALIDATION_ERROR', 'userId and title required');

    const result = await sendPushNotification(userId, { title, body: body || '' });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
