import {
  CRMActivity,
  CRMActivityType,
  Prisma,
} from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { AppError } from '../../../core/errors/AppError';
import { CRMActivityQueryDto } from './activity.dto';

export interface CreateCRMActivityRecord {
  organizationId: string;
  createdById: string;
  type: CRMActivityType;
  description: string;
  clientId?: string;
  leadId?: string;
  opportunityId?: string;
}

const assertValidCreator = async (
  transaction: Prisma.TransactionClient,
  organizationId: string,
  createdById: string,
): Promise<void> => {
  const creator = await transaction.user.findFirst({
    where: {
      id: createdById,
      organizationId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!creator) {
    throw new AppError('Invalid activity creator', 400);
  }
};

const assertValidClient = async (
  transaction: Prisma.TransactionClient,
  organizationId: string,
  clientId: string,
): Promise<void> => {
  const client = await transaction.client.findFirst({
    where: {
      id: clientId,
      organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!client) {
    throw new AppError('Invalid activity client', 400);
  }
};

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
    throw new AppError('Invalid activity lead', 400);
  }
};

const getValidOpportunity = async (
  transaction: Prisma.TransactionClient,
  organizationId: string,
  opportunityId: string,
): Promise<{
  id: string;
  leadId: string;
}> => {
  const opportunity =
    await transaction.opportunity.findFirst({
      where: {
        id: opportunityId,
        organizationId,
        deletedAt: null,
        lead: {
          organizationId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        leadId: true,
      },
    });

  if (!opportunity) {
    throw new AppError(
      'Invalid activity opportunity',
      400,
    );
  }

  return opportunity;
};

export class CRMActivityRepository {
  async create(
    input: CreateCRMActivityRecord,
  ): Promise<CRMActivity> {
    return prisma.$transaction(async (transaction) => {
      await assertValidCreator(
        transaction,
        input.organizationId,
        input.createdById,
      );

      if (input.clientId) {
        await assertValidClient(
          transaction,
          input.organizationId,
          input.clientId,
        );
      }

      if (input.leadId) {
        await assertValidLead(
          transaction,
          input.organizationId,
          input.leadId,
        );
      }

      if (input.opportunityId) {
        const opportunity = await getValidOpportunity(
          transaction,
          input.organizationId,
          input.opportunityId,
        );

        if (
          input.leadId &&
          opportunity.leadId !== input.leadId
        ) {
          throw new AppError(
            'Activity lead does not match the opportunity',
            400,
          );
        }
      }

      return transaction.cRMActivity.create({
        data: {
          organizationId: input.organizationId,
          createdById: input.createdById,
          type: input.type,
          description: input.description,
          clientId: input.clientId,
          leadId: input.leadId,
          opportunityId: input.opportunityId,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });
    });
  }

  async findMany(
    organizationId: string,
    query: CRMActivityQueryDto,
  ): Promise<{
    data: CRMActivity[];
    total: number;
  }> {
    const {
      page = 1,
      limit = 20,
      clientId,
      leadId,
      opportunityId,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.CRMActivityWhereInput = {
      organizationId,
      ...(clientId
        ? {
            clientId,
          }
        : {}),
      ...(leadId
        ? {
            leadId,
          }
        : {}),
      ...(opportunityId
        ? {
            opportunityId,
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.cRMActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.cRMActivity.count({
        where,
      }),
    ]);

    return {
      data,
      total,
    };
  }
}