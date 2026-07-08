import { z } from 'zod';
import { TeamRole } from '@prisma/client';

export const createTeamSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    description: z.string().optional().nullable(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
    icon: z.string().optional(),
  })
});

export const updateTeamSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().optional().nullable(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
    icon: z.string().optional().nullable(),
    ownerId: z.string().uuid().optional(),
  })
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address')
  })
});

export const updateMembershipSchema = z.object({
  body: z.object({
    role: z.nativeEnum(TeamRole)
  })
});
