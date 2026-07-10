import { Router } from 'express';
import { getRoutes, createRoute, voteOnRoute, getStops, createStop } from './community.controller';

const router = Router();

router.get('/routes', getRoutes);
router.post('/routes', createRoute);
router.post('/routes/vote', voteOnRoute);
router.get('/stops', getStops);
router.post('/stops', createStop);

export { router as communityRouter };
