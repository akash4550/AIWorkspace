import { z } from 'zod';

const emptyObjectSchema = z.object({}).strict();

export const SearchModule = {
  PROJECTS: 'projects',
  TASKS: 'tasks',
  CRM: 'crm',
} as const;

export type SearchModule =
  (typeof SearchModule)[keyof typeof SearchModule];

const searchModuleSchema = z.enum([
  SearchModule.PROJECTS,
  SearchModule.TASKS,
  SearchModule.CRM,
]);

const searchModulesSchema = z
  .string()
  .trim()
  .min(1, 'Search modules cannot be empty')
  .transform((value) =>
    value
      .split(',')
      .map((module) => module.trim().toLowerCase())
      .filter(Boolean),
  )
  .superRefine((modules, context) => {
    if (modules.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one search module is required',
      });

      return;
    }

    const uniqueModules = new Set(modules);

    if (uniqueModules.size !== modules.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Search modules must be unique',
      });
    }

    modules.forEach((module, index) => {
      const result = searchModuleSchema.safeParse(module);

      if (!result.success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unsupported search module: ${module}`,
          path: [index],
        });
      }
    });
  })
  .transform((modules) => modules as SearchModule[]);

export const GlobalSearchSchema = z
  .object({
    body: emptyObjectSchema.optional(),
    params: emptyObjectSchema,
    query: z
      .object({
        q: z
          .string()
          .trim()
          .min(2, 'Search term must contain at least 2 characters')
          .max(100, 'Search term cannot exceed 100 characters'),

        modules: searchModulesSchema.optional(),

        limit: z.coerce
          .number()
          .int('Search limit must be an integer')
          .min(1, 'Search limit must be at least 1')
          .max(50, 'Search limit cannot exceed 50')
          .default(20),

        offset: z.coerce
          .number()
          .int('Search offset must be an integer')
          .min(0, 'Search offset cannot be negative')
          .max(1000, 'Search offset cannot exceed 1000')
          .default(0),
      })
      .strict(),
  })
  .strict();

export type GlobalSearchRequest = z.infer<
  typeof GlobalSearchSchema
>;