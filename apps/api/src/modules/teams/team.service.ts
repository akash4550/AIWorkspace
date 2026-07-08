import { TeamRepository } from './team.repository';
import { CreateTeamDto, UpdateTeamDto, TeamQueryDto, InviteMemberDto } from './team.dto';
import { AppError } from '../../core/errors/AppError';
import { TeamRole, InvitationStatus } from '@prisma/client';

export class TeamService {
    private repository: TeamRepository;

    constructor() {
        this.repository = new TeamRepository();
    }

    async getTeams(organizationId: string, query: TeamQueryDto) {
        return this.repository.findMany(organizationId, query);
    }

    async getUserTeams(organizationId: string, userId: string) {
        return this.repository.getUserTeams(organizationId, userId);
    }

    async getTeamById(organizationId: string, teamId: string) {
        const team = await this.repository.findById(organizationId, teamId);
        if (!team) throw new AppError('Team not found', 404);
        return team;
    }

    async createTeam(organizationId: string, ownerId: string, data: CreateTeamDto) {
        return this.repository.create(organizationId, ownerId, data);
    }

    async updateTeam(organizationId: string, teamId: string, data: UpdateTeamDto) {
        const team = await this.repository.update(organizationId, teamId, data);
        if (!team) throw new AppError('Team not found', 404);
        return team;
    }

    async deleteTeam(organizationId: string, teamId: string) {
        const team = await this.repository.softDelete(organizationId, teamId);
        if (!team) throw new AppError('Team not found', 404);
        return team;
    }

    // --- Membership Operations ---

    async getMembers(organizationId: string, teamId: string) {
        // Validate team exists in org
        await this.getTeamById(organizationId, teamId);
        return this.repository.getMembers(organizationId, teamId);
    }

    async updateMembership(organizationId: string, teamId: string, targetUserId: string, role: TeamRole) {
        await this.getTeamById(organizationId, teamId);
        const membership = await this.repository.getMembership(teamId, targetUserId);
        if (!membership) throw new AppError('User is not a member of this team', 404);

        if (membership.role === TeamRole.OWNER && role !== TeamRole.OWNER) {
            throw new AppError('Cannot change role of the team owner. Transfer ownership first.', 400);
        }

        return this.repository.updateMembership(teamId, targetUserId, role);
    }

    async removeMember(organizationId: string, teamId: string, targetUserId: string) {
        await this.getTeamById(organizationId, teamId);
        const membership = await this.repository.getMembership(teamId, targetUserId);
        if (!membership) throw new AppError('User is not a member of this team', 404);

        if (membership.role === TeamRole.OWNER) {
            throw new AppError('Cannot remove team owner. Transfer ownership first.', 400);
        }

        return this.repository.removeMember(teamId, targetUserId);
    }

    // --- Invitation Operations ---

    async getInvitations(organizationId: string, teamId: string) {
        await this.getTeamById(organizationId, teamId);
        return this.repository.getInvitations(organizationId, teamId);
    }

    async inviteMember(organizationId: string, teamId: string, invitedById: string, data: InviteMemberDto) {
        await this.getTeamById(organizationId, teamId);
        
        // In a real system we would check if user already exists in organization
        // and if they are already in the team. For now, just create the invitation.
        const invitation = await this.repository.createInvitation(organizationId, teamId, data.email, invitedById);
        
        // Future Extension: sendEmail(data.email, 'You are invited to a team')
        return invitation;
    }
}
