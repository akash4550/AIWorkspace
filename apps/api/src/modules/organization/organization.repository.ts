import { PrismaClient } from '@prisma/client';
import { UpdateOrganizationDto } from './organization.dto';

const prisma = new PrismaClient();

export class OrganizationRepository {
    async findById(organizationId: string) {
        return prisma.organization.findUnique({
            where: { id: organizationId }
        });
    }

    async findBySlug(slug: string) {
        return prisma.organization.findUnique({
            where: { slug }
        });
    }

    async update(organizationId: string, data: UpdateOrganizationDto) {
        return prisma.organization.update({
            where: { id: organizationId },
            data
        });
    }
}
