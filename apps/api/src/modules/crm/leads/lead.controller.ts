import { Request, Response } from 'express';
import { LeadService } from './lead.service';
import { createLeadSchema, updateLeadSchema } from './lead.validator';

const leadService = new LeadService();

export class LeadController {
  async create(req: Request, res: Response) {
    try {
      const dto = createLeadSchema.parse(req.body);
      const lead = await leadService.createLead(req.user!.organizationId, req.user!.id, dto);
      res.status(201).json({ data: lead });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const result = await leadService.getLeads(req.user!.organizationId, req.query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const lead = await leadService.getLead(req.user!.organizationId, req.params.id as string);
      res.json({ data: lead });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const dto = updateLeadSchema.parse(req.body);
      const lead = await leadService.updateLead(req.user!.organizationId, req.params.id as string, dto);
      res.json({ data: lead });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await leadService.deleteLead(req.user!.organizationId, req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
