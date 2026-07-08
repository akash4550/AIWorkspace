import { Request, Response } from 'express';
import { ClientService } from './client.service';
import { createClientSchema, updateClientSchema } from './client.validator';

const clientService = new ClientService();

export class ClientController {
  async create(req: Request, res: Response) {
    try {
      const dto = createClientSchema.parse(req.body);
      const client = await clientService.createClient(req.user!.organizationId, req.user!.id, dto);
      res.status(201).json({ data: client });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const result = await clientService.getClients(req.user!.organizationId, req.query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const client = await clientService.getClient(req.user!.organizationId, req.params.id as string);
      res.json({ data: client });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const dto = updateClientSchema.parse(req.body);
      const client = await clientService.updateClient(req.user!.organizationId, req.params.id as string, dto);
      res.json({ data: client });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await clientService.deleteClient(req.user!.organizationId, req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
