import { CRMActivityRepository } from './activity.repository';
import { CreateCRMActivityDto, CRMActivityQueryDto } from './activity.dto';
import { eventBus } from '../../../core/events/EventBus';

export class CRMActivityService {
  private repository: CRMActivityRepository;

  constructor() {
    this.repository = new CRMActivityRepository();
  }

  async createActivity(organizationId: string, createdById: string, dto: CreateCRMActivityDto) {
    const activity = await this.repository.create({
      organizationId,
      createdById,
      type: dto.type,
      description: dto.content,
      clientId: dto.clientId,
      leadId: dto.leadId,
      opportunityId: dto.opportunityId,
    });

    eventBus.emitEvent('CRMActivityLogged', { organizationId, activityId: activity.id });
    return activity;
  }

  async getActivities(organizationId: string, query: CRMActivityQueryDto) {
    return this.repository.findMany(organizationId, query);
  }
}
