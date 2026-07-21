import { Request, Response } from 'express';

import { getValidatedRequest } from '../../../core/middlewares/validateRequest';
import { CRMActivityService } from './activity.service';
import type {
  CreateCRMActivityRequest,
  ListCRMActivitiesRequest,
} from './activity.validator';

const activityService = new CRMActivityService();

export class CRMActivityController {
  async create(req: Request, res: Response) {
    const { body } =
      getValidatedRequest<CreateCRMActivityRequest>(req);

    const activity = await activityService.createActivity(
      req.user!.organizationId,
      req.user!.id,
      body,
    );

    res.status(201).json({ data: activity });
  }

  async getAll(req: Request, res: Response) {
    const { query } =
      getValidatedRequest<ListCRMActivitiesRequest>(req);

    const result = await activityService.getActivities(
      req.user!.organizationId,
      query,
    );

    res.json(result);
  }
}