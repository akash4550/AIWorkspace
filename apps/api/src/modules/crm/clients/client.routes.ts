import { Router } from 'express';

import { PERMISSIONS } from '../../../core/auth/permissions';
import { requireAuth } from '../../../core/middlewares/authMiddleware';
import { requirePermission } from '../../../core/middlewares/rbacMiddleware';
import { validateRequest } from '../../../core/middlewares/validateRequest';
import { asyncWrapper } from '../../../core/utils/asyncWrapper';
import { ClientController } from './client.controller';
import {
  createClientSchema,
  deleteClientSchema,
  getClientSchema,
  listClientsSchema,
  updateClientSchema,
} from './client.validator';

const router = Router();
const controller = new ClientController();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Client management
 */

/**
 * @swagger
 * /crm/clients:
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
 *     responses:
 *       201:
 *         description: Client created successfully
 */
router.post(
  '/',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(createClientSchema),
  asyncWrapper(controller.create.bind(controller)),
);

/**
 * @swagger
 * /crm/clients:
 *   get:
 *     summary: Get all clients for the organization
 *     tags: [Clients]
 *     responses:
 *       200:
 *         description: A list of clients
 */
router.get(
  '/',
  requirePermission(PERMISSIONS.CRM.READ),
  validateRequest(listClientsSchema),
  asyncWrapper(controller.getAll.bind(controller)),
);

/**
 * @swagger
 * /crm/clients/{id}:
 *   get:
 *     summary: Get a specific client by ID
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client details
 */
router.get(
  '/:id',
  requirePermission(PERMISSIONS.CRM.READ),
  validateRequest(getClientSchema),
  asyncWrapper(controller.getOne.bind(controller)),
);

/**
 * @swagger
 * /crm/clients/{id}:
 *   patch:
 *     summary: Update a client
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client updated successfully
 */
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(updateClientSchema),
  asyncWrapper(controller.update.bind(controller)),
);

/**
 * @swagger
 * /crm/clients/{id}:
 *   delete:
 *     summary: Soft delete a client
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Client deleted successfully
 */
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.CRM.WRITE),
  validateRequest(deleteClientSchema),
  asyncWrapper(controller.delete.bind(controller)),
);

export default router;
