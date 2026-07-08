import { z } from 'zod';

export const createContactSchema = z.object({
  clientId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  designation: z.string().max(100).optional(),
});

export const updateContactSchema = createContactSchema.partial().omit({ clientId: true });
