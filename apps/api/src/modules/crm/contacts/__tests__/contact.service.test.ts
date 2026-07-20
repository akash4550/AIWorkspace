import { eventBus } from '../../../../core/events/EventBus';
import { ContactRepository } from '../contact.repository';
import { ContactService } from '../contact.service';

jest.mock('../contact.repository');
jest.mock('../../../../core/events/EventBus', () => ({
  eventBus: {
    emitEvent: jest.fn(),
  },
}));

describe('ContactService', () => {
  let service: ContactService;
  let repositoryMock: jest.Mocked<ContactRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ContactService();
    repositoryMock = (service as any)
      .repository as jest.Mocked<ContactRepository>;

    repositoryMock.create = jest.fn();
    repositoryMock.findById = jest.fn();
    repositoryMock.findMany = jest.fn();
    repositoryMock.update = jest.fn();
    repositoryMock.softDelete = jest.fn();
  });

  describe('createContact', () => {
    it('creates a contact, emits an event, and returns it', async () => {
      const mockContact = {
        id: 'contact-1',
        clientId: 'client-1',
        firstName: 'Asha',
        lastName: 'Sharma',
      };

      repositoryMock.create.mockResolvedValue(mockContact as any);

      const result = await service.createContact('org-1', {
        clientId: 'client-1',
        firstName: 'Asha',
        lastName: 'Sharma',
        email: 'asha@example.com',
      });

      expect(repositoryMock.create).toHaveBeenCalledWith({
        organizationId: 'org-1',
        clientId: 'client-1',
        firstName: 'Asha',
        lastName: 'Sharma',
        email: 'asha@example.com',
        phone: undefined,
        designation: undefined,
      });

      expect(eventBus.emitEvent).toHaveBeenCalledWith(
        'ContactCreated',
        {
          organizationId: 'org-1',
          contactId: 'contact-1',
        },
      );

      expect(result).toEqual(mockContact);
    });

    it('does not emit an event when creation fails', async () => {
      repositoryMock.create.mockRejectedValue(
        new Error('Invalid contact client'),
      );

      await expect(
        service.createContact('org-1', {
          clientId: 'client-1',
          firstName: 'Asha',
          lastName: 'Sharma',
        }),
      ).rejects.toThrow('Invalid contact client');

      expect(eventBus.emitEvent).not.toHaveBeenCalled();
    });
  });

  describe('getContact', () => {
    it('returns a tenant-scoped contact', async () => {
      const mockContact = {
        id: 'contact-1',
        firstName: 'Asha',
      };

      repositoryMock.findById.mockResolvedValue(
        mockContact as any,
      );

      const result = await service.getContact(
        'org-1',
        'contact-1',
      );

      expect(repositoryMock.findById).toHaveBeenCalledWith(
        'org-1',
        'contact-1',
      );

      expect(result).toEqual(mockContact);
    });

    it('throws when the contact is not found', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(
        service.getContact('org-1', 'contact-1'),
      ).rejects.toThrow('Contact not found');
    });
  });

  describe('updateContact', () => {
    it('updates the contact, emits an event, and returns it', async () => {
      const updatedContact = {
        id: 'contact-1',
        firstName: 'Ananya',
      };

      repositoryMock.update.mockResolvedValue(
        updatedContact as any,
      );

      const result = await service.updateContact(
        'org-1',
        'contact-1',
        {
          firstName: 'Ananya',
        },
      );

      expect(repositoryMock.update).toHaveBeenCalledWith(
        'contact-1',
        'org-1',
        {
          firstName: 'Ananya',
        },
      );

      expect(eventBus.emitEvent).toHaveBeenCalledWith(
        'ContactUpdated',
        {
          organizationId: 'org-1',
          contactId: 'contact-1',
        },
      );

      expect(result).toEqual(updatedContact);
    });

    it('does not emit an event when the update fails', async () => {
      repositoryMock.update.mockRejectedValue(
        new Error('Contact not found'),
      );

      await expect(
        service.updateContact(
          'org-1',
          'contact-1',
          {
            firstName: 'Ananya',
          },
        ),
      ).rejects.toThrow('Contact not found');

      expect(eventBus.emitEvent).not.toHaveBeenCalled();
    });
  });

  describe('deleteContact', () => {
    it('soft deletes the contact and emits an event', async () => {
      repositoryMock.softDelete.mockResolvedValue();

      await service.deleteContact('org-1', 'contact-1');

      expect(repositoryMock.softDelete).toHaveBeenCalledWith(
        'contact-1',
        'org-1',
        expect.any(Date),
      );

      expect(eventBus.emitEvent).toHaveBeenCalledWith(
        'ContactDeleted',
        {
          organizationId: 'org-1',
          contactId: 'contact-1',
        },
      );
    });

    it('does not emit an event when deletion fails', async () => {
      repositoryMock.softDelete.mockRejectedValue(
        new Error('Contact not found'),
      );

      await expect(
        service.deleteContact('org-1', 'contact-1'),
      ).rejects.toThrow('Contact not found');

      expect(eventBus.emitEvent).not.toHaveBeenCalled();
    });
  });
});