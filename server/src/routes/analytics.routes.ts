import { Router } from 'express';
import {
  getOverview,
  getTrends,
  getByType,
  getByDistrict,
  getByHour,
  getHeatmapGrid,
  getTopReporters,
  getRecentReports,
} from '../controllers/analytics.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all routes under this router - only Admins can view analytics
router.use(protect, restrictTo('admin'));

router.get('/overview', getOverview);
router.get('/trends', getTrends);
router.get('/by-type', getByType);
router.get('/by-district', getByDistrict);
router.get('/by-hour', getByHour);
router.get('/heatmap-grid', getHeatmapGrid);
router.get('/top-reporters', getTopReporters);
router.get('/recent', getRecentReports);

export default router;
