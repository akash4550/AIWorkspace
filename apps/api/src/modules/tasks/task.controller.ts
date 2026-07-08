import { Request, Response } from 'express';
import { TaskService } from './task.service';
import { TaskStatus, TaskPriority, Role } from '@prisma/client';

export class TaskController {
    private service: TaskService;

    constructor() {
        this.service = new TaskService();
    }

    getTasks = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const userRole = req.user!.role;
        const userId = req.user!.id;
        
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const search = req.query.search as string;
        const projectId = req.query.projectId as string;
        const status = req.query.status as TaskStatus;
        const priority = req.query.priority as TaskPriority;
        const isArchived = req.query.isArchived === 'true';
        const sortBy = req.query.sortBy as 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'position';
        const sortOrder = req.query.sortOrder as 'asc' | 'desc';
        
        // Ensure employees can see tasks in a project if they have access to that project.
        // In a real complex app, we'd check if they are a member of the project.
        // For now, if no assigneeId filter is provided, we fetch tasks.
        const assigneeId = req.query.assigneeId as string;

        const result = await this.service.getTasks(organizationId, { 
            page, limit, search, projectId, assigneeId, status, priority, isArchived, sortBy, sortOrder 
        });
        
        res.status(200).json({ success: true, ...result });
    };

    getTaskById = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const taskId = req.params.id;
        const task = await this.service.getTaskById(organizationId, taskId);
        res.status(200).json({ success: true, data: task });
    };

    createTask = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const reporterId = req.user!.id; // Current user is reporter
        const task = await this.service.createTask(organizationId, reporterId, req.body);
        res.status(201).json({ success: true, data: task });
    };

    updateTask = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const taskId = req.params.id;
        const task = await this.service.updateTask(organizationId, taskId, req.body);
        res.status(200).json({ success: true, data: task });
    };

    moveTask = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const taskId = req.params.id;
        const task = await this.service.moveTask(organizationId, taskId, req.body);
        res.status(200).json({ success: true, data: task });
    };

    assignTask = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const taskId = req.params.id;
        const { assigneeId } = req.body; // can be null to unassign
        const task = await this.service.assignTask(organizationId, taskId, assigneeId);
        res.status(200).json({ success: true, data: task });
    };

    archiveTask = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const taskId = req.params.id;
        const task = await this.service.archiveTask(organizationId, taskId);
        res.status(200).json({ success: true, data: task });
    };

    restoreTask = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const taskId = req.params.id;
        const task = await this.service.restoreTask(organizationId, taskId);
        res.status(200).json({ success: true, data: task });
    };

    deleteTask = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const taskId = req.params.id;
        await this.service.deleteTask(organizationId, taskId);
        res.status(200).json({ success: true, message: 'Task deleted successfully' });
    };
}
