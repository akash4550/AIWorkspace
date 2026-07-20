import { Role } from '@prisma/client';
import { Router } from 'express';

import { requireAuth } from '../../core/middlewares/authMiddleware';
import { requireRole } from '../../core/middlewares/rbacMiddleware';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { asyncWrapper } from '../../core/utils/asyncWrapper';
import { AnalyticsController } from './analytics.controller';
import {
  GetMetricSchema,
  GetReportSchema,
} from './analytics.dto';

const router = Router();
const controller = new AnalyticsController();

const requireAnalyticsAccess = requireRole(
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.MANAGER,
);

router.use(requireAuth);

router.get(
  '/metrics/:metricName',
  requireAnalyticsAccess,
  validateRequest(GetMetricSchema),
  asyncWrapper(controller.getMetric.bind(controller)),
);

router.get(
  '/reports/:reportType',
  requireAnalyticsAccess,
  validateRequest(GetReportSchema),
  asyncWrapper(controller.getReport.bind(controller)),
);

export default router;