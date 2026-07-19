import { AppError } from '../../../core/errors/AppError';
import { eventBus } from '../../../core/events/EventBus';
import {
  CreateOpportunityDto,
  OpportunityQueryDto,
  UpdateOpportunityDto,
} from './opportunity.dto';
import {
  OpportunityRepository,
  UpdateOpportunityRecord,
} from './opportunity.repository';

export class OpportunityService {
  private repository: OpportunityRepository;

  constructor() {
    this.repository = new OpportunityRepository();
  }

  async createOpportunity(
    organizationId: string,
    dto: CreateOpportunityDto,
  ) {
    const opportunity = await this.repository.create({
      organizationId,
      leadId: dto.leadId,
      stageId: dto.stageId,
      expectedRevenue: dto.expectedRevenue,
      closeDate: dto.closeDate
        ? new Date(dto.closeDate)
        : undefined,
      probability: dto.probability,
    });

    eventBus.emitEvent('OpportunityCreated', {
      organizationId,
      opportunityId: opportunity.id,
    });

    return opportunity;
  }

  async getOpportunities(
    organizationId: string,
    query: OpportunityQueryDto,
  ) {
    return this.repository.findMany(
      organizationId,
      query,
    );
  }

  async getOpportunity(
    organizationId: string,
    id: string,
  ) {
    const opportunity = await this.repository.findById(
      organizationId,
      id,
    );

    if (!opportunity) {
      throw new AppError(
        'Opportunity not found',
        404,
      );
    }

    return opportunity;
  }

  async updateOpportunity(
    organizationId: string,
    id: string,
    dto: UpdateOpportunityDto,
  ) {
    const updateData: UpdateOpportunityRecord = {
      leadId: dto.leadId,
      stageId: dto.stageId,
      expectedRevenue: dto.expectedRevenue,
      closeDate:
        dto.closeDate === undefined
          ? undefined
          : new Date(dto.closeDate),
      probability: dto.probability,
    };

    const updated = await this.repository.update(
      id,
      organizationId,
      updateData,
    );

    eventBus.emitEvent('OpportunityUpdated', {
      organizationId,
      opportunityId: id,
    });

    return updated;
  }

  async deleteOpportunity(
    organizationId: string,
    id: string,
  ): Promise<void> {
    await this.repository.softDelete(
      id,
      organizationId,
      new Date(),
    );

    eventBus.emitEvent('OpportunityDeleted', {
      organizationId,
      opportunityId: id,
    });
  }
}