import { Request, Response, NextFunction } from 'express';

import { AuthService } from './auth.service';
import { AppError } from '../../core/errors/AppError';

import { prisma } from '../../config/prisma';

const authService = new AuthService();

export class AuthController {
  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email, password, organizationId } = req.body;

      if (!email || !password) {
        throw new AppError(
          'Email and password are required',
          400
        );
      }

      const result = await authService.login(
        { email, password, organizationId },
        {
          device: req.headers['x-device-name'] as string | undefined,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { refreshToken } = req.body;

      const result = await authService.refreshToken(
        refreshToken
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { refreshToken } = req.body;

      await authService.logout(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const user = await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
        select: {
          id: true,
          organizationId: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          avatar: true,
          isActive: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();