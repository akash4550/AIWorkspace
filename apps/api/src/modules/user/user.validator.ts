import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    role: z.nativeEnum(Role).optional().default(Role.EMPLOYEE),
    password: z.string().min(8).optional(), // Can be optional if we auto-generate it later
  })
});

export const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    role: z.nativeEnum(Role).optional(),
    avatar: z.string().url().nullable().optional(),
  })
});

export const updateUserStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  })
});
