import { Router } from 'express';
import { listDistricts, createDistrict, getDistrictReports } from '../controllers/district.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', listDistricts);
router.post('/', protect, restrictTo('admin'), createDistrict);
router.get('/:id/reports', getDistrictReports);

export default router;
