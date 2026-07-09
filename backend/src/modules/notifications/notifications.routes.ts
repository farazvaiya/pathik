import { Router } from 'express';
import {
  getVapidKey,
  pushSubscribe,
  pushUnsubscribe,
  getNotifications,
  markAsRead,
  sendTestNotification,
} from './notifications.controller';
import { requireAuth, optionalAuth } from '../../middleware/requireAuth';

const router = Router();

router.get('/vapid-key', getVapidKey);
router.post('/subscribe', requireAuth, pushSubscribe);
router.post('/unsubscribe', pushUnsubscribe);
router.get('/', requireAuth, getNotifications);
router.patch('/read', requireAuth, markAsRead);
router.post('/test', requireAuth, sendTestNotification);

export { router as notificationsRouter };
