import { Request, Response } from 'express';

import { getValidatedRequest } from '../../../core/middlewares/validateRequest';
import { ClientService } from './client.service';
import type {
  CreateClientRequest,
  DeleteClientRequest,
  GetClientRequest,
  ListClientsRequest,
  UpdateClientRequest,
} from './client.validator';

const clientService = new ClientService();

export class ClientController {
  async create(req: Request, res: Response) {
    const { body } = getValidatedRequest<CreateClientRequest>(req);
    const client = await clientService.createClient(
      req.user!.organizationId,
      req.user!.id,
      body,
    );

    res.status(201).json({ data: client });
  }

  async getAll(req: Request, res: Response) {
    const { query } = getValidatedRequest<ListClientsRequest>(req);
    const result = await clientService.getClients(
      req.user!.organizationId,
      query,
    );

    res.json(result);
  }

  async getOne(req: Request, res: Response) {
    const { params } = getValidatedRequest<GetClientRequest>(req);
    const client = await clientService.getClient(
      req.user!.organizationId,
      params.id,
    );

    res.json({ data: client });
  }

  async update(req: Request, res: Response) {
    const { body, params } = getValidatedRequest<UpdateClientRequest>(req);
    const client = await clientService.updateClient(
      req.user!.organizationId,
      params.id,
      body,
    );

    res.json({ data: client });
  }

  async delete(req: Request, res: Response) {
    const { params } = getValidatedRequest<DeleteClientRequest>(req);
    await clientService.deleteClient(req.user!.organizationId, params.id);

    res.status(204).send();
  }
}
