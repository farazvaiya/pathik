import { Router } from 'express';
import {
  getDashboard,
  getAdminAlerts,
  getHeatmapData,
  getSightingClusters,
  verifyUser,
  reviewPost,
  getPendingReviews,
} from './admin.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { roleGuard } from '../auth/auth.middleware';

const router = Router();

// All admin routes require auth + admin/police/rab role
router.use(requireAuth, roleGuard('admin', 'police', 'rab'));

router.get('/dashboard', getDashboard);
router.get('/alerts', getAdminAlerts);
router.get('/heatmap', getHeatmapData);
router.get('/sighting-clusters', getSightingClusters);
router.post('/verify-user', roleGuard('admin'), verifyUser);
router.get('/pending-reviews', getPendingReviews);
router.post('/review/:id', reviewPost);

export { router as adminRouter };
