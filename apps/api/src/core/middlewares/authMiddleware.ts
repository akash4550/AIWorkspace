import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    // In a real implementation (Phase 4), we would extract and verify the JWT here.
    // Since Phase 4 was skipped by the user and we went straight to Phase 5,
    // we will mock the auth middleware by fetching the demo admin from the DB.
    
    try {
        const authHeader = req.headers.authorization;
        
        // For development/testing of Phase 5, if no token, assume the demo admin
        // In production, this would strictly throw 401 Unauthorized if missing.
        let email = 'admin@aiworkspace.com'; 

        // Simple mock for testing different users: "Bearer user_id_here"
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            // If the token looks like a UUID, we mock it as a user ID login for testing RBAC
            if (token.length > 20) {
               const user = await prisma.user.findUnique({ where: { id: token } });
               if (user) {
                   req.user = { id: user.id, organizationId: user.organizationId, role: user.role };
                   return next();
               }
            }
        }

        const adminUser = await prisma.user.findUnique({
            where: { email }
        });

        if (!adminUser) {
            return next(new AppError('Unauthorized - Demo user not found (Did you run seed?)', 401));
        }

        req.user = {
            id: adminUser.id,
            organizationId: adminUser.organizationId,
            role: adminUser.role
        };

        next();
    } catch (error) {
        next(new AppError('Invalid token', 401));
    }
};
