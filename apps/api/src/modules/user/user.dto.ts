import { Role } from '@prisma/client';

export interface CreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    password?: string; // Optional because we might auto-generate it or send invite
}

export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    role?: Role;
    avatar?: string | null;
}

export interface UserQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
    isActive?: boolean;
}
