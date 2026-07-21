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
import { requireTrustedAuthOrigin } from './auth.origin';

const router = Router();

router.post(
  '/login',
  requireTrustedAuthOrigin,
  validateRequest(loginSchema),
  asyncWrapper(authController.login)
);

router.post(
  '/refresh',
  requireTrustedAuthOrigin,
  validateRequest(refreshTokenSchema),
  asyncWrapper(authController.refresh)
);

router.post(
  '/logout',
  requireTrustedAuthOrigin,
  validateRequest(logoutSchema),
  asyncWrapper(authController.logout)
);

router.get(
  '/me',
  requireAuth,
  asyncWrapper(authController.me)
);

export default router;
