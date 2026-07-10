import { Router } from 'express';
import { optionalAuth } from '../auth/auth.middleware';
import { getRoutes, createRoute, voteOnRoute, getStops, createStop } from './community.controller';

const router = Router();

router.get('/routes', getRoutes);
router.post('/routes', optionalAuth, createRoute);
router.post('/routes/vote', optionalAuth, voteOnRoute);
router.get('/stops', getStops);
router.post('/stops', optionalAuth, createStop);

export { router as communityRouter };
