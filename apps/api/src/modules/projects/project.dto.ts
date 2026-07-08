import { ProjectStatus } from '@prisma/client';

export interface CreateProjectDto {
    name: string;
    key: string;
    description?: string;
    status?: ProjectStatus;
    color?: string;
    icon?: string;
    ownerId: string;
    startDate?: Date;
    endDate?: Date;
}

export interface UpdateProjectDto {
    name?: string;
    description?: string;
    status?: ProjectStatus;
    color?: string;
    icon?: string;
    ownerId?: string;
    startDate?: Date;
    endDate?: Date;
}

export interface ProjectQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: ProjectStatus;
    ownerId?: string;
    isArchived?: boolean;
    sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'startDate';
    sortOrder?: 'asc' | 'desc';
}
