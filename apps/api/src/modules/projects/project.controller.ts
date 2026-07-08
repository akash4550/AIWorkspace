import { Request, Response } from 'express';
import { ProjectService } from './project.service';
import { ProjectStatus, Role } from '@prisma/client';

export class ProjectController {
    private service: ProjectService;

    constructor() {
        this.service = new ProjectService();
    }

    getProjects = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const userRole = req.user!.role;
        const userId = req.user!.id;
        
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const status = req.query.status as ProjectStatus;
        const isArchived = req.query.isArchived === 'true';
        const sortBy = req.query.sortBy as 'name' | 'createdAt' | 'updatedAt' | 'startDate';
        const sortOrder = req.query.sortOrder as 'asc' | 'desc';
        
        // If employee, they can only view their own projects
        let ownerId = req.query.ownerId as string;
        if (userRole === Role.EMPLOYEE) {
            ownerId = userId;
        }

        const result = await this.service.getProjects(organizationId, { 
            page, limit, search, status, ownerId, isArchived, sortBy, sortOrder 
        });
        
        res.status(200).json({ success: true, ...result });
    };

    getProjectById = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const projectId = req.params.id;
        const project = await this.service.getProjectById(organizationId, projectId);
        res.status(200).json({ success: true, data: project });
    };

    createProject = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const project = await this.service.createProject(organizationId, req.body);
        res.status(201).json({ success: true, data: project });
    };

    updateProject = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const projectId = req.params.id;
        const project = await this.service.updateProject(organizationId, projectId, req.body);
        res.status(200).json({ success: true, data: project });
    };

    archiveProject = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const projectId = req.params.id;
        const project = await this.service.archiveProject(organizationId, projectId);
        res.status(200).json({ success: true, data: project });
    };

    restoreProject = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const projectId = req.params.id;
        const project = await this.service.restoreProject(organizationId, projectId);
        res.status(200).json({ success: true, data: project });
    };

    deleteProject = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const projectId = req.params.id;
        await this.service.deleteProject(organizationId, projectId);
        res.status(200).json({ success: true, message: 'Project deleted successfully' });
    };
}
