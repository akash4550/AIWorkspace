import { Request, Response } from 'express';
import { TeamService } from './team.service';
import { TeamRole } from '@prisma/client';

export class TeamController {
    private service: TeamService;

    constructor() {
        this.service = new TeamService();
    }

    getTeams = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const search = req.query.search as string;
        const ownerId = req.query.ownerId as string;
        const sortBy = req.query.sortBy as 'name' | 'createdAt' | 'updatedAt';
        const sortOrder = req.query.sortOrder as 'asc' | 'desc';

        const result = await this.service.getTeams(organizationId, { 
            page, limit, search, ownerId, sortBy, sortOrder 
        });
        
        res.status(200).json({ success: true, ...result });
    };

    getMyTeams = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const userId = req.user!.id;
        const teams = await this.service.getUserTeams(organizationId, userId);
        res.status(200).json({ success: true, data: teams });
    };

    getTeamById = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const teamId = req.params.id;
        const team = await this.service.getTeamById(organizationId, teamId);
        res.status(200).json({ success: true, data: team });
    };

    createTeam = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const ownerId = req.user!.id; // Current user is owner
        const team = await this.service.createTeam(organizationId, ownerId, req.body);
        res.status(201).json({ success: true, data: team });
    };

    updateTeam = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const teamId = req.params.id;
        const team = await this.service.updateTeam(organizationId, teamId, req.body);
        res.status(200).json({ success: true, data: team });
    };

    deleteTeam = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const teamId = req.params.id;
        await this.service.deleteTeam(organizationId, teamId);
        res.status(200).json({ success: true, message: 'Team deleted successfully' });
    };

    // --- Membership and Invitations ---

    getMembers = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const teamId = req.params.id;
        const members = await this.service.getMembers(organizationId, teamId);
        res.status(200).json({ success: true, data: members });
    };

    updateMembership = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const teamId = req.params.id;
        const userId = req.params.userId;
        const { role } = req.body;
        const membership = await this.service.updateMembership(organizationId, teamId, userId, role);
        res.status(200).json({ success: true, data: membership });
    };

    removeMember = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const teamId = req.params.id;
        const userId = req.params.userId;
        await this.service.removeMember(organizationId, teamId, userId);
        res.status(200).json({ success: true, message: 'Member removed successfully' });
    };

    getInvitations = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const teamId = req.params.id;
        const invitations = await this.service.getInvitations(organizationId, teamId);
        res.status(200).json({ success: true, data: invitations });
    };

    inviteMember = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const teamId = req.params.id;
        const invitedById = req.user!.id;
        const invitation = await this.service.inviteMember(organizationId, teamId, invitedById, req.body);
        res.status(201).json({ success: true, data: invitation });
    };
}
