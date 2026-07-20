import { CRMActivityType } from '@prisma/client';
import { z } from 'zod';

const emptyObjectSchema = z.object({}).strict();

const createCRMActivityBodySchema = z
  .object({
    type: z.nativeEnum(CRMActivityType),
    content: z.string().trim().min(
      1,
      'Activity content is required',
    ),
    clientId: z
      .string()
      .uuid('Client ID must be a valid UUID')
      .optional(),
    leadId: z
      .string()
      .uuid('Lead ID must be a valid UUID')
      .optional(),
    opportunityId: z
      .string()
      .uuid('Opportunity ID must be a valid UUID')
      .optional(),
  })
  .strict()
  .refine(
    (body) =>
      Boolean(
        body.clientId ||
        body.leadId ||
        body.opportunityId,
      ),
    {
      message:
        'Activity must be linked to at least one entity',
    },
  );

const activityQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),
    clientId: z
      .string()
      .uuid('Client ID must be a valid UUID')
      .optional(),
    leadId: z
      .string()
      .uuid('Lead ID must be a valid UUID')
      .optional(),
    opportunityId: z
      .string()
      .uuid('Opportunity ID must be a valid UUID')
      .optional(),
  })
  .strict();

export const createCRMActivitySchema = z
  .object({
    body: createCRMActivityBodySchema,
    params: emptyObjectSchema.optional(),
    query: emptyObjectSchema.optional(),
  })
  .strict();

export const listCRMActivitiesSchema = z
  .object({
    body: emptyObjectSchema.optional(),
    params: emptyObjectSchema.optional(),
    query: activityQuerySchema,
  })
  .strict();

export type CreateCRMActivityRequest = z.infer<
  typeof createCRMActivitySchema
>;

export type ListCRMActivitiesRequest = z.infer<
  typeof listCRMActivitiesSchema
>;