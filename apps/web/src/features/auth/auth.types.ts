import type { Role } from '../../config/navigation';

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

export interface AuthUser {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatar: string | null;
  emailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export interface AuthSession {
  user: AuthUser;
  organization: AuthOrganization;
}

export interface AuthPayload extends AuthSession {
  accessToken: string;
}

export interface LoginCredentials {
  organizationId: string;
  email: string;
  password: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}
