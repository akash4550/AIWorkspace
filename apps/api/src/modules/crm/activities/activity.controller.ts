import { Request, Response } from 'express';
import { CRMActivityService } from './activity.service';
import { createCRMActivitySchema } from './activity.validator';

const activityService = new CRMActivityService();

export class CRMActivityController {
  async create(req: Request, res: Response) {
    try {
      const dto = createCRMActivitySchema.parse(req.body);
      const activity = await activityService.createActivity(req.user!.organizationId, req.user!.id, dto);
      res.status(201).json({ data: activity });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const result = await activityService.getActivities(req.user!.organizationId, req.query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
