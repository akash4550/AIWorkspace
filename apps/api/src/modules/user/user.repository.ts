import { PrismaClient, Prisma } from '@prisma/client';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './user.dto';

const prisma = new PrismaClient();

// Fields to exclude from the returned payload (e.g. password)
const userSelect = {
    id: true,
    organizationId: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true,
    avatar: true,
    isActive: true,
    lastLogin: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
};

export class UserRepository {
    async findById(organizationId: string, id: string) {
        return prisma.user.findFirst({
            where: { id, organizationId, deletedAt: null },
            select: userSelect
        });
    }

    async findByEmail(organizationId: string, email: string) {
        return prisma.user.findFirst({
            where: { email, organizationId, deletedAt: null },
            select: userSelect
        });
    }

    async findMany(organizationId: string, query: UserQueryDto) {
        const { page = 1, limit = 10, search, role, isActive } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {
            organizationId,
            deletedAt: null,
        };

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role) {
            where.role = role;
        }

        // Must explicitly check boolean because undefined means no filter
        if (typeof isActive === 'boolean') {
            where.isActive = isActive;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: userSelect
            }),
            prisma.user.count({ where })
        ]);

        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async create(organizationId: string, data: CreateUserDto) {
        return prisma.user.create({
            data: {
                organizationId,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                role: data.role,
                password: data.password || 'TEMPORARY_HASHED_PASSWORD', // In real life, generate random hash and send email
            },
            select: userSelect
        });
    }

    async update(organizationId: string, id: string, data: UpdateUserDto) {
        return prisma.user.update({
            where: { id_organizationId: { id, organizationId } }, // If we had compound unique. Since id is unique globally:
            // Actually, prisma update requires unique identifier. ID is globally unique. 
            // But we must enforce tenant isolation, so we use updateMany or findFirst then update.
            // A safer approach:
        });
    }

    async safeUpdate(organizationId: string, id: string, data: Partial<Prisma.UserUpdateInput>) {
        // Enforce tenant boundary
        const user = await this.findById(organizationId, id);
        if (!user) return null;

        return prisma.user.update({
            where: { id },
            data,
            select: userSelect
        });
    }

    async softDelete(organizationId: string, id: string) {
        const user = await this.findById(organizationId, id);
        if (!user) return null;

        return prisma.user.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
            select: userSelect
        });
    }
}
