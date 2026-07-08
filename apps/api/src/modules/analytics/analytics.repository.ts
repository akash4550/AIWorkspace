import { prisma } from '../../core/db/prisma';
import { MetricFilterDto } from './analytics.dto';

export class AnalyticsRepository {
  /**
   * Helper to build common where clauses ensuring multi-tenant isolation
   * and applying date/scope filters.
   */
  private buildWhereClause(organizationId: string, filters: MetricFilterDto, extraFilters: any = {}) {
    const where: any = { organizationId, ...extraFilters };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }
    return where;
  }

  // --- ORGANIZATION METRICS ---
  async getActiveUsers(organizationId: string, filters: MetricFilterDto): Promise<number> {
    const where = this.buildWhereClause(organizationId, filters, { isActive: true });
    return prisma.user.count({ where });
  }

  async getNewUsers(organizationId: string, filters: MetricFilterDto): Promise<number> {
    const where = this.buildWhereClause(organizationId, filters);
    return prisma.user.count({ where });
  }

  // --- PROJECT METRICS ---
  async getProjectsCreated(organizationId: string, filters: MetricFilterDto): Promise<number> {
    const where = this.buildWhereClause(organizationId, filters);
    return prisma.project.count({ where });
  }

  async getActiveProjects(organizationId: string, filters: MetricFilterDto): Promise<number> {
    const where = this.buildWhereClause(organizationId, filters, { status: 'ACTIVE' });
    return prisma.project.count({ where });
  }

  // --- TASK METRICS ---
  async getTasksCreated(organizationId: string, filters: MetricFilterDto): Promise<number> {
    const where = this.buildWhereClause(organizationId, filters);
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.userId) where.assigneeId = filters.userId;
    return prisma.task.count({ where });
  }

  async getTasksCompleted(organizationId: string, filters: MetricFilterDto): Promise<number> {
    const where = this.buildWhereClause(organizationId, filters, { status: 'DONE' });
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.userId) where.assigneeId = filters.userId;
    return prisma.task.count({ where });
  }

  async getOverdueTasks(organizationId: string, filters: MetricFilterDto): Promise<number> {
    const where = this.buildWhereClause(organizationId, filters, {
      status: { not: 'DONE' },
      dueDate: { lt: new Date() },
    });
    if (filters.projectId) where.projectId = filters.projectId;
    return prisma.task.count({ where });
  }

  async getTaskStatusDistribution(organizationId: string, filters: MetricFilterDto) {
    const where = this.buildWhereClause(organizationId, filters);
    if (filters.projectId) where.projectId = filters.projectId;

    const distribution = await prisma.task.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });

    return distribution.map(d => ({
      category: d.status,
      value: d._count.id,
    }));
  }

  // --- CRM METRICS ---
  async getLeadsCreated(organizationId: string, filters: MetricFilterDto): Promise<number> {
    const where = this.buildWhereClause(organizationId, filters);
    return prisma.lead.count({ where });
  }

  async getOpportunities(organizationId: string, filters: MetricFilterDto) {
    const where = this.buildWhereClause(organizationId, filters);
    return prisma.opportunity.findMany({ where, include: { stage: true } });
  }

  // --- DOCUMENT METRICS ---
  async getDocumentsUploaded(organizationId: string, filters: MetricFilterDto): Promise<number> {
    const where = this.buildWhereClause(organizationId, filters);
    if (filters.projectId) where.projectId = filters.projectId;
    return prisma.document.count({ where });
  }

  async getStorageUsage(organizationId: string, filters: MetricFilterDto): Promise<number> {
    const where = this.buildWhereClause(organizationId, filters);
    const result = await prisma.document.aggregate({
      where,
      _sum: {
        fileSize: true,
      },
    });
    return result._sum.fileSize || 0;
  }
}
