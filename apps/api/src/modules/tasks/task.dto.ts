import { TaskStatus, TaskPriority } from '@prisma/client';

export interface CreateTaskDto {
    projectId: string;
    parentTaskId?: string | null;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string | null;
    dueDate?: Date | null;
    estimatedHours?: number | null;
    position?: number;
}

export interface UpdateTaskDto {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string | null;
    dueDate?: Date | null;
    estimatedHours?: number | null;
}

export interface MoveTaskDto {
    status: TaskStatus;
    position: number;
}

export interface TaskQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    projectId?: string;
    assigneeId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date;
    isArchived?: boolean;
    sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'position';
    sortOrder?: 'asc' | 'desc';
}
