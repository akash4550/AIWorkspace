import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodType } from 'zod';

import { AppError } from '../errors/AppError';

export const validateRequest = (schema: ZodType) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map((issue) => issue.message).join(',');
        next(new AppError(`Validation failed: ${message}`, 400));
        return;
      }

      next(error);
    }
  };
};

export const getValidatedRequest = <T>(req: Request): T => {
  if (req.validated === undefined) {
    throw new AppError('Validated request data is unavailable', 500);
  }

  return req.validated as T;
};
