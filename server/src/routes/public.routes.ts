import { Router } from 'express';
import { getAreaScorecard, getCompare, getInsights, getQuietFinder } from '../controllers/public.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  analyticsPeriodSchema,
  areaScorecardParamsSchema,
  compareQuerySchema,
  quietFinderQuerySchema,
} from '../validators/public.validator.js';

const router = Router();

router.get('/insights', validate(analyticsPeriodSchema, 'query'), getInsights);
router.get('/areas/:id/scorecard', validate(areaScorecardParamsSchema, 'params'), validate(analyticsPeriodSchema, 'query'), getAreaScorecard);
router.get('/compare', validate(compareQuerySchema, 'query'), getCompare);
router.get('/quiet-finder', validate(quietFinderQuerySchema, 'query'), getQuietFinder);

export default router;
