import {
  Client,
  ClientStatus,
  Prisma,
} from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { AppError } from '../../../core/errors/AppError';
import { ClientQueryDto } from './client.dto';

export interface CreateClientRecord {
  organizationId: string;
  ownerId: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateClientRecord {
  name?: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  ownerId?: string;
  status?: ClientStatus;
}

const assertActiveOwner = async (
  transaction: Prisma.TransactionClient,
  organizationId: string,
  ownerId: string,
): Promise<void> => {
  const owner = await transaction.user.findFirst({
    where: {
      id: ownerId,
      organizationId,
      isActive: true,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!owner) {
    throw new AppError('Invalid client owner', 400);
  }
};

export class ClientRepository {
  async create(input: CreateClientRecord): Promise<Client> {
    return prisma.$transaction(async (transaction) => {
      await assertActiveOwner(
        transaction,
        input.organizationId,
        input.ownerId,
      );

      return transaction.client.create({
        data: {
          organizationId: input.organizationId,
          ownerId: input.ownerId,
          name: input.name,
          industry: input.industry,
          website: input.website,
          phone: input.phone,
          email: input.email,
          address: input.address,
        },
      });
    });
  }

  async findById(organizationId: string, id: string): Promise<Client | null> {
    return prisma.client.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        _count: {
          select: { contacts: true, activities: true },
        },
      },
    });
  }

  async findMany(
    organizationId: string,
    query: ClientQueryDto,
  ): Promise<{ data: Client[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ClientWhereInput = {
      organizationId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { industry: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    return { data, total };
  }

  async update(
    id: string,
    organizationId: string,
    input: UpdateClientRecord,
  ): Promise<Client> {
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.client.findFirst({
        where: {
          id,
          organizationId,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!existing) {
        throw new AppError('Client not found', 404);
      }

      if (input.ownerId) {
        await assertActiveOwner(transaction, organizationId, input.ownerId);
      }

      return transaction.client.update({
        where: {
          id,
          organizationId,
          deletedAt: null,
        },
        data: {
          name: input.name,
          industry: input.industry,
          website: input.website,
          phone: input.phone,
          email: input.email,
          address: input.address,
          ownerId: input.ownerId,
          status: input.status,
        },
      });
    });
  }

  async softDelete(
    id: string,
    organizationId: string,
    deletedAt: Date,
  ): Promise<void> {
    const result = await prisma.client.updateMany({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      data: { deletedAt },
    });

    if (result.count !== 1) {
      throw new AppError('Client not found', 404);
    }
  }
}
