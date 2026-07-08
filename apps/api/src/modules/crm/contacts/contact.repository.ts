import { PrismaClient, Contact, Prisma } from '@prisma/client';
import { ContactQueryDto } from './contact.dto';

const prisma = new PrismaClient();

export class ContactRepository {
  async create(data: Prisma.ContactUncheckedCreateInput): Promise<Contact> {
    return prisma.contact.create({ data });
  }

  async findById(organizationId: string, id: string): Promise<Contact | null> {
    return prisma.contact.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });
  }

  async findMany(organizationId: string, query: ContactQueryDto): Promise<{ data: Contact[]; total: number }> {
    const { page = 1, limit = 10, clientId, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContactWhereInput = {
      organizationId,
      deletedAt: null,
      ...(clientId ? { clientId } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.contact.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, organizationId: string, data: Prisma.ContactUncheckedUpdateInput): Promise<Contact> {
    return prisma.contact.update({
      where: { id },
      data,
    });
  }
}
