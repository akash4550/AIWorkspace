import { Router } from 'express';

import { PERMISSIONS } from '../../../core/auth/permissions';
import { requireAuth } from '../../../core/middlewares/authMiddleware';
import { requirePermission } from '../../../core/middlewares/rbacMiddleware';
import { validateRequest } from '../../../core/middlewares/validateRequest';
import { asyncWrapper } from '../../../core/utils/asyncWrapper';
import { CRMActivityController } from './activity.controller';
import {
  createCRMActivitySchema,
  listCRMActivitiesSchema,
} from './activity.validator';

const router = Router();
const controller = new CRMActivityController();

router.use(requireAuth);

router.post(
  '/',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(createCRMActivitySchema),
  asyncWrapper(controller.create.bind(controller)),
);

router.get(
  '/',
  requirePermission(PERMISSIONS.CRM.READ),
  validateRequest(listCRMActivitiesSchema),
  asyncWrapper(controller.getAll.bind(controller)),
);

export default router;