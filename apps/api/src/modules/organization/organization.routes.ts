import { Router } from 'express';
import { OrganizationController } from './organization.controller';
import { requireAuth } from '../../core/middlewares/authMiddleware';
import { requireRole } from '../../core/middlewares/rbacMiddleware';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { updateOrganizationSchema } from './organization.validator';
import { asyncWrapper } from '../../core/utils/asyncWrapper';

const router = Router();
const controller = new OrganizationController();

router.use(requireAuth);

router.get('/', asyncWrapper(controller.getOrganization));

router.patch(
    '/',
    requireRole('SUPER_ADMIN', 'ADMIN'),
    validateRequest(updateOrganizationSchema),
    asyncWrapper(controller.updateOrganization)
);

export default router;
