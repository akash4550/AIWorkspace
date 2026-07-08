import { Router } from 'express';
import { TaskController } from './task.controller';
import { requireAuth } from '../../core/middlewares/authMiddleware';
import { requireRole } from '../../core/middlewares/rbacMiddleware';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { createTaskSchema, updateTaskSchema, moveTaskSchema } from './task.validator';
import { asyncWrapper } from '../../core/utils/asyncWrapper';

const router = Router();
const controller = new TaskController();

router.use(requireAuth);

router.get('/', asyncWrapper(controller.getTasks));
router.get('/:id', asyncWrapper(controller.getTaskById));

// Employees can create tasks
router.post(
    '/',
    requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'),
    validateRequest(createTaskSchema),
    asyncWrapper(controller.createTask)
);

// Updates to core info
router.patch(
    '/:id',
    requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'),
    validateRequest(updateTaskSchema),
    asyncWrapper(controller.updateTask)
);

// Drag and drop movement
router.patch(
    '/:id/move',
    requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'),
    validateRequest(moveTaskSchema),
    asyncWrapper(controller.moveTask)
);

// Assignment
router.patch(
    '/:id/assign',
    requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    asyncWrapper(controller.assignTask)
);

// Archiving
router.patch(
    '/:id/archive',
    requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    asyncWrapper(controller.archiveTask)
);

router.patch(
    '/:id/restore',
    requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    asyncWrapper(controller.restoreTask)
);

// Deletion (Employees cannot delete)
router.delete(
    '/:id',
    requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    asyncWrapper(controller.deleteTask)
);

export default router;
