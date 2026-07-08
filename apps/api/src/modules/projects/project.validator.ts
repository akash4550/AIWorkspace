import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    key: z.string().min(2, 'Key must be at least 2 characters')
        .regex(/^[A-Z0-9]+$/, 'Key can only contain uppercase letters and numbers'),
    description: z.string().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
    icon: z.string().optional(),
    ownerId: z.string().uuid('Invalid owner ID'),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
  })
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    status: z.nativeEnum(ProjectStatus).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
    icon: z.string().optional().nullable(),
    ownerId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
  })
});
