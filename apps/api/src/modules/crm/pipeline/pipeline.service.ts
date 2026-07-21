import { AppError } from '../../../core/errors/AppError';
import { eventBus } from '../../../core/events/EventBus';
import {
  CreatePipelineStageDto,
  ReorderStagesDto,
  UpdatePipelineStageDto,
} from './pipeline.dto';
import { PipelineStageRepository } from './pipeline.repository';

export class PipelineStageService {
  private repository: PipelineStageRepository;

  constructor() {
    this.repository = new PipelineStageRepository();
  }

  async createStage(
    organizationId: string,
    dto: CreatePipelineStageDto,
  ) {
    const stage = await this.repository.create({
      organizationId,
      name: dto.name,
      probability: dto.probability,
      position: dto.position,
    });

    eventBus.emitEvent('PipelineStageCreated', {
      organizationId,
      stageId: stage.id,
    });

    return stage;
  }

  async getStages(organizationId: string) {
    return this.repository.findAll(organizationId);
  }

  async getStage(
    organizationId: string,
    id: string,
  ) {
    const stage = await this.repository.findById(
      organizationId,
      id,
    );

    if (!stage) {
      throw new AppError(
        'Pipeline stage not found',
        404,
      );
    }

    return stage;
  }

  async updateStage(
    organizationId: string,
    id: string,
    dto: UpdatePipelineStageDto,
  ) {
    const stage = await this.repository.update(
      id,
      organizationId,
      {
        name: dto.name,
        probability: dto.probability,
        position: dto.position,
      },
    );

    eventBus.emitEvent('PipelineStageUpdated', {
      organizationId,
      stageId: stage.id,
    });

    return stage;
  }

  async deleteStage(
    organizationId: string,
    id: string,
  ) {
    await this.repository.delete(
      id,
      organizationId,
    );

    eventBus.emitEvent('PipelineStageDeleted', {
      organizationId,
      stageId: id,
    });
  }

  async reorderStages(
    organizationId: string,
    dto: ReorderStagesDto,
  ) {
    await this.repository.reorder(
      organizationId,
      {
        stages: dto.stages,
      },
    );

    eventBus.emitEvent('PipelineStagesReordered', {
      organizationId,
    });
  }
}