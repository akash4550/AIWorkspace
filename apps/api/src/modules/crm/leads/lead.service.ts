import { AppError } from '../../../core/errors/AppError';
import { eventBus } from '../../../core/events/EventBus';
import {
  CreateLeadDto,
  LeadQueryDto,
  UpdateLeadDto,
} from './lead.dto';
import { LeadRepository } from './lead.repository';

export class LeadService {
  private repository: LeadRepository;

  constructor() {
    this.repository = new LeadRepository();
  }

  async createLead(
    organizationId: string,
    _createdById: string,
    dto: CreateLeadDto,
  ) {
    const lead = await this.repository.create({
      organizationId,
      title: dto.title,
      source: dto.source,
      score: dto.score,
      assignedTo: dto.assignedTo,
      expectedValue: dto.expectedValue,
    });

    eventBus.emitEvent('LeadCreated', {
      organizationId,
      leadId: lead.id,
    });

    return lead;
  }

  async getLeads(
    organizationId: string,
    query: LeadQueryDto,
  ) {
    return this.repository.findMany(organizationId, query);
  }

  async getLead(
    organizationId: string,
    id: string,
  ) {
    const lead = await this.repository.findById(
      organizationId,
      id,
    );

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    return lead;
  }

  async updateLead(
    organizationId: string,
    id: string,
    dto: UpdateLeadDto,
  ) {
    const updated = await this.repository.update(
      id,
      organizationId,
      dto,
    );

    eventBus.emitEvent('LeadUpdated', {
      organizationId,
      leadId: id,
    });

    return updated;
  }

  async deleteLead(
    organizationId: string,
    id: string,
  ) {
    await this.repository.softDelete(
      id,
      organizationId,
      new Date(),
    );

    eventBus.emitEvent('LeadDeleted', {
      organizationId,
      leadId: id,
    });
  }
}