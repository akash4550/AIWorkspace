import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../errors/AppError';

export const requireRole = (...allowedRoles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError('Unauthorized', 401));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError('Forbidden - Insufficient permissions', 403));
        }

        next();
    };
};
