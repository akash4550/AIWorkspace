import { Router } from 'express';
import { SystemController } from './system.controller';

const router = Router();
const controller = new SystemController();

/**
 * @swagger
 * /system/live:
 *   get:
 *     summary: Liveness probe
 *     tags: [System]
 */
router.get('/live', controller.checkLiveness.bind(controller));

/**
 * @swagger
 * /system/ready:
 *   get:
 *     summary: Readiness probe (Checks DB/Redis)
 *     tags: [System]
 */
router.get('/ready', controller.checkReadiness.bind(controller));

// Alias for general health
router.get('/health', controller.checkReadiness.bind(controller));

export default router;
