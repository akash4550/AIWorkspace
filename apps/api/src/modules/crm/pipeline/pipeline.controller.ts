import { Request, Response } from 'express';
import { PipelineStageService } from './pipeline.service';
import { createPipelineStageSchema, updatePipelineStageSchema, reorderStagesSchema } from './pipeline.validator';

const pipelineService = new PipelineStageService();

export class PipelineStageController {
  async create(req: Request, res: Response) {
    try {
      const dto = createPipelineStageSchema.parse(req.body);
      const stage = await pipelineService.createStage(req.user!.organizationId, dto);
      res.status(201).json({ data: stage });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const stages = await pipelineService.getStages(req.user!.organizationId);
      res.json({ data: stages });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const stage = await pipelineService.getStage(req.user!.organizationId, req.params.id as string);
      res.json({ data: stage });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const dto = updatePipelineStageSchema.parse(req.body);
      const stage = await pipelineService.updateStage(req.user!.organizationId, req.params.id as string, dto);
      res.json({ data: stage });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await pipelineService.deleteStage(req.user!.organizationId, req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async reorder(req: Request, res: Response) {
    try {
      const dto = reorderStagesSchema.parse(req.body);
      await pipelineService.reorderStages(req.user!.organizationId, dto);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
