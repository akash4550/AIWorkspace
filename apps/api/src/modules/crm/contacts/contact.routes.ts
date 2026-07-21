import { Router } from 'express';

import { PERMISSIONS } from '../../../core/auth/permissions';
import { requireAuth } from '../../../core/middlewares/authMiddleware';
import { requirePermission } from '../../../core/middlewares/rbacMiddleware';
import { validateRequest } from '../../../core/middlewares/validateRequest';
import { asyncWrapper } from '../../../core/utils/asyncWrapper';
import { ContactController } from './contact.controller';
import {
  createContactSchema,
  deleteContactSchema,
  getContactSchema,
  listContactsSchema,
  updateContactSchema,
} from './contact.validator';

const router = Router();
const controller = new ContactController();

router.use(requireAuth);

router.post(
  '/',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(createContactSchema),
  asyncWrapper(controller.create.bind(controller)),
);

router.get(
  '/',
  requirePermission(PERMISSIONS.CRM.READ),
  validateRequest(listContactsSchema),
  asyncWrapper(controller.getAll.bind(controller)),
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.CRM.READ),
  validateRequest(getContactSchema),
  asyncWrapper(controller.getOne.bind(controller)),
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(updateContactSchema),
  asyncWrapper(controller.update.bind(controller)),
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(deleteContactSchema),
  asyncWrapper(controller.delete.bind(controller)),
);

export default router;