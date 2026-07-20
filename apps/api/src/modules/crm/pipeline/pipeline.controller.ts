import { Request, Response } from 'express';

import { getValidatedRequest } from '../../../core/middlewares/validateRequest';
import { PipelineStageService } from './pipeline.service';
import type {
  CreatePipelineStageRequest,
  DeletePipelineStageRequest,
  GetPipelineStageRequest,
  ReorderPipelineStagesRequest,
  UpdatePipelineStageRequest,
} from './pipeline.validator';

const pipelineService = new PipelineStageService();

export class PipelineStageController {
  async create(req: Request, res: Response) {
    const { body } =
      getValidatedRequest<CreatePipelineStageRequest>(req);

    const stage = await pipelineService.createStage(
      req.user!.organizationId,
      body,
    );

    res.status(201).json({ data: stage });
  }

  async getAll(req: Request, res: Response) {
    const stages = await pipelineService.getStages(
      req.user!.organizationId,
    );

    res.json({ data: stages });
  }

  async getOne(req: Request, res: Response) {
    const { params } =
      getValidatedRequest<GetPipelineStageRequest>(req);

    const stage = await pipelineService.getStage(
      req.user!.organizationId,
      params.id,
    );

    res.json({ data: stage });
  }

  async update(req: Request, res: Response) {
    const { body, params } =
      getValidatedRequest<UpdatePipelineStageRequest>(req);

    const stage = await pipelineService.updateStage(
      req.user!.organizationId,
      params.id,
      body,
    );

    res.json({ data: stage });
  }

  async delete(req: Request, res: Response) {
    const { params } =
      getValidatedRequest<DeletePipelineStageRequest>(req);

    await pipelineService.deleteStage(
      req.user!.organizationId,
      params.id,
    );

    res.status(204).send();
  }

  async reorder(req: Request, res: Response) {
    const { body } =
      getValidatedRequest<ReorderPipelineStagesRequest>(req);

    await pipelineService.reorderStages(
      req.user!.organizationId,
      body,
    );

    res.status(204).send();
  }
}