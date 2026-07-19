import { Router } from 'express';

import { PERMISSIONS } from '../../../core/auth/permissions';
import { requireAuth } from '../../../core/middlewares/authMiddleware';
import { requirePermission } from '../../../core/middlewares/rbacMiddleware';
import { validateRequest } from '../../../core/middlewares/validateRequest';
import { asyncWrapper } from '../../../core/utils/asyncWrapper';
import { OpportunityController } from './opportunity.controller';
import {
  createOpportunitySchema,
  deleteOpportunitySchema,
  getOpportunitySchema,
  listOpportunitiesSchema,
  updateOpportunitySchema,
} from './opportunity.validator';

const router = Router();
const controller = new OpportunityController();

/**
 * @swagger
 * tags:
 *   name: Opportunities
 *   description: Opportunity management
 */

router.use(requireAuth);

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
router.post(
  '/',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(createOpportunitySchema),
  asyncWrapper(controller.create.bind(controller)),
);

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
router.get(
  '/',
  requirePermission(PERMISSIONS.CRM.READ),
  validateRequest(listOpportunitiesSchema),
  asyncWrapper(controller.getAll.bind(controller)),
);

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
 *           format: uuid
 *     responses:
 *       200:
 *         description: Opportunity details
 */
router.get(
  '/:id',
  requirePermission(PERMISSIONS.CRM.READ),
  validateRequest(getOpportunitySchema),
  asyncWrapper(controller.getOne.bind(controller)),
);

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
 *           format: uuid
 *     responses:
 *       200:
 *         description: Opportunity updated successfully
 */
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(updateOpportunitySchema),
  asyncWrapper(controller.update.bind(controller)),
);

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
 *           format: uuid
 *     responses:
 *       204:
 *         description: Opportunity deleted successfully
 */
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(deleteOpportunitySchema),
  asyncWrapper(controller.delete.bind(controller)),
);

export default router;