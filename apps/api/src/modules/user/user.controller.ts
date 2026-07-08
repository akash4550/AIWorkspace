import { Request, Response } from 'express';
import { UserService } from './user.service';
import { Role } from '@prisma/client';

export class UserController {
    private service: UserService;

    constructor() {
        this.service = new UserService();
    }

    getUsers = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        
        // Parse query params safely
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const role = req.query.role as Role;
        let isActive: boolean | undefined;
        
        if (req.query.isActive !== undefined) {
            isActive = req.query.isActive === 'true';
        }

        const result = await this.service.getUsers(organizationId, { page, limit, search, role, isActive });
        res.status(200).json({ success: true, ...result });
    };

    getUserById = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const userId = req.params.id;
        const user = await this.service.getUserById(organizationId, userId);
        res.status(200).json({ success: true, data: user });
    };

    createUser = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const user = await this.service.createUser(organizationId, req.body);
        res.status(201).json({ success: true, data: user });
    };

    updateUser = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const userId = req.params.id;
        const user = await this.service.updateUser(organizationId, userId, req.body);
        res.status(200).json({ success: true, data: user });
    };

    updateUserStatus = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const userId = req.params.id;
        const { isActive } = req.body;
        const user = await this.service.updateUserStatus(organizationId, userId, isActive);
        res.status(200).json({ success: true, data: user });
    };

    deleteUser = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const userId = req.params.id;
        await this.service.deleteUser(organizationId, userId);
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    };
}
