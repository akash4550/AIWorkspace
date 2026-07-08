import { LeadRepository } from './lead.repository';
import { CreateLeadDto, UpdateLeadDto, LeadQueryDto } from './lead.dto';
import { eventBus } from '../../../core/events/EventBus';

export class LeadService {
  private repository: LeadRepository;

  constructor() {
    this.repository = new LeadRepository();
  }

  async createLead(organizationId: string, createdById: string, dto: CreateLeadDto) {
    const lead = await this.repository.create({
      organizationId,
      title: dto.title,
      source: dto.source,
      score: dto.score,
      assignedTo: dto.assignedTo,
      expectedValue: dto.expectedValue,
    });

    eventBus.emitEvent('LeadCreated', { organizationId, leadId: lead.id });
    return lead;
  }

  async getLeads(organizationId: string, query: LeadQueryDto) {
    return this.repository.findMany(organizationId, query);
  }

  async getLead(organizationId: string, id: string) {
    const lead = await this.repository.findById(organizationId, id);
    if (!lead) throw new Error('Lead not found');
    return lead;
  }

  async updateLead(organizationId: string, id: string, dto: UpdateLeadDto) {
    const lead = await this.repository.findById(organizationId, id);
    if (!lead) throw new Error('Lead not found');

    const updated = await this.repository.update(id, organizationId, dto);
    eventBus.emitEvent('LeadUpdated', { organizationId, leadId: id });
    return updated;
  }

  async deleteLead(organizationId: string, id: string) {
    const lead = await this.repository.findById(organizationId, id);
    if (!lead) throw new Error('Lead not found');

    await this.repository.update(id, organizationId, { deletedAt: new Date() });
    eventBus.emitEvent('LeadDeleted', { organizationId, leadId: id });
    return true;
  }
}
