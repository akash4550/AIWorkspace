import { Router } from 'express';

import { PERMISSIONS } from '../../../core/auth/permissions';
import { requireAuth } from '../../../core/middlewares/authMiddleware';
import { requirePermission } from '../../../core/middlewares/rbacMiddleware';
import { validateRequest } from '../../../core/middlewares/validateRequest';
import { asyncWrapper } from '../../../core/utils/asyncWrapper';
import { LeadController } from './lead.controller';
import {
  createLeadSchema,
  deleteLeadSchema,
  getLeadSchema,
  listLeadsSchema,
  updateLeadSchema,
} from './lead.validator';

const router = Router();
const controller = new LeadController();

router.use(requireAuth);

router.post(
  '/',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(createLeadSchema),
  asyncWrapper(controller.create.bind(controller)),
);

router.get(
  '/',
  requirePermission(PERMISSIONS.CRM.READ),
  validateRequest(listLeadsSchema),
  asyncWrapper(controller.getAll.bind(controller)),
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.CRM.READ),
  validateRequest(getLeadSchema),
  asyncWrapper(controller.getOne.bind(controller)),
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(updateLeadSchema),
  asyncWrapper(controller.update.bind(controller)),
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(deleteLeadSchema),
  asyncWrapper(controller.delete.bind(controller)),
);

export default router;