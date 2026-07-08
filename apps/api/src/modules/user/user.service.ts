import { UserRepository } from './user.repository';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './user.dto';
import { AppError } from '../../core/errors/AppError';

export class UserService {
    private repository: UserRepository;

    constructor() {
        this.repository = new UserRepository();
    }

    async getUsers(organizationId: string, query: UserQueryDto) {
        // Zod parses query params as strings. Let's ensure types are casted properly in controller.
        return this.repository.findMany(organizationId, query);
    }

    async getUserById(organizationId: string, userId: string) {
        const user = await this.repository.findById(organizationId, userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    }

    async createUser(organizationId: string, data: CreateUserDto) {
        const existing = await this.repository.findByEmail(organizationId, data.email);
        if (existing) {
            throw new AppError('User with this email already exists in the organization', 400);
        }
        return this.repository.create(organizationId, data);
    }

    async updateUser(organizationId: string, userId: string, data: UpdateUserDto) {
        const user = await this.repository.safeUpdate(organizationId, userId, data);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    }

    async updateUserStatus(organizationId: string, userId: string, isActive: boolean) {
        const user = await this.repository.safeUpdate(organizationId, userId, { isActive });
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    }

    async deleteUser(organizationId: string, userId: string) {
        const user = await this.repository.softDelete(organizationId, userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    }
}
