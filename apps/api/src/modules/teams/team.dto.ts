import { TeamRole, InvitationStatus } from '@prisma/client';

export interface CreateTeamDto {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
}

export interface UpdateTeamDto {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    ownerId?: string;
}

export interface TeamQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    ownerId?: string;
    sortBy?: 'name' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
}

export interface InviteMemberDto {
    email: string;
}

export interface UpdateMembershipDto {
    role: TeamRole;
}
