import { z } from 'zod';

const emptyObjectSchema = z.object({}).strict();

const assistantQuerySchema = z
  .string()
  .trim()
  .min(1, 'Assistant query is required')
  .max(
    2000,
    'Assistant query cannot exceed 2000 characters',
  );

const globalAssistantBodySchema = z
  .object({
    query: assistantQuerySchema,
    contextType: z.literal('GLOBAL'),
    entityId: z.never().optional(),
  })
  .strict();

const taskAssistantBodySchema = z
  .object({
    query: assistantQuerySchema,
    contextType: z.literal('TASK'),
    entityId: z
      .string()
      .uuid('Task ID must be a valid UUID'),
  })
  .strict();

const projectAssistantBodySchema = z
  .object({
    query: assistantQuerySchema,
    contextType: z.literal('PROJECT'),
    entityId: z
      .string()
      .uuid('Project ID must be a valid UUID'),
  })
  .strict();

export const SummarizeTaskSchema = z
  .object({
    body: emptyObjectSchema.optional(),
    query: emptyObjectSchema,
    params: z
      .object({
        taskId: z
          .string()
          .uuid('Task ID must be a valid UUID'),
      })
      .strict(),
  })
  .strict();

export const AskAssistantSchema = z
  .object({
    body: z.discriminatedUnion('contextType', [
      globalAssistantBodySchema,
      taskAssistantBodySchema,
      projectAssistantBodySchema,
    ]),
    query: emptyObjectSchema,
    params: emptyObjectSchema,
  })
  .strict();

export type SummarizeTaskRequest = z.infer<
  typeof SummarizeTaskSchema
>;

export type AskAssistantRequest = z.infer<
  typeof AskAssistantSchema
>;