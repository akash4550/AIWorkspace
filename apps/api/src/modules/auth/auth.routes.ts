import { Router } from 'express';

import { authController } from './auth.controller';

import { validateRequest } from '../../core/middlewares/validateRequest';
import { asyncWrapper } from '../../core/utils/asyncWrapper';

import {
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} from './auth.validator';

import { requireAuth } from '../../core/middlewares/authMiddleware';

const router = Router();

router.post(
  '/login',
  validateRequest(loginSchema),
  asyncWrapper(authController.login)
);

router.post(
  '/refresh',
  validateRequest(refreshTokenSchema),
  asyncWrapper(authController.refresh)
);

router.post(
  '/logout',
  requireAuth,
  validateRequest(logoutSchema),
  asyncWrapper(authController.logout)
);

router.get(
  '/me',
  requireAuth,
  asyncWrapper(authController.me)
);

export default router;