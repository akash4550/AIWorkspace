import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
}).strict();

export const loginSchema = z.object({
  body: loginBodySchema,
});

const cookieAuthRequestSchema = z.object({
  body: z.object({}).strict().optional(),
});

export const refreshTokenSchema = cookieAuthRequestSchema;
export const logoutSchema = cookieAuthRequestSchema;
