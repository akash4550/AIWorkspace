export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role:
    | 'SUPER_ADMIN'
    | 'ADMIN'
    | 'MANAGER'
    | 'EMPLOYEE';
}


export interface UpdateUserDto {
  name?: string;
  role?:
    | 'SUPER_ADMIN'
    | 'ADMIN'
    | 'MANAGER'
    | 'EMPLOYEE';

  isActive?: boolean;
}


export interface UserResponseDto {
  id: string;
  email: string;
  name: string;

  role:
    | 'SUPER_ADMIN'
    | 'ADMIN'
    | 'MANAGER'
    | 'EMPLOYEE';

  organizationId: string;

  isActive: boolean;

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

  role?:
    | 'SUPER_ADMIN'
    | 'ADMIN'
    | 'MANAGER'
    | 'EMPLOYEE';
}