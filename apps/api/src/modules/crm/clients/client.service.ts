import { ClientRepository } from './client.repository';
import { CreateClientDto, UpdateClientDto, ClientQueryDto } from './client.dto';
import { eventBus } from '../../../core/events/EventBus';
import { AppError } from '../../../core/errors/AppError';

export class ClientService {
  private repository: ClientRepository;

  constructor() {
    this.repository = new ClientRepository();
  }

  async createClient(organizationId: string, createdById: string, dto: CreateClientDto) {
    const ownerId = dto.ownerId ?? createdById;
    const client = await this.repository.create({
      organizationId,
      ownerId,
      name: dto.name,
      industry: dto.industry,
      website: dto.website,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
    });

    eventBus.emitEvent('ClientCreated', { organizationId, clientId: client.id });
    return client;
  }

  async getClients(organizationId: string, query: ClientQueryDto) {
    return this.repository.findMany(organizationId, query);
  }

  async getClient(organizationId: string, id: string) {
    const client = await this.repository.findById(organizationId, id);
    if (!client) throw new AppError('Client not found', 404);
    return client;
  }

  async updateClient(organizationId: string, id: string, dto: UpdateClientDto) {
    const updated = await this.repository.update(id, organizationId, dto);
    eventBus.emitEvent('ClientUpdated', { organizationId, clientId: id });
    return updated;
  }

  async deleteClient(organizationId: string, id: string) {
    await this.repository.softDelete(id, organizationId, new Date());
    eventBus.emitEvent('ClientDeleted', { organizationId, clientId: id });
    return true;
  }
}
