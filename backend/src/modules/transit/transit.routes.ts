import { Router } from 'express';
import { handleAiRoute, getRoutesData, getMetroData, getFareData, addRoute, createFeedback } from './transit.controller';

const router = Router();

router.get('/data/routes', getRoutesData);
router.get('/data/metro', getMetroData);
router.get('/data/fare', getFareData);
router.post('/ai', handleAiRoute);
router.post('/routes', addRoute);
router.post('/feedback', createFeedback);

export { router as transitRouter };
