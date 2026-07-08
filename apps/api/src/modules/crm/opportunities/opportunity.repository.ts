import { PrismaClient, Opportunity, Prisma } from '@prisma/client';
import { OpportunityQueryDto } from './opportunity.dto';

const prisma = new PrismaClient();

export class OpportunityRepository {
  async create(data: Prisma.OpportunityUncheckedCreateInput): Promise<Opportunity> {
    return prisma.opportunity.create({ data });
  }

  async findById(organizationId: string, id: string): Promise<Opportunity | null> {
    return prisma.opportunity.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        lead: {
          select: { id: true, title: true, score: true, status: true },
        },
        stage: true,
      },
    });
  }

  async findMany(organizationId: string, query: OpportunityQueryDto): Promise<{ data: Opportunity[]; total: number }> {
    const { page = 1, limit = 10, stageId, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OpportunityWhereInput = {
      organizationId,
      deletedAt: null,
      ...(stageId ? { stageId } : {}),
      ...(search
        ? {
            lead: {
              title: { contains: search, mode: 'insensitive' },
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          lead: {
            select: { id: true, title: true, assignedTo: true },
          },
          stage: true,
        },
      }),
      prisma.opportunity.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, organizationId: string, data: Prisma.OpportunityUncheckedUpdateInput): Promise<Opportunity> {
    return prisma.opportunity.update({
      where: { id },
      data,
    });
  }
}
