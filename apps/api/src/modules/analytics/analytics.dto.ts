import { z } from 'zod';

const emptyObjectSchema = z.object({}).strict();

export enum ReportType {
  EXECUTIVE_SUMMARY = 'EXECUTIVE_SUMMARY',
  PROJECT_HEALTH = 'PROJECT_HEALTH',
  CRM_OVERVIEW = 'CRM_OVERVIEW',
}

export const MetricName = {
  ACTIVE_USERS: 'ACTIVE_USERS',
  NEW_USERS: 'NEW_USERS',
  PROJECTS_CREATED: 'PROJECTS_CREATED',
  ACTIVE_PROJECTS: 'ACTIVE_PROJECTS',
  TASKS_CREATED: 'TASKS_CREATED',
  TASKS_COMPLETED: 'TASKS_COMPLETED',
  OVERDUE_TASKS: 'OVERDUE_TASKS',
  TASK_COMPLETION_RATE: 'TASK_COMPLETION_RATE',
  TASK_STATUS_DISTRIBUTION: 'TASK_STATUS_DISTRIBUTION',
  LEADS_CREATED: 'LEADS_CREATED',
  PIPELINE_VALUE: 'PIPELINE_VALUE',
  WIN_RATE: 'WIN_RATE',
  DOCUMENTS_UPLOADED: 'DOCUMENTS_UPLOADED',
  STORAGE_USAGE: 'STORAGE_USAGE',
} as const;

const metricNameSchema = z.enum(
  Object.values(MetricName) as [
    (typeof MetricName)[keyof typeof MetricName],
    ...(typeof MetricName)[keyof typeof MetricName][],
  ],
);

const reportTypeSchema = z.nativeEnum(ReportType);

export const MetricFilterSchema = z
  .object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    projectId: z
      .string()
      .uuid('Project ID must be a valid UUID')
      .optional(),
    teamId: z
      .string()
      .uuid('Team ID must be a valid UUID')
      .optional(),
    userId: z
      .string()
      .uuid('User ID must be a valid UUID')
      .optional(),
  })
  .strict()
  .superRefine((filters, context) => {
    if (
      filters.startDate &&
      filters.endDate &&
      new Date(filters.startDate) >
        new Date(filters.endDate)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Start date must be before or equal to end date',
        path: ['startDate'],
      });
    }
  });

export type MetricFilterDto = z.infer<
  typeof MetricFilterSchema
>;

export const GetMetricSchema = z
  .object({
    body: emptyObjectSchema.optional(),
    query: MetricFilterSchema,
    params: z
      .object({
        metricName: z
          .string()
          .transform((value) => value.toUpperCase())
          .pipe(metricNameSchema),
      })
      .strict(),
  })
  .strict();

export const GetReportSchema = z
  .object({
    body: emptyObjectSchema.optional(),
    query: MetricFilterSchema,
    params: z
      .object({
        reportType: z
          .string()
          .transform((value) => value.toUpperCase())
          .pipe(reportTypeSchema),
      })
      .strict(),
  })
  .strict();

export type GetMetricRequest = z.infer<
  typeof GetMetricSchema
>;

export type GetReportRequest = z.infer<
  typeof GetReportSchema
>;