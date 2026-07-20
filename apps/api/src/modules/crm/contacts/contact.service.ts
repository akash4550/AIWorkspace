import { AppError } from '../../../core/errors/AppError';
import { eventBus } from '../../../core/events/EventBus';
import {
  ContactQueryDto,
  CreateContactDto,
  UpdateContactDto,
} from './contact.dto';
import { ContactRepository } from './contact.repository';

export class ContactService {
  private readonly repository: ContactRepository;

  constructor() {
    this.repository = new ContactRepository();
  }

  async createContact(
    organizationId: string,
    dto: CreateContactDto,
  ) {
    const contact = await this.repository.create({
      organizationId,
      clientId: dto.clientId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      designation: dto.designation,
    });

    eventBus.emitEvent('ContactCreated', {
      organizationId,
      contactId: contact.id,
    });

    return contact;
  }

  async getContacts(
    organizationId: string,
    query: ContactQueryDto,
  ) {
    return this.repository.findMany(organizationId, query);
  }

  async getContact(
    organizationId: string,
    id: string,
  ) {
    const contact = await this.repository.findById(
      organizationId,
      id,
    );

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    return contact;
  }

  async updateContact(
    organizationId: string,
    id: string,
    dto: UpdateContactDto,
  ) {
    const updated = await this.repository.update(
      id,
      organizationId,
      dto,
    );

    eventBus.emitEvent('ContactUpdated', {
      organizationId,
      contactId: id,
    });

    return updated;
  }

  async deleteContact(
    organizationId: string,
    id: string,
  ): Promise<void> {
    await this.repository.softDelete(
      id,
      organizationId,
      new Date(),
    );

    eventBus.emitEvent('ContactDeleted', {
      organizationId,
      contactId: id,
    });
  }
}