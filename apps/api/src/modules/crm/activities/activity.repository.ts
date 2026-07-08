import { PrismaClient, CRMActivity, Prisma } from '@prisma/client';
import { CRMActivityQueryDto } from './activity.dto';

const prisma = new PrismaClient();

export class CRMActivityRepository {
  async create(data: Prisma.CRMActivityUncheckedCreateInput): Promise<CRMActivity> {
    return prisma.cRMActivity.create({
      data,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });
  }

  async findMany(organizationId: string, query: CRMActivityQueryDto): Promise<{ data: CRMActivity[]; total: number }> {
    const { page = 1, limit = 20, clientId, leadId, opportunityId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CRMActivityWhereInput = {
      organizationId,
      ...(clientId ? { clientId } : {}),
      ...(leadId ? { leadId } : {}),
      ...(opportunityId ? { opportunityId } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.cRMActivity.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      }),
      prisma.cRMActivity.count({ where }),
    ]);

    return { data, total };
  }
}
