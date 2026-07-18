import { Role } from '@prisma/client';

export interface LoginDto {
  email: string;
  password: string;
  organizationId: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface LoginMetadata {
  device?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface JwtAccessPayload {
  userId: string;
  organizationId: string;
  role: Role;
}

export interface JwtRefreshPayload {
  userId: string;
  jti: string;
  type: 'refresh';
}

export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  role: Role;
}

export interface LoginResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}