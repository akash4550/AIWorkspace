import { Request, Response, NextFunction } from 'express';

import { AppError } from '../errors/AppError';

export type OwnershipChecker = (
  req: Request
) => Promise<boolean>;

export const requireOwnership =
  (checker: OwnershipChecker) =>
  async (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    try {
      const allowed = await checker(req);

      if (!allowed) {
        return next(
          new AppError(
            'You do not have permission to perform this action.',
            403
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };