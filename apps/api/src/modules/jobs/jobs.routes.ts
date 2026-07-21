import { Router } from 'express';
import { JobsController } from './jobs.controller';
import { requireRole } from '../../core/middlewares/rbacMiddleware';
import { Role } from '@prisma/client';

const router = Router();
const controller = new JobsController();

// All job queue endpoints are strictly administrative
router.use(requireRole(Role.SUPER_ADMIN));

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Background job queue administration
 */

/**
 * @swagger
 * /jobs/status:
 *   get:
 *     summary: Get status of all background queues
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Array of queue statuses and counts
 */
router.get('/status', controller.getQueueStatus.bind(controller));

/**
 * @swagger
 * /jobs/retry:
 *   post:
 *     summary: Retry all failed jobs in a specific queue
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               queueName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Number of jobs retried
 */
router.post('/retry', controller.retryFailedJobs.bind(controller));

/**
 * @swagger
 * /jobs/failed/{queueName}:
 *   get:
 *     summary: Get recent failed jobs for a specific queue
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of failed jobs with stacktraces
 */
router.get('/failed/:queueName', controller.getFailedJobs.bind(controller));

export default router;
