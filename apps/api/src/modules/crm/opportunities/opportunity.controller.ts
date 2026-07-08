import { Request, Response } from 'express';
import { OpportunityService } from './opportunity.service';
import { createOpportunitySchema, updateOpportunitySchema } from './opportunity.validator';

const opportunityService = new OpportunityService();

export class OpportunityController {
  async create(req: Request, res: Response) {
    try {
      const dto = createOpportunitySchema.parse(req.body);
      const opp = await opportunityService.createOpportunity(req.user!.organizationId, dto);
      res.status(201).json({ data: opp });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const result = await opportunityService.getOpportunities(req.user!.organizationId, req.query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const opp = await opportunityService.getOpportunity(req.user!.organizationId, req.params.id as string);
      res.json({ data: opp });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const dto = updateOpportunitySchema.parse(req.body);
      const opp = await opportunityService.updateOpportunity(req.user!.organizationId, req.params.id as string, dto);
      res.json({ data: opp });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await opportunityService.deleteOpportunity(req.user!.organizationId, req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
