import { Router } from 'express';
import { handleAiRoute, getRoutesData, getMetroData, getFareData, addRoute, createFeedback, getSafetyScore, handleChat } from './transit.controller';
import { aiRateLimiter } from '../../middleware/rateLimiters';

const router = Router();

router.get('/data/routes', getRoutesData);
router.get('/data/metro', getMetroData);
router.get('/data/fare', getFareData);
router.post('/ai', handleAiRoute);
router.post('/routes', addRoute);
router.post('/feedback', createFeedback);
router.post('/safety-score', getSafetyScore);
router.post('/chat', aiRateLimiter, handleChat);

export { router as transitRouter };
