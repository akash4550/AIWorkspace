import { prisma } from '../../config/prisma';
import { AppError } from '../../core/errors/AppError';
import { MetricFilterDto } from './analytics.dto';

export class AnalyticsRepository {
  private buildWhereClause(
    organizationId: string,
    filters: MetricFilterDto,
    extraFilters: Record<string, unknown> = {},
  ) {
    const where: any = {
      ...extraFilters,
      organizationId,
    };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};

      if (filters.startDate) {
        where.createdAt.gte = new Date(
          filters.startDate,
        );
      }

      if (filters.endDate) {
        where.createdAt.lte = new Date(
          filters.endDate,
        );
      }
    }

    return where;
  }

  async assertFilterScope(
    organizationId: string,
    filters: MetricFilterDto,
  ): Promise<void> {
    const [
      project,
      team,
      user,
    ] = await Promise.all([
      filters.projectId
        ? prisma.project.findFirst({
            where: {
              id: filters.projectId,
              organizationId,
              deletedAt: null,
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve(null),

      filters.teamId
        ? prisma.team.findFirst({
            where: {
              id: filters.teamId,
              organizationId,
              deletedAt: null,
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve(null),

      filters.userId
        ? prisma.user.findFirst({
            where: {
              id: filters.userId,
              organizationId,
              deletedAt: null,
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve(null),
    ]);

    const hasInvalidProject =
      filters.projectId !== undefined &&
      project === null;

    const hasInvalidTeam =
      filters.teamId !== undefined &&
      team === null;

    const hasInvalidUser =
      filters.userId !== undefined &&
      user === null;

    if (
      hasInvalidProject ||
      hasInvalidTeam ||
      hasInvalidUser
    ) {
      throw new AppError(
        'One or more analytics filters were not found',
        404,
      );
    }
  }

  async getActiveUsers(
    organizationId: string,
    filters: MetricFilterDto,
  ): Promise<number> {
    const where = this.buildWhereClause(
      organizationId,
      filters,
      {
        isActive: true,
        deletedAt: null,
      },
    );

    return prisma.user.count({ where });
  }

  async getNewUsers(
    organizationId: string,
    filters: MetricFilterDto,
  ): Promise<number> {
    const where = this.buildWhereClause(
      organizationId,
      filters,
      {
        deletedAt: null,
      },
    );

    return prisma.user.count({ where });
  }

  async getProjectsCreated(
    organizationId: string,
    filters: MetricFilterDto,
  ): Promise<number> {
    const where = this.buildWhereClause(
      organizationId,
      filters,
      {
        deletedAt: null,
      },
    );

    return prisma.project.count({ where });
  }

  async getActiveProjects(
    organizationId: string,
    filters: MetricFilterDto,
  ): Promise<number> {
    const where = this.buildWhereClause(
      organizationId,
      filters,
      {
        status: 'ACTIVE',
        deletedAt: null,
      },
    );

    return prisma.project.count({ where });
  }

  async getTasksCreated(
    organizationId: string,
    filters: MetricFilterDto,
  ): Promise<number> {
    const where = this.buildWhereClause(
      organizationId,
      filters,
      {
        deletedAt: null,
      },
    );

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.userId) {
      where.assigneeId = filters.userId;
    }

    return prisma.task.count({ where });
  }

  async getTasksCompleted(
    organizationId: string,
    filters: MetricFilterDto,
  ): Promise<number> {
    const where = this.buildWhereClause(
      organizationId,
      filters,
      {
        status: 'DONE',
        deletedAt: null,
      },
    );

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.userId) {
      where.assigneeId = filters.userId;
    }

    return prisma.task.count({ where });
  }

  async getOverdueTasks(
    organizationId: string,
    filters: MetricFilterDto,
  ): Promise<number> {
    const where = this.buildWhereClause(
      organizationId,
      filters,
      {
        status: {
          not: 'DONE',
        },
        dueDate: {
          lt: new Date(),
        },
        deletedAt: null,
      },
    );

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.userId) {
      where.assigneeId = filters.userId;
    }

    return prisma.task.count({ where });
  }

  async getTaskStatusDistribution(
    organizationId: string,
    filters: MetricFilterDto,
  ) {
    const where = this.buildWhereClause(
      organizationId,
      filters,
      {
        deletedAt: null,
      },
    );

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.userId) {
      where.assigneeId = filters.userId;
    }

    const distribution = await prisma.task.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });

    return distribution.map((item) => ({
      category: item.status,
      value: item._count.id,
    }));
  }

  async getLeadsCreated(
    organizationId: string,
    filters: MetricFilterDto,
  ): Promise<number> {
    const where = this.buildWhereClause(
      organizationId,
      filters,
      {
        deletedAt: null,
      },
    );

    return prisma.lead.count({ where });
  }

  async getOpportunities(
    organizationId: string,
    filters: MetricFilterDto,
  ) {
    const where = this.buildWhereClause(
      organizationId,
      filters,
      {
        deletedAt: null,
      },
    );

    where.stage = {
      organizationId,
    };

    return prisma.opportunity.findMany({
      where,
      include: {
        stage: true,
      },
    });
  }

  async getDocumentsUploaded(
    organizationId: string,
    filters: MetricFilterDto,
  ): Promise<number> {
    const where = this.buildWhereClause(
      organizationId,
      filters,
      {
        deletedAt: null,
      },
    );

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    return prisma.document.count({ where });
  }

  async getStorageUsage(
    organizationId: string,
    filters: MetricFilterDto,
  ): Promise<number> {
    const where = this.buildWhereClause(
      organizationId,
      filters,
      {
        deletedAt: null,
      },
    );

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    const result = await prisma.document.aggregate({
      where,
      _sum: {
        fileSize: true,
      },
    });

    return result._sum.fileSize ?? 0;
  }
}