import { PrismaClient, PipelineStage, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class PipelineStageRepository {
  async create(data: Prisma.PipelineStageUncheckedCreateInput): Promise<PipelineStage> {
    return prisma.pipelineStage.create({ data });
  }

  async findById(organizationId: string, id: string): Promise<PipelineStage | null> {
    return prisma.pipelineStage.findFirst({
      where: {
        id,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string): Promise<PipelineStage[]> {
    return prisma.pipelineStage.findMany({
      where: { organizationId },
      orderBy: { position: 'asc' },
    });
  }

  async update(id: string, organizationId: string, data: Prisma.PipelineStageUncheckedUpdateInput): Promise<PipelineStage> {
    return prisma.pipelineStage.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await prisma.pipelineStage.delete({
      where: { id, organizationId },
    });
  }

  async transaction(queries: any[]) {
    return prisma.$transaction(queries);
  }

  getPrismaClient() {
    return prisma;
  }
}
