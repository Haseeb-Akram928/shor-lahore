import { Router } from 'express';
import {
  createReport,
  getHeatmapReports,
  getNearbyReports,
  getRecentReports,
  upvoteReport,
} from '../controllers/report.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { reportLimiter } from '../middleware/rateLimiter.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createReportSchema,
  heatmapQuerySchema,
  nearbyQuerySchema,
  recentQuerySchema,
} from '../validators/report.validator.js';

const router = Router();

router.get('/recent', validate(recentQuerySchema, 'query'), getRecentReports);
router.get('/nearby', validate(nearbyQuerySchema, 'query'), getNearbyReports);
router.get('/heatmap', validate(heatmapQuerySchema, 'query'), getHeatmapReports);
router.post('/', protect, reportLimiter, validate(createReportSchema), createReport);
router.post('/:id/upvote', protect, upvoteReport);

export default router;
