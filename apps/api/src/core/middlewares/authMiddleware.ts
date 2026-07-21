import { Request, Response, NextFunction } from 'express';

import { AuthService } from '../../modules/auth/auth.service';
import { AppError } from '../errors/AppError';

const authService = new AuthService();

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(
        new AppError('Authorization header is missing', 401)
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      return next(
        new AppError('Invalid authorization header format', 401)
      );
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return next(
        new AppError('Authentication token is required', 401)
      );
    }

    const user = await authService.authenticate(token);

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};