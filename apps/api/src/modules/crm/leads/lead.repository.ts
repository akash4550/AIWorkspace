import {
  Lead,
  LeadStatus,
  Prisma,
} from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { AppError } from '../../../core/errors/AppError';
import { LeadQueryDto } from './lead.dto';

export interface CreateLeadRecord {
  organizationId: string;
  title: string;
  source?: string;
  score?: number;
  assignedTo?: string;
  expectedValue?: number;
}

export interface UpdateLeadRecord {
  title?: string;
  source?: string;
  score?: number;
  status?: LeadStatus;
  assignedTo?: string;
  expectedValue?: number;
}

const assertActiveAssignee = async (
  transaction: Prisma.TransactionClient,
  organizationId: string,
  assignedTo: string,
): Promise<void> => {
  const assignee = await transaction.user.findFirst({
    where: {
      id: assignedTo,
      organizationId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!assignee) {
    throw new AppError('Invalid lead assignee', 400);
  }
};

export class LeadRepository {
  async create(input: CreateLeadRecord): Promise<Lead> {
    return prisma.$transaction(async (transaction) => {
      if (input.assignedTo) {
        await assertActiveAssignee(
          transaction,
          input.organizationId,
          input.assignedTo,
        );
      }

      return transaction.lead.create({
        data: {
          organizationId: input.organizationId,
          title: input.title,
          source: input.source,
          score: input.score,
          assignedTo: input.assignedTo,
          expectedValue: input.expectedValue,
        },
      });
    });
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<Lead | null> {
    return prisma.lead.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            opportunities: true,
            activities: true,
          },
        },
      },
    });
  }

  async findMany(
    organizationId: string,
    query: LeadQueryDto,
  ): Promise<{ data: Lead[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {
      organizationId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                source: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.lead.count({
        where,
      }),
    ]);

    return {
      data,
      total,
    };
  }

  async update(
    id: string,
    organizationId: string,
    input: UpdateLeadRecord,
  ): Promise<Lead> {
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.lead.findFirst({
        where: {
          id,
          organizationId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!existing) {
        throw new AppError('Lead not found', 404);
      }

      if (input.assignedTo) {
        await assertActiveAssignee(
          transaction,
          organizationId,
          input.assignedTo,
        );
      }

      return transaction.lead.update({
        where: {
          id,
          organizationId,
          deletedAt: null,
        },
        data: {
          title: input.title,
          source: input.source,
          score: input.score,
          status: input.status,
          assignedTo: input.assignedTo,
          expectedValue: input.expectedValue,
        },
      });
    });
  }

  async softDelete(
    id: string,
    organizationId: string,
    deletedAt: Date,
  ): Promise<void> {
    const result = await prisma.lead.updateMany({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      data: {
        deletedAt,
      },
    });

    if (result.count !== 1) {
      throw new AppError('Lead not found', 404);
    }
  }
}