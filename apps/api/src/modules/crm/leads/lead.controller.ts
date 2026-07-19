import { Request, Response } from 'express';

import { getValidatedRequest } from '../../../core/middlewares/validateRequest';
import { LeadService } from './lead.service';
import type {
  CreateLeadRequest,
  DeleteLeadRequest,
  GetLeadRequest,
  ListLeadsRequest,
  UpdateLeadRequest,
} from './lead.validator';

const leadService = new LeadService();

export class LeadController {
  async create(req: Request, res: Response) {
    const { body } = getValidatedRequest<CreateLeadRequest>(req);

    const lead = await leadService.createLead(
      req.user!.organizationId,
      req.user!.id,
      body,
    );

    res.status(201).json({ data: lead });
  }

  async getAll(req: Request, res: Response) {
    const { query } = getValidatedRequest<ListLeadsRequest>(req);

    const result = await leadService.getLeads(
      req.user!.organizationId,
      query,
    );

    res.json(result);
  }

  async getOne(req: Request, res: Response) {
    const { params } = getValidatedRequest<GetLeadRequest>(req);

    const lead = await leadService.getLead(
      req.user!.organizationId,
      params.id,
    );

    res.json({ data: lead });
  }

  async update(req: Request, res: Response) {
    const { body, params } = getValidatedRequest<UpdateLeadRequest>(req);

    const lead = await leadService.updateLead(
      req.user!.organizationId,
      params.id,
      body,
    );

    res.json({ data: lead });
  }

  async delete(req: Request, res: Response) {
    const { params } = getValidatedRequest<DeleteLeadRequest>(req);

    await leadService.deleteLead(
      req.user!.organizationId,
      params.id,
    );

    res.status(204).send();
  }
}