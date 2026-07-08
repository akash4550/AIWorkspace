import { Router } from 'express';
import { AIController } from './ai.controller';
import { requireAuth } from '../../core/middlewares/authMiddleware';

const router = Router();
const controller = new AIController();

// Use authentication and organization isolation middleware
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI Intelligence Layer endpoints
 */

/**
 * @swagger
 * /ai/tasks/{taskId}/summary:
 *   get:
 *     summary: Generate an AI summary of a specific task
 *     tags: [AI]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task summary text
 */
router.get('/tasks/:taskId/summary', controller.summarizeTask.bind(controller));

/**
 * @swagger
 * /ai/assistant/ask:
 *   post:
 *     summary: Ask the AI Workspace Assistant a question
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *               contextType:
 *                 type: string
 *                 enum: [GLOBAL, TASK, PROJECT, CRM]
 *               entityId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assistant response
 */
router.post('/assistant/ask', controller.askAssistant.bind(controller));

export default router;
