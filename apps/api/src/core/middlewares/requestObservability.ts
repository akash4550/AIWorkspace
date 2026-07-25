import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import {getNormalizedRoute} from '../utils/requestRoute';
import { recordHttpRequest } from '../metrics/httpMetrics';

export const requestObservability = (req: Request, res: Response, next: NextFunction) => {
  const headerValue = req.get('x-request-id');

  let requestId: string;
  if (typeof headerValue === 'string' && /^[a-zA-Z0-9._:-]{1,128}$/.test(headerValue)) {
    requestId = headerValue;
  } else {
    requestId = randomUUID();
  }

  req.requestId = requestId;
  req.requestStartedAt = performance.now();

  res.setHeader('x-request-id', requestId);

  res.once('finish', () => {
    const durationMs = performance.now() - req.requestStartedAt;
    
    const route = getNormalizedRoute(req);
    recordHttpRequest({
    method: req.method,
    route: route,
    status: res.statusCode,
    durationSeconds: durationMs / 1000
  });

  // Existing logger call stays here
    logger.info('HTTP request completed', {
      requestId: req.requestId,
      method: req.method,
      route,
      status: res.statusCode,
      durationMs,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
    });
  });

  next();
};