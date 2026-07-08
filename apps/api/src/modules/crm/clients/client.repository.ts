import { PrismaClient, Client, Prisma } from '@prisma/client';
import { ClientQueryDto } from './client.dto';

const prisma = new PrismaClient();

export class ClientRepository {
  async create(data: Prisma.ClientUncheckedCreateInput): Promise<Client> {
    return prisma.client.create({ data });
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
          select: { contacts: true, activities: true }
        }
      },
    });
  }

  async findMany(organizationId: string, query: ClientQueryDto): Promise<{ data: Client[]; total: number }> {
    const { page = 1, limit = 10, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
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
        take: Number(limit),
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

  async update(id: string, organizationId: string, data: Prisma.ClientUncheckedUpdateInput): Promise<Client> {
    return prisma.client.update({
      where: { id },
      data,
    });
  }
}
