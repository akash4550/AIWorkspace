import { z } from 'zod';

export const createOpportunitySchema = z.object({
  leadId: z.string().uuid(),
  stageId: z.string().uuid(),
  expectedRevenue: z.number().min(0).optional(),
  closeDate: z.string().datetime().optional().or(z.date().optional()),
  probability: z.number().min(0).max(100).optional(),
});

export const updateOpportunitySchema = createOpportunitySchema.partial();
