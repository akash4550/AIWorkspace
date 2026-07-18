import { Router } from 'express';

import { TaskController } from './task.controller';
import { canUpdateTask } from './task.permissions';
import {
  createTaskSchema,
  moveTaskSchema,
  updateTaskSchema,
} from './task.validator';

import { requireAuth } from '../../core/middlewares/authMiddleware';
import { authorize } from '../../core/middlewares/authorize';
import { requireOwnership } from '../../core/middlewares/ownership';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { asyncWrapper } from '../../core/utils/asyncWrapper';
import { PERMISSIONS } from '../../core/auth/permissions';

const router = Router();
const controller = new TaskController();

router.use(requireAuth);

router.get(
  '/',
  authorize(PERMISSIONS.TASK.READ),
  asyncWrapper(controller.getTasks)
);

router.get(
  '/:id',
  authorize(PERMISSIONS.TASK.READ),
  asyncWrapper(controller.getTaskById)
);

router.post(
  '/',
  authorize(PERMISSIONS.TASK.CREATE),
  validateRequest(createTaskSchema),
  asyncWrapper(controller.createTask)
);

router.patch(
  '/:id',
  authorize(PERMISSIONS.TASK.UPDATE),
  requireOwnership(canUpdateTask),
  validateRequest(updateTaskSchema),
  asyncWrapper(controller.updateTask)
);

router.patch(
  '/:id/move',
  authorize(PERMISSIONS.TASK.UPDATE),
  validateRequest(moveTaskSchema),
  asyncWrapper(controller.moveTask)
);

router.patch(
  '/:id/assign',
  authorize(PERMISSIONS.TASK.ASSIGN),
  asyncWrapper(controller.assignTask)
);

router.patch(
  '/:id/archive',
  authorize(PERMISSIONS.TASK.ARCHIVE),
  asyncWrapper(controller.archiveTask)
);

router.patch(
  '/:id/restore',
  authorize(PERMISSIONS.TASK.ARCHIVE),
  asyncWrapper(controller.restoreTask)
);

router.delete(
  '/:id',
  authorize(PERMISSIONS.TASK.DELETE),
  asyncWrapper(controller.deleteTask)
);

export default router;