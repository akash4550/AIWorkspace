import { z } from 'zod';

const emptyObjectSchema = z.object({}).strict();

const pipelineStageParamsSchema = z
  .object({
    id: z.string().uuid(
      'Pipeline stage ID must be a valid UUID',
    ),
  })
  .strict();

const createPipelineStageBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Pipeline stage name is required')
      .max(
        100,
        'Pipeline stage name must not exceed 100 characters',
      ),
    probability: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional(),
    position: z
      .number()
      .finite()
      .min(0),
  })
  .strict();

const updatePipelineStageBodySchema =
  createPipelineStageBodySchema
    .partial()
    .refine(
      (body) => Object.keys(body).length > 0,
      {
        message:
          'At least one pipeline stage field is required',
      },
    );

const reorderStagesBodySchema = z
  .object({
    stages: z
      .array(
        z
          .object({
            id: z.string().uuid(
              'Pipeline stage ID must be a valid UUID',
            ),
            position: z
              .number()
              .finite()
              .min(0),
          })
          .strict(),
      )
      .min(1, 'At least one pipeline stage is required'),
  })
  .strict()
  .superRefine((body, context) => {
    const stageIds = body.stages.map(
      (stage) => stage.id,
    );

    if (new Set(stageIds).size !== stageIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Pipeline stage IDs must be unique',
        path: ['stages'],
      });
    }
  });

export const createPipelineStageSchema = z
  .object({
    body: createPipelineStageBodySchema,
    params: emptyObjectSchema.optional(),
    query: emptyObjectSchema.optional(),
  })
  .strict();

export const listPipelineStagesSchema = z
  .object({
    body: emptyObjectSchema.optional(),
    params: emptyObjectSchema.optional(),
    query: emptyObjectSchema.optional(),
  })
  .strict();

export const getPipelineStageSchema = z
  .object({
    body: emptyObjectSchema.optional(),
    params: pipelineStageParamsSchema,
    query: emptyObjectSchema.optional(),
  })
  .strict();

export const updatePipelineStageSchema = z
  .object({
    body: updatePipelineStageBodySchema,
    params: pipelineStageParamsSchema,
    query: emptyObjectSchema.optional(),
  })
  .strict();

export const deletePipelineStageSchema = z
  .object({
    body: emptyObjectSchema.optional(),
    params: pipelineStageParamsSchema,
    query: emptyObjectSchema.optional(),
  })
  .strict();

export const reorderStagesSchema = z
  .object({
    body: reorderStagesBodySchema,
    params: emptyObjectSchema.optional(),
    query: emptyObjectSchema.optional(),
  })
  .strict();

export type CreatePipelineStageRequest = z.infer<
  typeof createPipelineStageSchema
>;

export type ListPipelineStagesRequest = z.infer<
  typeof listPipelineStagesSchema
>;

export type GetPipelineStageRequest = z.infer<
  typeof getPipelineStageSchema
>;

export type UpdatePipelineStageRequest = z.infer<
  typeof updatePipelineStageSchema
>;

export type DeletePipelineStageRequest = z.infer<
  typeof deletePipelineStageSchema
>;

export type ReorderPipelineStagesRequest = z.infer<
  typeof reorderStagesSchema
>;