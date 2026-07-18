import { Request, Response } from 'express';

import { TaskPriority, TaskStatus } from '@prisma/client';

import { TaskService } from './task.service';

export class TaskController {
  constructor(private readonly service = new TaskService()) {}

  getTasks = async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId;

    const result = await this.service.getTasks(organizationId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
      search: req.query.search as string,
      projectId: req.query.projectId as string,
      assigneeId: req.query.assigneeId as string,
      status: req.query.status as TaskStatus,
      priority: req.query.priority as TaskPriority,
      isArchived: req.query.isArchived === 'true',
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    });

    return res.status(200).json(result);
  };

  getTaskById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const task = await this.service.getTaskById(
      req.user!.organizationId,
      id
    );

    return res.status(200).json(task);
  };

  createTask = async (req: Request, res: Response) => {
    const task = await this.service.createTask(
      req.user!.organizationId,
      req.user!.id,
      req.body
    );

    return res.status(201).json(task);
  };

  updateTask = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const task = await this.service.updateTask(
      req.user!.organizationId,
      id,
      req.body
    );

    return res.status(200).json(task);
  };

  moveTask = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const task = await this.service.moveTask(
      req.user!.organizationId,
      id,
      req.body
    );

    return res.status(200).json(task);
  };

  assignTask = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const task = await this.service.assignTask(
      req.user!.organizationId,
      id,
      req.body.assigneeId ?? null
    );

    return res.status(200).json(task);
  };

  archiveTask = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const task = await this.service.archiveTask(
      req.user!.organizationId,
      id
    );

    return res.status(200).json(task);
  };

  restoreTask = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const task = await this.service.restoreTask(
      req.user!.organizationId,
      id
    );

    return res.status(200).json(task);
  };

  deleteTask = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await this.service.deleteTask(
      req.user!.organizationId,
      id
    );

    return res.status(200).json({
      message: 'Task deleted successfully',
    });
  };
}