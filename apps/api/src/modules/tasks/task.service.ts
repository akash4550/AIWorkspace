import { TaskRepository } from './task.repository';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto, TaskQueryDto } from './task.dto';
import { AppError } from '../../core/errors/AppError';
import { TaskStatus } from '@prisma/client';

export class TaskService {
    private repository: TaskRepository;

    constructor() {
        this.repository = new TaskRepository();
    }

    async getTasks(organizationId: string, query: TaskQueryDto) {
        return this.repository.findMany(organizationId, query);
    }

    async getTaskById(organizationId: string, taskId: string) {
        const task = await this.repository.findById(organizationId, taskId);
        if (!task) throw new AppError('Task not found', 404);
        return task;
    }

    async createTask(organizationId: string, reporterId: string, data: CreateTaskDto) {
        const task = await this.repository.create(organizationId, reporterId, data);
        // Extension Point: this.socketService.broadcast(organizationId, 'task.created', task);
        // Extension Point: this.aiService.analyzeTask(task);
        return task;
    }

    async updateTask(organizationId: string, taskId: string, data: UpdateTaskDto) {
        let updateData: any = { ...data };
        
        if (data.status === TaskStatus.DONE) {
            updateData.completedAt = new Date();
        } else if (data.status && data.status !== TaskStatus.DONE) {
            updateData.completedAt = null;
        }

        const task = await this.repository.safeUpdate(organizationId, taskId, updateData);
        if (!task) throw new AppError('Task not found', 404);
        
        // Extension Point: this.socketService.broadcast(organizationId, 'task.updated', task);
        return task;
    }

    async moveTask(organizationId: string, taskId: string, data: MoveTaskDto) {
        // Here data.position represents the fractional index calculated by the client.
        // E.g., if moved between pos 1000 and 2000, client sends 1500.
        
        let updateData: any = {
            status: data.status,
            position: data.position
        };

        if (data.status === TaskStatus.DONE) {
            updateData.completedAt = new Date();
        } else {
            updateData.completedAt = null;
        }

        const task = await this.repository.safeUpdate(organizationId, taskId, updateData);
        if (!task) throw new AppError('Task not found', 404);

        // Extension Point: this.socketService.broadcast(organizationId, 'task.moved', task);
        return task;
    }

    async assignTask(organizationId: string, taskId: string, assigneeId: string | null) {
        const task = await this.repository.safeUpdate(organizationId, taskId, { assigneeId });
        if (!task) throw new AppError('Task not found', 404);
        // Extension Point: this.notificationService.notifyAssignee(task);
        return task;
    }

    async archiveTask(organizationId: string, taskId: string) {
        const task = await this.repository.safeUpdate(organizationId, taskId, { archived: true });
        if (!task) throw new AppError('Task not found', 404);
        return task;
    }

    async restoreTask(organizationId: string, taskId: string) {
        const task = await this.repository.safeUpdate(organizationId, taskId, { archived: false });
        if (!task) throw new AppError('Task not found', 404);
        return task;
    }

    async deleteTask(organizationId: string, taskId: string) {
        const task = await this.repository.softDelete(organizationId, taskId);
        if (!task) throw new AppError('Task not found', 404);
        // Extension Point: this.socketService.broadcast(organizationId, 'task.deleted', taskId);
        return task;
    }
}
