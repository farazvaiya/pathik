import { Router } from 'express';
import {
  createSOS,
  getAlerts,
  getNearbyAlerts,
  getAlertById,
  reportSighting,
  confirmSighting,
  flagAlert,
  resolveAlert,
  voteAlert,
} from './emergency.controller';
import { optionalAuth, requireAuth } from '../../middleware/requireAuth';
import { sightingRateLimiter, flagRateLimiter, voteRateLimiter } from '../../middleware/rateLimiters';
import { uploadSingle } from '../feed/feed.upload';

const router = Router();

// SOS / Alert creation (with optional media upload)
router.post('/sos', optionalAuth, uploadSingle('media'), createSOS);

// Alert listing
router.get('/alerts', getAlerts);
router.get('/alerts/nearby', getNearbyAlerts);
router.get('/alerts/:id', getAlertById);

// Voting on alerts (like/dislike)
router.post('/alerts/:id/vote', optionalAuth, voteRateLimiter, voteAlert);

// Sighting system
router.post('/alerts/:id/sighting', optionalAuth, sightingRateLimiter, reportSighting);
router.post('/alerts/:id/confirm', optionalAuth, confirmSighting);

// Flagging
router.post('/alerts/:id/flag', requireAuth, flagRateLimiter, flagAlert);

// Admin resolution
router.post('/alerts/:id/resolve', requireAuth, resolveAlert);

export { router as emergencyRouter };
