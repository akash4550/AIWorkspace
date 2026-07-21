import {
  Opportunity,
  Prisma,
} from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { AppError } from '../../../core/errors/AppError';
import { OpportunityQueryDto } from './opportunity.dto';

export interface CreateOpportunityRecord {
  organizationId: string;
  leadId: string;
  stageId: string;
  expectedRevenue?: number;
  closeDate?: Date;
  probability?: number;
}

export interface UpdateOpportunityRecord {
  leadId?: string;
  stageId?: string;
  expectedRevenue?: number;
  closeDate?: Date;
  probability?: number;
}

const assertValidLead = async (
  transaction: Prisma.TransactionClient,
  organizationId: string,
  leadId: string,
): Promise<void> => {
  const lead = await transaction.lead.findFirst({
    where: {
      id: leadId,
      organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!lead) {
    throw new AppError('Invalid opportunity lead', 400);
  }
};

const assertValidStage = async (
  transaction: Prisma.TransactionClient,
  organizationId: string,
  stageId: string,
): Promise<void> => {
  const stage = await transaction.pipelineStage.findFirst({
    where: {
      id: stageId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!stage) {
    throw new AppError('Invalid opportunity stage', 400);
  }
};

export class OpportunityRepository {
  async create(
    input: CreateOpportunityRecord,
  ): Promise<Opportunity> {
    return prisma.$transaction(async (transaction) => {
      await assertValidLead(
        transaction,
        input.organizationId,
        input.leadId,
      );

      await assertValidStage(
        transaction,
        input.organizationId,
        input.stageId,
      );

      return transaction.opportunity.create({
        data: {
          organizationId: input.organizationId,
          leadId: input.leadId,
          stageId: input.stageId,
          expectedRevenue: input.expectedRevenue,
          closeDate: input.closeDate,
          probability: input.probability,
        },
      });
    });
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<Opportunity | null> {
    return prisma.opportunity.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        lead: {
          select: {
            id: true,
            title: true,
            score: true,
            status: true,
          },
        },
        stage: true,
      },
    });
  }

  async findMany(
    organizationId: string,
    query: OpportunityQueryDto,
  ): Promise<{
    data: Opportunity[];
    total: number;
  }> {
    const {
      page = 1,
      limit = 10,
      stageId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.OpportunityWhereInput = {
      organizationId,
      deletedAt: null,
      ...(stageId
        ? {
            stageId,
          }
        : {}),
      ...(search
        ? {
            lead: {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          lead: {
            select: {
              id: true,
              title: true,
              assignedTo: true,
            },
          },
          stage: true,
        },
      }),
      prisma.opportunity.count({
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
    input: UpdateOpportunityRecord,
  ): Promise<Opportunity> {
    return prisma.$transaction(async (transaction) => {
      const existing =
        await transaction.opportunity.findFirst({
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
        throw new AppError(
          'Opportunity not found',
          404,
        );
      }

      if (input.leadId !== undefined) {
        await assertValidLead(
          transaction,
          organizationId,
          input.leadId,
        );
      }

      if (input.stageId !== undefined) {
        await assertValidStage(
          transaction,
          organizationId,
          input.stageId,
        );
      }

      return transaction.opportunity.update({
        where: {
          id,
          organizationId,
          deletedAt: null,
        },
        data: {
          leadId: input.leadId,
          stageId: input.stageId,
          expectedRevenue: input.expectedRevenue,
          closeDate: input.closeDate,
          probability: input.probability,
        },
      });
    });
  }

  async softDelete(
    id: string,
    organizationId: string,
    deletedAt: Date,
  ): Promise<void> {
    const result = await prisma.opportunity.updateMany({
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
      throw new AppError(
        'Opportunity not found',
        404,
      );
    }
  }
}