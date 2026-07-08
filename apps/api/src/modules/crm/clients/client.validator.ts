import { z } from 'zod';
import { ClientStatus } from '@prisma/client';

export const createClientSchema = z.object({
  name: z.string().min(1).max(255),
  industry: z.string().max(100).optional(),
  website: z.string().url().max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  ownerId: z.string().uuid().optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  status: z.nativeEnum(ClientStatus).optional(),
});
