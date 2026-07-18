import { Request, Response, NextFunction } from 'express';

import { ROLE_PERMISSIONS } from '../auth/rolePermissions';
import { Permission } from '../auth/permissions';
import { AppError } from '../errors/AppError';

export const authorize =
  (...requiredPermissions: Permission[]) =>
  (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const permissions =
      ROLE_PERMISSIONS[req.user.role] ?? [];

    const authorized = requiredPermissions.every((permission) =>
      permissions.includes(permission)
    );

    if (!authorized) {
      return next(
        new AppError(
          'You do not have permission to perform this action.',
          403
        )
      );
    }

    next();
  };