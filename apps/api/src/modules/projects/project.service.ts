import { ProjectRepository } from './project.repository';
import { CreateProjectDto, UpdateProjectDto, ProjectQueryDto } from './project.dto';
import { AppError } from '../../core/errors/AppError';
import { ProjectStatus } from '@prisma/client';

export class ProjectService {
    private repository: ProjectRepository;

    constructor() {
        this.repository = new ProjectRepository();
    }

    async getProjects(organizationId: string, query: ProjectQueryDto) {
        return this.repository.findMany(organizationId, query);
    }

    async getProjectById(organizationId: string, projectId: string) {
        const project = await this.repository.findById(organizationId, projectId);
        if (!project) {
            throw new AppError('Project not found', 404);
        }
        return project;
    }

    async createProject(organizationId: string, data: CreateProjectDto) {
        // Validate Key Uniqueness
        const existing = await this.repository.findByKey(organizationId, data.key.toUpperCase());
        if (existing) {
            throw new AppError('Project key must be unique within the organization', 400);
        }

        const project = await this.repository.create(organizationId, data);
        
        // Future Extension: Emit 'project.created' event for ActivityLog / Notifications
        
        return project;
    }

    async updateProject(organizationId: string, projectId: string, data: UpdateProjectDto) {
        const project = await this.repository.update(organizationId, projectId, data);
        if (!project) {
            throw new AppError('Project not found', 404);
        }
        
        // Future Extension: Emit 'project.updated' event
        
        return project;
    }

    async archiveProject(organizationId: string, projectId: string) {
        const project = await this.repository.updateStatus(organizationId, projectId, ProjectStatus.ARCHIVED);
        if (!project) {
            throw new AppError('Project not found', 404);
        }

        // Future Extension: Emit 'project.archived' event

        return project;
    }

    async restoreProject(organizationId: string, projectId: string) {
        // Restore to PLANNING by default, though in reality it might be better to remember previous state
        const project = await this.repository.updateStatus(organizationId, projectId, ProjectStatus.PLANNING);
        if (!project) {
            throw new AppError('Project not found', 404);
        }

        // Future Extension: Emit 'project.restored' event

        return project;
    }

    async deleteProject(organizationId: string, projectId: string) {
        const project = await this.repository.softDelete(organizationId, projectId);
        if (!project) {
            throw new AppError('Project not found', 404);
        }

        // Future Extension: Emit 'project.deleted' event

        return project;
    }
}
