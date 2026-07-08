import { Router } from 'express';
import { UserController } from './user.controller';
import { requireAuth } from '../../core/middlewares/authMiddleware';
import { requireRole } from '../../core/middlewares/rbacMiddleware';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { createUserSchema, updateUserSchema, updateUserStatusSchema } from './user.validator';
import { asyncWrapper } from '../../core/utils/asyncWrapper';

const router = Router();
const controller = new UserController();

router.use(requireAuth);

router.get('/', asyncWrapper(controller.getUsers));
router.get('/:id', asyncWrapper(controller.getUserById));

router.post(
    '/',
    requireRole('SUPER_ADMIN', 'ADMIN'),
    validateRequest(createUserSchema),
    asyncWrapper(controller.createUser)
);

// Note: In a real app, users should be able to update their *own* profile.
// For enterprise admin management, we restrict this route to ADMIN/SUPER_ADMIN 
// or check if `req.user.id === req.params.id` in the controller.
router.patch(
    '/:id',
    requireRole('SUPER_ADMIN', 'ADMIN'), // Simplification for user management dashboard
    validateRequest(updateUserSchema),
    asyncWrapper(controller.updateUser)
);

router.patch(
    '/:id/status',
    requireRole('SUPER_ADMIN', 'ADMIN'),
    validateRequest(updateUserStatusSchema),
    asyncWrapper(controller.updateUserStatus)
);

router.delete(
    '/:id',
    requireRole('SUPER_ADMIN', 'ADMIN'),
    asyncWrapper(controller.deleteUser)
);

export default router;
