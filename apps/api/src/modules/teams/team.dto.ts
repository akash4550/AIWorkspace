import { TeamRole } from '@prisma/client';



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

}





export interface TeamQueryDto {

  page?: number;

  limit?: number;

  search?: string;

  ownerId?: string;

  sortBy?:
    | 'name'
    | 'createdAt'
    | 'updatedAt';


  sortOrder?:
    | 'asc'
    | 'desc';

}





export interface InviteMemberDto {

  email: string;

}





export interface UpdateMembershipDto {

  role: TeamRole;

}





export interface TeamResponseDto {

  id: string;

  organizationId: string;

  name: string;

  description?: string | null;

  color?: string | null;

  icon?: string | null;

  ownerId: string;

  createdAt: Date;

  updatedAt: Date;

}





export interface TeamMemberResponseDto {

  id: string;

  teamId: string;

  userId: string;

  role: TeamRole;

  joinedAt: Date;

}





export interface TeamListResponseDto {

  teams: TeamResponseDto[];

  pagination: {

    page: number;

    limit: number;

    total: number;

    totalPages: number;

  };

}