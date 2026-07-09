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
} from './emergency.controller';
import { optionalAuth, requireAuth } from '../../middleware/requireAuth';
import { sightingRateLimiter, flagRateLimiter } from '../../middleware/rateLimiters';

const router = Router();

// SOS / Alert creation
router.post('/sos', optionalAuth, createSOS);

// Alert listing
router.get('/alerts', getAlerts);
router.get('/alerts/nearby', getNearbyAlerts);
router.get('/alerts/:id', getAlertById);

// Sighting system
router.post('/alerts/:id/sighting', optionalAuth, sightingRateLimiter, reportSighting);
router.post('/alerts/:id/confirm', optionalAuth, confirmSighting);

// Flagging
router.post('/alerts/:id/flag', requireAuth, flagRateLimiter, flagAlert);

// Admin resolution
router.post('/alerts/:id/resolve', requireAuth, resolveAlert);

export { router as emergencyRouter };
