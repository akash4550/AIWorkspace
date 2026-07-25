import { Request } from 'express';

export function getNormalizedRoute(req: Request): string {
  const pathname = req.originalUrl.split('?')[0];

  if (!req.route || typeof req.route.path !== 'string') {
    return pathname;
  }

  if (req.route.path === '/') {
    return pathname;
  }

  const routeSegments = req.route.path.split('/').filter(Boolean);
  const pathSegments = pathname.split('/').filter(Boolean);

  const prefixLength = Math.max(0, pathSegments.length - routeSegments.length);
  const prefixSegments = pathSegments.slice(0, prefixLength);
  
  const prefix = prefixSegments.length > 0 ? '/' + prefixSegments.join('/') : '';
  const routePath = req.route.path.startsWith('/') ? req.route.path : `/${req.route.path}`;

  return `${prefix}${routePath}`;
}