import { TaskStatus } from '@prisma/client';

import { AppError } from '../../core/errors/AppError';
import { TaskRepository } from './task.repository';
import {
  CreateTaskDto,
  MoveTaskDto,
  TaskQueryDto,
  UpdateTaskDto,
} from './task.dto';

export class TaskService {
  constructor(private readonly repository = new TaskRepository()) {}

  async getTasks(organizationId: string, query: TaskQueryDto) {
    return this.repository.findMany(organizationId, query);
  }

  async getTaskById(organizationId: string, taskId: string) {
    const task = await this.repository.findById(organizationId, taskId);

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return task;
  }

  async createTask(
    organizationId: string,
    reporterId: string,
    data: CreateTaskDto
  ) {
    const task = await this.repository.create(
      organizationId,
      reporterId,
      data
    );

    // TODO:
    // EventBus.publish('task.created', task);
    // Socket.emitToOrg(...)
    // ActivityLog.create(...)
    // Notification.create(...)

    return task;
  }

  async updateTask(
    organizationId: string,
    taskId: string,
    data: UpdateTaskDto
  ) {
    const updateData: UpdateTaskDto = {
      ...data,
      ...(data.status === TaskStatus.DONE
        ? { completedAt: new Date() }
        : data.status
        ? { completedAt: null }
        : {}),
    };

    const task = await this.repository.update(
      organizationId,
      taskId,
      updateData
    );

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // TODO:
    // EventBus.publish('task.updated', task);

    return task;
  }

  async moveTask(
    organizationId: string,
    taskId: string,
    data: MoveTaskDto
  ) {
    const task = await this.repository.update(
      organizationId,
      taskId,
      {
        status: data.status,
        position: data.position,
        completedAt:
          data.status === TaskStatus.DONE ? new Date() : null,
      }
    );

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // TODO:
    // EventBus.publish('task.moved', task);

    return task;
  }

  async assignTask(
    organizationId: string,
    taskId: string,
    assigneeId: string | null
  ) {
    const task = await this.repository.update(
      organizationId,
      taskId,
      {
        assigneeId,
      }
    );

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // TODO:
    // NotificationService.notifyAssignee(task);

    return task;
  }

  async archiveTask(organizationId: string, taskId: string) {
    const task = await this.repository.update(
      organizationId,
      taskId,
      {
        archived: true,
      }
    );

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return task;
  }

  async restoreTask(organizationId: string, taskId: string) {
    const task = await this.repository.update(
      organizationId,
      taskId,
      {
        archived: false,
      }
    );

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return task;
  }

  async deleteTask(organizationId: string, taskId: string) {
    const result = await this.repository.softDelete(
      organizationId,
      taskId
    );

    if (result.count === 0) {
      throw new AppError('Task not found', 404);
    }

    // TODO:
    // EventBus.publish('task.deleted', { taskId });

    return result;
  }
}