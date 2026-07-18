import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  organizationId: string;
  role: Role;
}