import { Router } from 'express';
import { ProjectController } from './project.controller';
import { requireAuth } from '../../core/middlewares/authMiddleware';
import { requireRole } from '../../core/middlewares/rbacMiddleware';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { createProjectSchema, updateProjectSchema } from './project.validator';
import { asyncWrapper } from '../../core/utils/asyncWrapper';

const router = Router();
const controller = new ProjectController();

router.use(requireAuth);

router.get('/', asyncWrapper(controller.getProjects));
router.get('/:id', asyncWrapper(controller.getProjectById));

router.post(
    '/',
    requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    validateRequest(createProjectSchema),
    asyncWrapper(controller.createProject)
);

router.patch(
    '/:id',
    requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    validateRequest(updateProjectSchema),
    asyncWrapper(controller.updateProject)
);

router.patch(
    '/:id/archive',
    requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    asyncWrapper(controller.archiveProject)
);

router.patch(
    '/:id/restore',
    requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    asyncWrapper(controller.restoreProject)
);

router.delete(
    '/:id',
    requireRole('SUPER_ADMIN', 'ADMIN'), // Employees and Managers cannot delete
    asyncWrapper(controller.deleteProject)
);

export default router;
