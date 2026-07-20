import { AppError } from '../../core/errors/AppError';
import {
  MetricFilterDto,
  ReportType,
} from './analytics.dto';
import { AnalyticsRepository } from './analytics.repository';
import { ReportDefinition } from './analytics.types';
import { KPIEngine } from './kpi.engine';

export class AnalyticsService {
  private repository: AnalyticsRepository;
  private kpiEngine: KPIEngine;

  private reports: Record<string, ReportDefinition> = {
    [ReportType.EXECUTIVE_SUMMARY]: {
      type: ReportType.EXECUTIVE_SUMMARY,
      title: 'Executive Summary',
      description:
        'High-level overview of organization health',
      metrics: [
        'ACTIVE_USERS',
        'NEW_USERS',
        'PROJECTS_CREATED',
        'PIPELINE_VALUE',
      ],
    },

    [ReportType.PROJECT_HEALTH]: {
      type: ReportType.PROJECT_HEALTH,
      title: 'Project Health',
      description: 'Task completion and velocity',
      metrics: [
        'ACTIVE_PROJECTS',
        'TASKS_CREATED',
        'TASKS_COMPLETED',
        'TASK_COMPLETION_RATE',
        'OVERDUE_TASKS',
        'TASK_STATUS_DISTRIBUTION',
      ],
    },

    [ReportType.CRM_OVERVIEW]: {
      type: ReportType.CRM_OVERVIEW,
      title: 'CRM Overview',
      description:
        'Lead generation and sales pipeline',
      metrics: [
        'LEADS_CREATED',
        'PIPELINE_VALUE',
        'WIN_RATE',
      ],
    },
  };

  constructor() {
    this.repository = new AnalyticsRepository();
    this.kpiEngine = new KPIEngine(this.repository);
  }

  async getMetric(
    organizationId: string,
    metricName: string,
    filters: MetricFilterDto,
  ) {
    await this.repository.assertFilterScope(
      organizationId,
      filters,
    );

    return this.kpiEngine.calculateMetric(
      metricName.toUpperCase(),
      organizationId,
      filters,
    );
  }

  async getReport(
    organizationId: string,
    reportType: string,
    filters: MetricFilterDto,
  ) {
    await this.repository.assertFilterScope(
      organizationId,
      filters,
    );

    const reportDefinition =
      this.reports[reportType.toUpperCase()];

    if (!reportDefinition) {
      throw new AppError(
        'Analytics report not found',
        404,
      );
    }

    const metricPromises =
      reportDefinition.metrics.map(async (metric) => {
        try {
          return await this.kpiEngine.calculateMetric(
            metric,
            organizationId,
            filters,
          );
        } catch (error) {
          return {
            name: metric,
            type: 'scalar',
            value: null,
            error:
              error instanceof Error
                ? error.message
                : 'Metric calculation failed',
          };
        }
      });

    const results = await Promise.all(metricPromises);

    return {
      ...reportDefinition,
      results,
      generatedAt: new Date(),
      filters,
    };
  }
}