import { Router } from 'express';

import { UserController } from './user.controller';

import { requireAuth } from '../../core/middlewares/authMiddleware';

import { requirePermission } from '../../core/middlewares/rbacMiddleware';

import { validateRequest } from '../../core/middlewares/validateRequest';

import {
  createUserSchema,
  updateOwnProfileSchema,
  updateUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  deleteUserSchema,
  getUserSchema,
  listUsersSchema,
} from './user.validator';

import { PERMISSIONS } from '../../core/auth/permissions';



const router = Router();

const controller = new UserController();




// Authentication required for all user routes

router.use(requireAuth);





router.get(

  '/',

  requirePermission(PERMISSIONS.USER.READ),

  validateRequest(listUsersSchema),

  controller.getUsers

);





router.get(

  '/:id',

  requirePermission(PERMISSIONS.USER.READ),

  validateRequest(getUserSchema),

  controller.getUserById

);





router.post(

  '/',

  requirePermission(PERMISSIONS.USER.CREATE),

  validateRequest(createUserSchema),

  controller.createUser

);





router.patch(

  '/me',

  validateRequest(updateOwnProfileSchema),

  controller.updateOwnProfile

);






router.patch(

  '/:id',

  requirePermission(PERMISSIONS.USER.UPDATE),

  validateRequest(updateUserSchema),

  controller.updateUser

);





router.patch(

  '/:id/role',

  requirePermission(PERMISSIONS.USER.UPDATE),

  validateRequest(updateUserRoleSchema),

  controller.updateUserRole

);






router.patch(

  '/:id/status',

  requirePermission(PERMISSIONS.USER.UPDATE),

  validateRequest(updateUserStatusSchema),

  controller.updateUserStatus

);





router.delete(

  '/:id',

  requirePermission(PERMISSIONS.USER.DELETE),

  validateRequest(deleteUserSchema),

  controller.deleteUser

);




export default router;
