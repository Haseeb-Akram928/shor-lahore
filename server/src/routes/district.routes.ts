import { Router } from 'express';
import { listDistricts, createDistrict, getDistrictReports } from '../controllers/district.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createDistrictSchema } from '../validators/district.validator.js';

const router = Router();

router.get('/', listDistricts);
router.post('/', protect, restrictTo('admin'), validate(createDistrictSchema), createDistrict);
router.get('/:id/reports', getDistrictReports);

export default router;
