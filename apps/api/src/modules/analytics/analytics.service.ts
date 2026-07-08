import { AnalyticsRepository } from './analytics.repository';
import { KPIEngine } from './kpi.engine';
import { MetricFilterDto, ReportType } from './analytics.dto';
import { ReportDefinition } from './analytics.types';

export class AnalyticsService {
  private kpiEngine: KPIEngine;

  // Pre-defined reports that dictate which metrics are aggregated together
  private reports: Record<string, ReportDefinition> = {
    [ReportType.EXECUTIVE_SUMMARY]: {
      type: ReportType.EXECUTIVE_SUMMARY,
      title: 'Executive Summary',
      description: 'High-level overview of organization health',
      metrics: ['ACTIVE_USERS', 'NEW_USERS', 'PROJECTS_CREATED', 'PIPELINE_VALUE'],
    },
    [ReportType.PROJECT_HEALTH]: {
      type: ReportType.PROJECT_HEALTH,
      title: 'Project Health',
      description: 'Task completion and velocity',
      metrics: ['ACTIVE_PROJECTS', 'TASKS_CREATED', 'TASKS_COMPLETED', 'TASK_COMPLETION_RATE', 'OVERDUE_TASKS', 'TASK_STATUS_DISTRIBUTION'],
    },
    [ReportType.CRM_OVERVIEW]: {
      type: ReportType.CRM_OVERVIEW,
      title: 'CRM Overview',
      description: 'Lead generation and sales pipeline',
      metrics: ['LEADS_CREATED', 'PIPELINE_VALUE', 'WIN_RATE'],
    },
  };

  constructor() {
    // In a real dependency injection setup, these would be injected
    const repository = new AnalyticsRepository();
    this.kpiEngine = new KPIEngine(repository);
  }

  async getMetric(organizationId: string, metricName: string, filters: MetricFilterDto) {
    return this.kpiEngine.calculateMetric(metricName.toUpperCase(), organizationId, filters);
  }

  async getReport(organizationId: string, reportType: string, filters: MetricFilterDto) {
    const reportDef = this.reports[reportType.toUpperCase()];
    if (!reportDef) {
      throw new Error(`Report type ${reportType} not found`);
    }

    // Execute all metrics in parallel for performance
    const metricPromises = reportDef.metrics.map(metric =>
      this.kpiEngine.calculateMetric(metric, organizationId, filters).catch(err => ({
        name: metric,
        type: 'scalar',
        value: null,
        error: err.message,
      }))
    );

    const results = await Promise.all(metricPromises);

    return {
      ...reportDef,
      results,
      generatedAt: new Date(),
      filters,
    };
  }
}
