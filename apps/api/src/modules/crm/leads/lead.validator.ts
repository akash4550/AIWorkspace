import { z } from 'zod';
import { LeadStatus } from '@prisma/client';

export const createLeadSchema = z.object({
  title: z.string().min(1).max(255),
  source: z.string().max(100).optional(),
  score: z.number().min(0).max(100).optional(),
  assignedTo: z.string().uuid().optional(),
  expectedValue: z.number().min(0).optional(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  status: z.nativeEnum(LeadStatus).optional(),
});
