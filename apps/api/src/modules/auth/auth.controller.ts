import { NextFunction, Request, Response } from 'express';

import { AppError } from '../../core/errors/AppError';
import { authService } from './auth.service';
import { loginBodySchema } from './auth.validator';
import {
  clearRefreshCookie,
  readRefreshCookie,
  setRefreshCookie,
} from './auth.cookie';

export class AuthController {
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = loginBodySchema.parse(req.body);
      const result = await authService.login(input, {
        device: req.headers['x-device-name'] as string | undefined,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      const { refreshToken, ...browserSession } = result;
      setRefreshCookie(res, refreshToken);

      res.status(200).json({
        success: true,
        data: browserSession,
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = readRefreshCookie(req);
      if (!refreshToken) {
        throw new AppError('Invalid or expired refresh token', 401);
      }
      const result = await authService.refreshToken(refreshToken);
      const { refreshToken: rotatedRefreshToken, ...browserSession } = result;
      setRefreshCookie(res, rotatedRefreshToken);

      res.status(200).json({
        success: true,
        data: browserSession,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = readRefreshCookie(req);
    clearRefreshCookie(res);

    try {
      if (refreshToken) {
        try {
          await authService.logout(refreshToken);
        } catch (error) {
          if (!(error instanceof AppError && error.statusCode === 401)) {
            throw error;
          }
        }
      }

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Invalid or expired access token', 401);
      }

      const session = await authService.getCurrentSession(
        req.user.id,
        req.user.organizationId,
      );

      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
