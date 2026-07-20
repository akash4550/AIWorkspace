import {
  Contact,
  Prisma,
} from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { AppError } from '../../../core/errors/AppError';
import { ContactQueryDto } from './contact.dto';

export interface CreateContactRecord {
  organizationId: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  designation?: string;
}

export interface UpdateContactRecord {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  designation?: string;
}

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
    throw new AppError('Invalid contact client', 400);
  }
};

export class ContactRepository {
  async create(
    input: CreateContactRecord,
  ): Promise<Contact> {
    return prisma.$transaction(async (transaction) => {
      await assertValidClient(
        transaction,
        input.organizationId,
        input.clientId,
      );

      return transaction.contact.create({
        data: {
          organizationId: input.organizationId,
          clientId: input.clientId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          designation: input.designation,
        },
      });
    });
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<Contact | null> {
    return prisma.contact.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });
  }

  async findMany(
    organizationId: string,
    query: ContactQueryDto,
  ): Promise<{
    data: Contact[];
    total: number;
  }> {
    const {
      page = 1,
      limit = 10,
      clientId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ContactWhereInput = {
      organizationId,
      deletedAt: null,
      ...(clientId
        ? {
            clientId,
          }
        : {}),
      ...(search
        ? {
            OR: [
              {
                firstName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                lastName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.contact.count({
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
    input: UpdateContactRecord,
  ): Promise<Contact> {
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.contact.findFirst({
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
        throw new AppError('Contact not found', 404);
      }

      return transaction.contact.update({
        where: {
          id,
          organizationId,
          deletedAt: null,
        },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          designation: input.designation,
        },
      });
    });
  }

  async softDelete(
    id: string,
    organizationId: string,
    deletedAt: Date,
  ): Promise<void> {
    const result = await prisma.contact.updateMany({
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
      throw new AppError('Contact not found', 404);
    }
  }
}