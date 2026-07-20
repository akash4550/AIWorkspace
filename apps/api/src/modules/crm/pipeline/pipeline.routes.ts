import { Router } from 'express';

import { PERMISSIONS } from '../../../core/auth/permissions';
import { requireAuth } from '../../../core/middlewares/authMiddleware';
import { requirePermission } from '../../../core/middlewares/rbacMiddleware';
import { validateRequest } from '../../../core/middlewares/validateRequest';
import { asyncWrapper } from '../../../core/utils/asyncWrapper';
import { PipelineStageController } from './pipeline.controller';
import {
  createPipelineStageSchema,
  deletePipelineStageSchema,
  getPipelineStageSchema,
  listPipelineStagesSchema,
  reorderStagesSchema,
  updatePipelineStageSchema,
} from './pipeline.validator';

const router = Router();
const controller = new PipelineStageController();

router.use(requireAuth);

router.post(
  '/reorder',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(reorderStagesSchema),
  asyncWrapper(controller.reorder.bind(controller)),
);

router.post(
  '/',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(createPipelineStageSchema),
  asyncWrapper(controller.create.bind(controller)),
);

router.get(
  '/',
  requirePermission(PERMISSIONS.CRM.READ),
  validateRequest(listPipelineStagesSchema),
  asyncWrapper(controller.getAll.bind(controller)),
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.CRM.READ),
  validateRequest(getPipelineStageSchema),
  asyncWrapper(controller.getOne.bind(controller)),
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(updatePipelineStageSchema),
  asyncWrapper(controller.update.bind(controller)),
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(deletePipelineStageSchema),
  asyncWrapper(controller.delete.bind(controller)),
);

export default router;