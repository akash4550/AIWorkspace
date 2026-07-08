import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { GetMetricSchema, GetReportSchema } from './analytics.dto';
import { requireRole } from '../../core/middlewares/rbacMiddleware';

const router = Router();
const controller = new AnalyticsController();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics and Reporting engine
 */

/**
 * @swagger
 * /analytics/metrics/{metricName}:
 *   get:
 *     summary: Get a specific KPI metric
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: metricName
 *         required: true
 *         schema:
 *           type: string
 *         description: e.g. ACTIVE_USERS, PROJECTS_CREATED
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Metric calculation result
 */
router.get(
  '/metrics/:metricName',
  validateRequest(GetMetricSchema),
  controller.getMetric.bind(controller)
);

/**
 * @swagger
 * /analytics/reports/{reportType}:
 *   get:
 *     summary: Get a pre-compiled report bundle
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *         description: e.g. EXECUTIVE_SUMMARY, PROJECT_HEALTH
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Compiled report with multiple metrics
 */
router.get(
  '/reports/:reportType',
  validateRequest(GetReportSchema),
  controller.getReport.bind(controller)
);

export default router;
