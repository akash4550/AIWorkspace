import { Router } from 'express';
import { ClientController } from './client.controller';

const router = Router();
const controller = new ClientController();

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
router.post('/', controller.create.bind(controller));

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
router.get('/', controller.getAll.bind(controller));

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
router.get('/:id', controller.getOne.bind(controller));

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
router.patch('/:id', controller.update.bind(controller));

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
router.delete('/:id', controller.delete.bind(controller));

export default router;
