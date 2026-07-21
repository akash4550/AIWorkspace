import { Router } from 'express';

import { PERMISSIONS } from '../../core/auth/permissions';
import { requireAuth } from '../../core/middlewares/authMiddleware';
import { requirePermission } from '../../core/middlewares/rbacMiddleware';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { asyncWrapper } from '../../core/utils/asyncWrapper';
import { AIController } from './ai.controller';
import {
  AskAssistantSchema,
  SummarizeTaskSchema,
} from './ai.dto';

const router = Router();
const controller = new AIController();

router.use(requireAuth);
router.use(requirePermission(PERMISSIONS.AI.USE));

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
 *           format: uuid
 *     responses:
 *       200:
 *         description: Task summary text
 *       400:
 *         description: Invalid task identifier
 *       401:
 *         description: Authentication required
 *       403:
 *         description: AI permission required
 *       404:
 *         description: Task not found
 */
router.get(
  '/tasks/:taskId/summary',
  validateRequest(SummarizeTaskSchema),
  asyncWrapper(
    controller.summarizeTask.bind(controller),
  ),
);

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
 *             oneOf:
 *               - type: object
 *                 additionalProperties: false
 *                 required:
 *                   - query
 *                   - contextType
 *                 properties:
 *                   query:
 *                     type: string
 *                     minLength: 1
 *                     maxLength: 2000
 *                   contextType:
 *                     type: string
 *                     enum: [GLOBAL]
 *               - type: object
 *                 additionalProperties: false
 *                 required:
 *                   - query
 *                   - contextType
 *                   - entityId
 *                 properties:
 *                   query:
 *                     type: string
 *                     minLength: 1
 *                     maxLength: 2000
 *                   contextType:
 *                     type: string
 *                     enum: [TASK, PROJECT]
 *                   entityId:
 *                     type: string
 *                     format: uuid
 *     responses:
 *       200:
 *         description: Assistant response
 *       400:
 *         description: Invalid assistant request
 *       401:
 *         description: Authentication required
 *       403:
 *         description: AI permission required
 *       404:
 *         description: Context entity not found
 */
router.post(
  '/assistant/ask',
  validateRequest(AskAssistantSchema),
  asyncWrapper(
    controller.askAssistant.bind(controller),
  ),
);

export default router;