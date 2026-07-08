import { OpportunityRepository } from './opportunity.repository';
import { CreateOpportunityDto, UpdateOpportunityDto, OpportunityQueryDto } from './opportunity.dto';
import { eventBus } from '../../../core/events/EventBus';

export class OpportunityService {
  private repository: OpportunityRepository;

  constructor() {
    this.repository = new OpportunityRepository();
  }

  async createOpportunity(organizationId: string, dto: CreateOpportunityDto) {
    const opp = await this.repository.create({
      organizationId,
      leadId: dto.leadId,
      stageId: dto.stageId,
      expectedRevenue: dto.expectedRevenue,
      closeDate: dto.closeDate ? new Date(dto.closeDate) : undefined,
      probability: dto.probability,
    });

    eventBus.emitEvent('OpportunityCreated', { organizationId, opportunityId: opp.id });
    return opp;
  }

  async getOpportunities(organizationId: string, query: OpportunityQueryDto) {
    return this.repository.findMany(organizationId, query);
  }

  async getOpportunity(organizationId: string, id: string) {
    const opp = await this.repository.findById(organizationId, id);
    if (!opp) throw new Error('Opportunity not found');
    return opp;
  }

  async updateOpportunity(organizationId: string, id: string, dto: UpdateOpportunityDto) {
    const opp = await this.repository.findById(organizationId, id);
    if (!opp) throw new Error('Opportunity not found');

    const updateData: any = { ...dto };
    if (dto.closeDate) {
      updateData.closeDate = new Date(dto.closeDate);
    }

    const updated = await this.repository.update(id, organizationId, updateData);
    eventBus.emitEvent('OpportunityUpdated', { organizationId, opportunityId: id });
    return updated;
  }

  async deleteOpportunity(organizationId: string, id: string) {
    const opp = await this.repository.findById(organizationId, id);
    if (!opp) throw new Error('Opportunity not found');

    await this.repository.update(id, organizationId, { deletedAt: new Date() });
    eventBus.emitEvent('OpportunityDeleted', { organizationId, opportunityId: id });
    return true;
  }
}
