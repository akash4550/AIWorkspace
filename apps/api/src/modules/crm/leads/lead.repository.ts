import { PrismaClient, Lead, Prisma } from '@prisma/client';
import { LeadQueryDto } from './lead.dto';

const prisma = new PrismaClient();

export class LeadRepository {
  async create(data: Prisma.LeadUncheckedCreateInput): Promise<Lead> {
    return prisma.lead.create({ data });
  }

  async findById(organizationId: string, id: string): Promise<Lead | null> {
    return prisma.lead.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        _count: {
          select: { opportunities: true, activities: true }
        }
      },
    });
  }

  async findMany(organizationId: string, query: LeadQueryDto): Promise<{ data: Lead[]; total: number }> {
    const { page = 1, limit = 10, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {
      organizationId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { source: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignee: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, organizationId: string, data: Prisma.LeadUncheckedUpdateInput): Promise<Lead> {
    return prisma.lead.update({
      where: { id },
      data,
    });
  }
}
