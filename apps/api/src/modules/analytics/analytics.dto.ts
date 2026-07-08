import { z } from 'zod';

export const MetricFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  projectId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

export type MetricFilterDto = z.infer<typeof MetricFilterSchema>;

export const GetMetricSchema = z.object({
  query: MetricFilterSchema,
  params: z.object({
    metricName: z.string(),
  }),
});

export const GetReportSchema = z.object({
  query: MetricFilterSchema,
  params: z.object({
    reportType: z.string(),
  }),
});

// Enums for standard report types and metric names could be defined here as well
export enum ReportType {
  EXECUTIVE_SUMMARY = 'EXECUTIVE_SUMMARY',
  PROJECT_HEALTH = 'PROJECT_HEALTH',
  TEAM_PRODUCTIVITY = 'TEAM_PRODUCTIVITY',
  CRM_OVERVIEW = 'CRM_OVERVIEW',
}
