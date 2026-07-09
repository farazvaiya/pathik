import webpush from 'web-push';
import mongoose, { Schema, Document } from 'mongoose';
import { logger } from '../utils/logger';

// VAPID keys — generate with `npx web-push generate-vapid-keys`
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@pathik.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Push subscription model
export interface IPushSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
  createdAt: Date;
  lastUsedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  userAgent: { type: String, default: null },
  lastUsedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Declare indexes only via schema.index() to avoid Mongoose duplicate-index warnings
PushSubscriptionSchema.index({ userId: 1 });
PushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

export const PushSubscription = mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);

// Subscribe
export async function subscribe(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, userAgent?: string) {
  return PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    { userId, keys: subscription.keys, userAgent, lastUsedAt: new Date() },
    { upsert: true, new: true }
  );
}

// Unsubscribe
export async function unsubscribe(endpoint: string) {
  return PushSubscription.deleteOne({ endpoint });
}

// Send push notification to a user
export async function sendPushNotification(userId: string, payload: { title: string; body: string; icon?: string; url?: string; data?: any }) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    logger.warn('VAPID keys not configured, skipping push notification');
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await PushSubscription.find({ userId });
  let sent = 0;
  let failed = 0;

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    url: payload.url || '/',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    tag: 'pathik-notification',
    renotify: true,
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        notificationPayload
      );
      sub.lastUsedAt = new Date();
      await sub.save();
      sent++;
    } catch (err: any) {
      failed++;
      // Remove expired/invalid subscriptions
      if (err.statusCode === 404 || err.statusCode === 410) {
        await PushSubscription.deleteOne({ _id: sub._id });
        logger.debug(`Removed expired push subscription for user ${userId}`);
      }
    }
  }

  return { sent, failed };
}

// Send push notification to multiple users
export async function sendBulkPushNotification(userIds: string[], payload: { title: string; body: string; icon?: string; url?: string; data?: any }) {
  const results = await Promise.allSettled(
    userIds.map(userId => sendPushNotification(userId, payload))
  );

  return results.reduce(
    (acc, r) => {
      if (r.status === 'fulfilled') {
        acc.sent += r.value.sent;
        acc.failed += r.value.failed;
      }
      return acc;
    },
    { sent: 0, failed: 0 }
  );
}

// Get VAPID public key (for frontend)
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
