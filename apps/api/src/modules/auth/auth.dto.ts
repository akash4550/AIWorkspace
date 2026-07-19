import { Role } from '@prisma/client';

export interface LoginDto {
  email: string;
  password: string;
  organizationId: string;
}

export interface LoginMetadata {
  device?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  role: Role;
}

export interface CurrentSessionResponse {
  user: {
    id: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    avatar: string | null;
    emailVerified: boolean;
    lastLogin: Date | null;
    createdAt: Date;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
}

export interface LoginResponse extends CurrentSessionResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse extends CurrentSessionResponse {
  accessToken: string;
  refreshToken: string;
}
