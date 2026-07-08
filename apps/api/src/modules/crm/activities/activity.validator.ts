import { z } from 'zod';
import { CRMActivityType } from '@prisma/client';

export const createCRMActivitySchema = z.object({
  type: z.nativeEnum(CRMActivityType),
  content: z.string().min(1),
  clientId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
}).refine(data => data.clientId || data.leadId || data.opportunityId, {
  message: "Activity must be linked to at least one entity (client, lead, or opportunity)",
});
