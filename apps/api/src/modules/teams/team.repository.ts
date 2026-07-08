import { PrismaClient, Prisma, TeamRole, InvitationStatus } from '@prisma/client';
import { CreateTeamDto, UpdateTeamDto, TeamQueryDto } from './team.dto';

const prisma = new PrismaClient();

export class TeamRepository {
    async findById(organizationId: string, id: string) {
        return prisma.team.findFirst({
            where: { id, organizationId, deletedAt: null },
            include: {
                owner: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
                _count: { select: { memberships: true } }
            }
        });
    }

    async findMany(organizationId: string, query: TeamQueryDto) {
        const { page = 1, limit = 50, search, ownerId, sortBy = 'createdAt', sortOrder = 'desc' } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.TeamWhereInput = {
            organizationId,
            deletedAt: null,
        };

        if (ownerId) where.ownerId = ownerId;

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const orderBy: Prisma.TeamOrderByWithRelationInput = {};
        orderBy[sortBy] = sortOrder;

        const [teams, total] = await Promise.all([
            prisma.team.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                    _count: { select: { memberships: true } }
                }
            }),
            prisma.team.count({ where })
        ]);

        return {
            data: teams,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        };
    }

    async getUserTeams(organizationId: string, userId: string) {
        return prisma.teamMembership.findMany({
            where: { userId, team: { organizationId, deletedAt: null } },
            include: {
                team: {
                    include: {
                        owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                        _count: { select: { memberships: true } }
                    }
                }
            }
        }).then(memberships => memberships.map(m => ({ ...m.team, myRole: m.role })));
    }

    async create(organizationId: string, ownerId: string, data: CreateTeamDto) {
        // Create Team and initial OWNER membership in a transaction
        return prisma.$transaction(async (tx) => {
            const team = await tx.team.create({
                data: {
                    organizationId,
                    ownerId,
                    name: data.name,
                    description: data.description,
                    color: data.color,
                    icon: data.icon,
                }
            });

            await tx.teamMembership.create({
                data: {
                    teamId: team.id,
                    userId: ownerId,
                    role: TeamRole.OWNER
                }
            });

            return team;
        });
    }

    async update(organizationId: string, id: string, data: UpdateTeamDto) {
        const team = await this.findById(organizationId, id);
        if (!team) return null;

        return prisma.team.update({
            where: { id },
            data
        });
    }

    async softDelete(organizationId: string, id: string) {
        const team = await this.findById(organizationId, id);
        if (!team) return null;

        return prisma.team.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }

    // --- Membership Methods ---

    async getMembership(teamId: string, userId: string) {
        return prisma.teamMembership.findUnique({
            where: { teamId_userId: { teamId, userId } }
        });
    }

    async getMembers(organizationId: string, teamId: string) {
        return prisma.teamMembership.findMany({
            where: { teamId, team: { organizationId, deletedAt: null } },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } }
            }
        });
    }

    async addMember(teamId: string, userId: string, role: TeamRole = TeamRole.MEMBER) {
        return prisma.teamMembership.create({
            data: { teamId, userId, role }
        });
    }

    async updateMembership(teamId: string, userId: string, role: TeamRole) {
        return prisma.teamMembership.update({
            where: { teamId_userId: { teamId, userId } },
            data: { role }
        });
    }

    async removeMember(teamId: string, userId: string) {
        return prisma.teamMembership.delete({
            where: { teamId_userId: { teamId, userId } }
        });
    }

    // --- Invitation Methods ---

    async getInvitations(organizationId: string, teamId: string) {
        return prisma.teamInvitation.findMany({
            where: { teamId, organizationId },
            include: {
                invitedBy: { select: { id: true, firstName: true, lastName: true } }
            }
        });
    }

    async createInvitation(organizationId: string, teamId: string, email: string, invitedById: string) {
        // Expire in 7 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        return prisma.teamInvitation.create({
            data: {
                organizationId,
                teamId,
                email,
                invitedById,
                expiresAt,
                status: InvitationStatus.PENDING
            }
        });
    }

    async getInvitationById(id: string) {
        return prisma.teamInvitation.findUnique({ where: { id } });
    }

    async updateInvitationStatus(id: string, status: InvitationStatus) {
        return prisma.teamInvitation.update({
            where: { id },
            data: { status }
        });
    }
}
