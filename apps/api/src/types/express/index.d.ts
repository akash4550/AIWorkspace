import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      organizationId: string;
      role: Role;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};