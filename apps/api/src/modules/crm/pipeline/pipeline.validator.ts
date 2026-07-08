import { z } from 'zod';

export const createPipelineStageSchema = z.object({
  name: z.string().min(1).max(100),
  probability: z.number().min(0).max(100).optional(),
  position: z.number().min(0),
});

export const updatePipelineStageSchema = createPipelineStageSchema.partial();

export const reorderStagesSchema = z.object({
  stages: z.array(
    z.object({
      id: z.string().uuid(),
      position: z.number().min(0),
    })
  ).min(1),
});
