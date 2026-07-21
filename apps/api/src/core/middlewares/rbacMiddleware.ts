import { Request, Response, NextFunction } from 'express';

import { Role } from '@prisma/client';

import { AppError } from '../errors/AppError';

import { Permission } from '../auth/permissions';

import { ROLE_PERMISSIONS } from '../auth/rolePermissions';





export const requireRole = (
  ...allowedRoles: Role[]
) => {

  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {


    if (!req.user) {

      return next(
        new AppError(
          'Unauthorized',
          401
        )
      );

    }



    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {

      return next(
        new AppError(
          'Forbidden - Insufficient permissions',
          403
        )
      );

    }



    next();

  };

};








export const requirePermission = (
  permission: Permission
) => {


  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {


    if (!req.user) {

      return next(
        new AppError(
          'Unauthorized',
          401
        )
      );

    }



    const userPermissions =
      ROLE_PERMISSIONS[
        req.user.role
      ];



    if (
      !userPermissions.includes(
        permission
      )
    ) {

      return next(
        new AppError(
          'Forbidden - Missing permission',
          403
        )
      );

    }



    next();

  };

};