import { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskQueryDto,
} from './task.dto';

export class TaskRepository {
  async findById(organizationId: string, id: string) {
    return prisma.task.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        subtasks: {
          where: {
            deletedAt: null,
          },
        },
      },
    });
  }

  async findMany(
    organizationId: string,
    query: TaskQueryDto,
  ) {
    const {
      page = 1,
      limit = 50,
      search,
      projectId,
      assigneeId,
      status,
      priority,
      isArchived,
      sortBy = 'position',
      sortOrder = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      organizationId,
      deletedAt: null,
      archived: isArchived ?? false,
      parentTaskId: null,
    };

    if (projectId) where.projectId = projectId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const allowedSortFields: Prisma.TaskScalarFieldEnum[] = [
      'position',
      'createdAt',
      'updatedAt',
      'dueDate',
      'priority',
      'status',
      'title',
    ];

    const orderField = allowedSortFields.includes(
      sortBy as Prisma.TaskScalarFieldEnum,
    )
      ? sortBy
      : 'position';

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [orderField]: sortOrder,
        },
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              key: true,
            },
          },
          _count: {
            select: {
              subtasks: true,
            },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMaxPosition(
    organizationId: string,
    projectId: string,
    status: TaskStatus,
  ) {
    const task = await prisma.task.findFirst({
      where: {
        organizationId,
        projectId,
        status,
        deletedAt: null,
      },
      orderBy: {
        position: 'desc',
      },
      select: {
        position: true,
      },
    });

    return Number(task?.position ?? 0);
  }

  async create(
    organizationId: string,
    reporterId: string,
    data: CreateTaskDto,
  ) {
    let position = data.position;

    if (position === undefined) {
      const maxPosition = await this.findMaxPosition(
        organizationId,
        data.projectId,
        data.status ?? TaskStatus.TODO,
      );

      position = maxPosition + 65536;
    }

    return prisma.task.create({
      data: {
        organizationId,
        reporterId,
        projectId: data.projectId,
        parentTaskId: data.parentTaskId,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate,
        estimatedHours: data.estimatedHours,
        position,
      },
    });
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateTaskDto,
  ) {
    const existing = await prisma.task.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return null;
    }

    return prisma.task.update({
      where: {
        id,
      },
      data,
    });
  }

  async softDelete(
    organizationId: string,
    id: string,
  ) {
    return prisma.task.updateMany({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}