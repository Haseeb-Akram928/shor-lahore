import { Router } from 'express';
import {
  createReport,
  deleteReport,
  getHeatmapReports,
  getNearbyReports,
  getRecentReports,
  listAdminReports,
  updateReportStatus,
  upvoteReport,
} from '../controllers/report.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { reportLimiter } from '../middleware/rateLimiter.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createReportSchema,
  adminReportQuerySchema,
  heatmapQuerySchema,
  nearbyQuerySchema,
  recentQuerySchema,
  updateReportStatusSchema,
} from '../validators/report.validator.js';

const router = Router();

router.get('/recent', validate(recentQuerySchema, 'query'), getRecentReports);
router.get('/nearby', validate(nearbyQuerySchema, 'query'), getNearbyReports);
router.get('/heatmap', validate(heatmapQuerySchema, 'query'), getHeatmapReports);
router.get('/admin', protect, restrictTo('admin'), validate(adminReportQuerySchema, 'query'), listAdminReports);
router.post('/', protect, reportLimiter, validate(createReportSchema), createReport);
router.post('/:id/upvote', protect, upvoteReport);
router.patch('/:id/status', protect, restrictTo('admin'), validate(updateReportStatusSchema), updateReportStatus);
router.delete('/:id', protect, restrictTo('admin'), deleteReport);

export default router;
