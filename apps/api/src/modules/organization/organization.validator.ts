import { z } from 'zod';

const updateOrganizationBodySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  slug: z.string().min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
  logo: z.string().url('Logo must be a valid URL').nullable().optional(),
}).strict().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  'At least one organization field is required',
);

export const updateOrganizationSchema = z.object({
  body: updateOrganizationBodySchema,
});

export type UpdateOrganizationRequest = z.infer<typeof updateOrganizationSchema>;
