import { Router } from 'express';
import { getMyImpact, listAdminUsers, updateAdminUser } from '../controllers/user.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { adminUserQuerySchema, updateUserSchema } from '../validators/user.validator.js';

const router = Router();

router.get('/me/impact', protect, getMyImpact);

router.use(protect, restrictTo('admin'));

router.get('/', validate(adminUserQuerySchema, 'query'), listAdminUsers);
router.patch('/:id', validate(updateUserSchema), updateAdminUser);

export default router;
