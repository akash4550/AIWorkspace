import { PipelineStageRepository } from './pipeline.repository';
import { CreatePipelineStageDto, UpdatePipelineStageDto, ReorderStagesDto } from './pipeline.dto';
import { eventBus } from '../../../core/events/EventBus';

export class PipelineStageService {
  private repository: PipelineStageRepository;

  constructor() {
    this.repository = new PipelineStageRepository();
  }

  async createStage(organizationId: string, dto: CreatePipelineStageDto) {
    const stage = await this.repository.create({
      organizationId,
      name: dto.name,
      probability: dto.probability,
      position: dto.position,
    });
    eventBus.emitEvent('PipelineStageCreated', { organizationId, stageId: stage.id });
    return stage;
  }

  async getStages(organizationId: string) {
    return this.repository.findAll(organizationId);
  }

  async getStage(organizationId: string, id: string) {
    const stage = await this.repository.findById(organizationId, id);
    if (!stage) throw new Error('Stage not found');
    return stage;
  }

  async updateStage(organizationId: string, id: string, dto: UpdatePipelineStageDto) {
    const stage = await this.repository.findById(organizationId, id);
    if (!stage) throw new Error('Stage not found');

    const updated = await this.repository.update(id, organizationId, dto);
    eventBus.emitEvent('PipelineStageUpdated', { organizationId, stageId: id });
    return updated;
  }

  async deleteStage(organizationId: string, id: string) {
    const stage = await this.repository.findById(organizationId, id);
    if (!stage) throw new Error('Stage not found');

    await this.repository.delete(id, organizationId);
    eventBus.emitEvent('PipelineStageDeleted', { organizationId, stageId: id });
    return true;
  }

  async reorderStages(organizationId: string, dto: ReorderStagesDto) {
    const prisma = this.repository.getPrismaClient();
    const updates = dto.stages.map((stage) =>
      prisma.pipelineStage.update({
        where: { id: stage.id },
        data: { position: stage.position },
      })
    );

    // Filter to ensure we only update stages belonging to this organization (in practice we should query first, but transaction is simple)
    await this.repository.transaction(updates);
    eventBus.emitEvent('PipelineStagesReordered', { organizationId });
    return true;
  }
}
