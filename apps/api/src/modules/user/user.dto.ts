import { Role } from '@prisma/client';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface UserProfileUpdateDto {
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
}

export interface UserStatusUpdateDto {
  isActive: boolean;
}

export interface UserRoleUpdateDto {
  role: Role;
}

export interface UserUpdateActor {
  id: string;
  organizationId: string;
  role: Role;
}

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: Role;
  organizationId: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListResponseDto {
  users: UserResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
}
