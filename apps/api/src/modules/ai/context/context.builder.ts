import { prisma } from '../../../config/prisma';
import { AppError } from '../../../core/errors/AppError';

export class ContextBuilder {
  static async buildTaskContext(
    organizationId: string,
    taskId: string,
  ): Promise<string> {
    if (!organizationId) {
      throw new AppError(
        'Organization context is required',
        400,
      );
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        organizationId,
        deletedAt: null,
        project: {
          organizationId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        description: true,
        assignee: {
          select: {
            firstName: true,
            lastName: true,
            deletedAt: true,
            isActive: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
        subtasks: {
          where: {
            organizationId,
            deletedAt: null,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!task) {
      throw new AppError(
        'Task not found',
        404,
      );
    }

    const activeAssignee =
      task.assignee &&
      task.assignee.isActive &&
      !task.assignee.deletedAt
        ? `${task.assignee.firstName} ${task.assignee.lastName}`
        : 'Unassigned';

    return `
[TASK CONTEXT]
ID: ${task.id}
Title: ${task.title}
Status: ${task.status}
Priority: ${task.priority}
Assignee: ${activeAssignee}
Project: ${task.project.name}
Description: ${task.description ?? 'None'}
Subtasks Count: ${task.subtasks.length}
`.trim();
  }

  static async buildProjectContext(
    organizationId: string,
    projectId: string,
  ): Promise<string> {
    if (!organizationId) {
      throw new AppError(
        'Organization context is required',
        400,
      );
    }

    const project =
      await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          status: true,
          description: true,
          tasks: {
            where: {
              organizationId,
              deletedAt: null,
            },
            select: {
              title: true,
              status: true,
              priority: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
            take: 100,
          },
        },
      });

    if (!project) {
      throw new AppError(
        'Project not found',
        404,
      );
    }

    const taskSummary = project.tasks
      .map(
        (task) =>
          `- [${task.status}] ${task.title} (${task.priority})`,
      )
      .join('\n');

    return `
[PROJECT CONTEXT]
ID: ${project.id}
Name: ${project.name}
Status: ${project.status}
Description: ${project.description ?? 'None'}

Tasks:
${taskSummary || 'No tasks assigned.'}
`.trim();
  }
}