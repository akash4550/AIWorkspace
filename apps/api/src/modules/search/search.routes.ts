import { Router } from 'express';
import { SearchController } from './search.controller';
import { requireAuth } from '../../core/middlewares/authMiddleware';

const router = Router();
const controller = new SearchController();

// Use authentication and organization isolation middleware
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Global Search & Knowledge Platform endpoints
 */

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Perform a global search across modules
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: The search term
 *       - in: query
 *         name: modules
 *         required: false
 *         schema:
 *           type: string
 *         description: Comma-separated list of modules to search (e.g., projects,tasks,crm)
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         required: false
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Search results payload
 */
router.get('/', controller.globalSearch.bind(controller));

export default router;
