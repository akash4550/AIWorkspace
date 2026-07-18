import { KPIFunction, MetricFilterDto, MetricResult } from './analytics.types';
import { AnalyticsRepository } from './analytics.repository';

export class KPIEngine {
  private metrics: Map<string, KPIFunction> = new Map();
  private repository: AnalyticsRepository;

  constructor(repository: AnalyticsRepository) {
    this.repository = repository;
    this.registerCoreMetrics();
  }

  /**
   * Registers a new metric calculation function.
   * This design allows external modules or future AI plugins to register their own KPIs.
   */
  registerMetric(name: string, fn: KPIFunction) {
    this.metrics.set(name, fn);
  }

  /**
   * Executes a registered metric function.
   */
  async calculateMetric(name: string, organizationId: string, filters: MetricFilterDto): Promise<MetricResult> {
    const fn = this.metrics.get(name);
    if (!fn) throw new Error(`Metric ${name} not found in KPI Engine`);
    return fn(organizationId, filters);
  }

  private registerCoreMetrics() {
    // --- ORGANIZATION ---
    this.registerMetric('ACTIVE_USERS', async (orgId, filters) => ({
      name: 'Active Users',
      type: 'scalar',
      value: await this.repository.getActiveUsers(orgId, filters),
      description: 'Number of currently active users',
    }));
    
    this.registerMetric('NEW_USERS', async (orgId, filters) => ({
      name: 'New Users',
      type: 'scalar',
      value: await this.repository.getNewUsers(orgId, filters),
      description: 'Users created in the time period',
    }));

    // --- PROJECTS ---
    this.registerMetric('PROJECTS_CREATED', async (orgId, filters) => ({
      name: 'Projects Created',
      type: 'scalar',
      value: await this.repository.getProjectsCreated(orgId, filters),
    }));

    this.registerMetric('ACTIVE_PROJECTS', async (orgId, filters) => ({
      name: 'Active Projects',
      type: 'scalar',
      value: await this.repository.getActiveProjects(orgId, filters),
    }));

    // --- TASKS ---
    this.registerMetric('TASKS_CREATED', async (orgId, filters) => ({
      name: 'Tasks Created',
      type: 'scalar',
      value: await this.repository.getTasksCreated(orgId, filters),
    }));

    this.registerMetric('TASKS_COMPLETED', async (orgId, filters) => ({
      name: 'Tasks Completed',
      type: 'scalar',
      value: await this.repository.getTasksCompleted(orgId, filters),
    }));

    this.registerMetric('OVERDUE_TASKS', async (orgId, filters) => ({
      name: 'Overdue Tasks',
      type: 'scalar',
      value: await this.repository.getOverdueTasks(orgId, filters),
    }));

    this.registerMetric('TASK_COMPLETION_RATE', async (orgId, filters) => {
      const completed = await this.repository.getTasksCompleted(orgId, filters);
      const total = await this.repository.getTasksCreated(orgId, filters);
      const rate = total > 0 ? (completed / total) * 100 : 0;
      return {
        name: 'Task Completion Rate',
        type: 'scalar',
        value: Math.round(rate),
        unit: '%',
      };
    });

    this.registerMetric('TASK_STATUS_DISTRIBUTION', async (orgId, filters) => ({
      name: 'Task Statuses',
      type: 'distribution',
      value: await this.repository.getTaskStatusDistribution(orgId, filters),
    }));

    // --- CRM ---
    this.registerMetric('LEADS_CREATED', async (orgId, filters) => ({
      name: 'Leads Created',
      type: 'scalar',
      value: await this.repository.getLeadsCreated(orgId, filters),
    }));

    this.registerMetric('PIPELINE_VALUE', async (orgId, filters) => {
      const opps = await this.repository.getOpportunities(orgId, filters);
      const value = opps.reduce((sum, opp) => {
        const revenue = opp.expectedRevenue?.toNumber() || 0;
        return sum + revenue;
      }, 0);
      return {
        name: 'Pipeline Value',
        type: 'scalar',
        value,
        unit: '$',
      };
    });

    this.registerMetric('WIN_RATE', async (orgId, filters) => {
      const opps = await this.repository.getOpportunities(orgId, filters);
      const won = opps.filter(o => o.stage.name.toUpperCase().includes('WON')).length;
      const total = opps.length;
      const rate = total > 0 ? (won / total) * 100 : 0;
      return {
        name: 'Win Rate',
        type: 'scalar',
        value: Math.round(rate),
        unit: '%',
      };
    });

    // --- DOCUMENTS ---
    this.registerMetric('DOCUMENTS_UPLOADED', async (orgId, filters) => ({
      name: 'Documents Uploaded',
      type: 'scalar',
      value: await this.repository.getDocumentsUploaded(orgId, filters),
    }));

    this.registerMetric('STORAGE_USAGE', async (orgId, filters) => ({
      name: 'Storage Usage',
      type: 'scalar',
      value: await this.repository.getStorageUsage(orgId, filters),
      unit: 'Bytes',
    }));
  }
}
