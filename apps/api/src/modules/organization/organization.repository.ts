import { Prisma } from '@prisma/client';
import { UpdateOrganizationDto } from './organization.dto';
import { prisma } from '../../config/prisma';

const organizationSafeSelect = {
    id: true,
    name: true,
    slug: true,
    logo: true,
} satisfies Prisma.OrganizationSelect;

export class OrganizationRepository {
    async findById(organizationId: string) {
        return prisma.organization.findFirst({
            where: {
                id: organizationId,
                isActive: true,
                deletedAt: null,
            },
            select: organizationSafeSelect,
        });
    }

    async findBySlug(slug: string) {
        return prisma.organization.findUnique({
            where: { slug },
            select: { id: true },
        });
    }

    async update(organizationId: string, data: UpdateOrganizationDto) {
        try {
            return await prisma.organization.update({
                where: {
                    id: organizationId,
                    deletedAt: null,
                },
                data: {
                    ...(data.name !== undefined ? { name: data.name } : {}),
                    ...(data.slug !== undefined ? { slug: data.slug } : {}),
                    ...(data.logo !== undefined ? { logo: data.logo } : {}),
                },
                select: organizationSafeSelect,
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError
                && error.code === 'P2025'
            ) {
                return null;
            }

            throw error;
        }
    }
}
