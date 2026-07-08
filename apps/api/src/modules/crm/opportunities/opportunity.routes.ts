import { Router } from 'express';
import { OpportunityController } from './opportunity.controller';

const router = Router();
const controller = new OpportunityController();

/**
 * @swagger
 * tags:
 *   name: Opportunities
 *   description: Opportunity management
 */

/**
 * @swagger
 * /crm/opportunities:
 *   post:
 *     summary: Create a new opportunity
 *     tags: [Opportunities]
 *     responses:
 *       201:
 *         description: Opportunity created successfully
 */
router.post('/', controller.create.bind(controller));

/**
 * @swagger
 * /crm/opportunities:
 *   get:
 *     summary: Get all opportunities for the organization
 *     tags: [Opportunities]
 *     responses:
 *       200:
 *         description: A list of opportunities
 */
router.get('/', controller.getAll.bind(controller));

/**
 * @swagger
 * /crm/opportunities/{id}:
 *   get:
 *     summary: Get a specific opportunity by ID
 *     tags: [Opportunities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Opportunity details
 */
router.get('/:id', controller.getOne.bind(controller));

/**
 * @swagger
 * /crm/opportunities/{id}:
 *   patch:
 *     summary: Update an opportunity
 *     tags: [Opportunities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Opportunity updated successfully
 */
router.patch('/:id', controller.update.bind(controller));

/**
 * @swagger
 * /crm/opportunities/{id}:
 *   delete:
 *     summary: Soft delete an opportunity
 *     tags: [Opportunities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Opportunity deleted successfully
 */
router.delete('/:id', controller.delete.bind(controller));

export default router;
