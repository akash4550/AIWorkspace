import { ClientService } from '../client.service';
import { ClientRepository } from '../client.repository';
import { eventBus } from '../../../../core/events/EventBus';

// Mock dependencies
jest.mock('../client.repository');
jest.mock('../../../../core/events/EventBus', () => ({
  eventBus: {
    emitEvent: jest.fn(),
  },
}));

describe('ClientService', () => {
  let service: ClientService;
  let repositoryMock: jest.Mocked<ClientRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ClientService();
    // In TypeScript, we can access the private repository property for testing purposes,
    // or we could use prototype mocking. The constructor creates a new ClientRepository,
    // so we can mock its prototype before creating the service or intercept it.
    // Given the structure, we can mock the class methods.
    repositoryMock = (service as any).repository as jest.Mocked<ClientRepository>;
    
    // Setup basic mock implementations
    repositoryMock.create = jest.fn();
    repositoryMock.findById = jest.fn();
    repositoryMock.findMany = jest.fn();
    repositoryMock.update = jest.fn();
    repositoryMock.softDelete = jest.fn();
  });

  describe('createClient', () => {
    it('should create a client, emit an event, and return the client', async () => {
      const mockClient = { id: 'client-1', name: 'Acme Corp', organizationId: 'org-1' };
      repositoryMock.create.mockResolvedValue(mockClient as any);

      const result = await service.createClient('org-1', 'user-1', { name: 'Acme Corp' });

      expect(repositoryMock.create).toHaveBeenCalledWith({
        organizationId: 'org-1',
        ownerId: 'user-1',
        name: 'Acme Corp',
        industry: undefined,
        website: undefined,
        phone: undefined,
        email: undefined,
        address: undefined,
      });
      expect(eventBus.emitEvent).toHaveBeenCalledWith('ClientCreated', {
        organizationId: 'org-1',
        clientId: 'client-1',
      });
      expect(result).toEqual(mockClient);
    });

    it('should use ownerId from dto if provided', async () => {
      repositoryMock.create.mockResolvedValue({ id: 'client-2' } as any);

      await service.createClient('org-1', 'user-1', { name: 'Globex', ownerId: 'user-2' });

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'user-2',
        })
      );
    });
  });

  describe('getClient', () => {
    it('should throw an error if client is not found', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(service.getClient('org-1', 'invalid-id')).rejects.toThrow('Client not found');
      expect(repositoryMock.findById).toHaveBeenCalledWith('org-1', 'invalid-id');
    });

    it('should return the client if found', async () => {
      const mockClient = { id: 'client-1', name: 'Acme Corp' };
      repositoryMock.findById.mockResolvedValue(mockClient as any);

      const result = await service.getClient('org-1', 'client-1');
      expect(result).toEqual(mockClient);
    });
  });

  describe('updateClient', () => {
    it('should throw an error if client does not exist', async () => {
      repositoryMock.update.mockRejectedValue(new Error('Client not found'));

      await expect(service.updateClient('org-1', 'invalid-id', { name: 'New Name' })).rejects.toThrow('Client not found');
    });

    it('should update the client and emit an event', async () => {
      repositoryMock.update.mockResolvedValue({ id: 'client-1', name: 'New Name' } as any);

      const result = await service.updateClient('org-1', 'client-1', { name: 'New Name' });

      expect(repositoryMock.update).toHaveBeenCalledWith('client-1', 'org-1', { name: 'New Name' });
      expect(eventBus.emitEvent).toHaveBeenCalledWith('ClientUpdated', {
        organizationId: 'org-1',
        clientId: 'client-1',
      });
      expect(result).toEqual({ id: 'client-1', name: 'New Name' });
    });
  });

  describe('deleteClient', () => {
    it('should throw an error if client does not exist', async () => {
      repositoryMock.softDelete.mockRejectedValue(new Error('Client not found'));

      await expect(service.deleteClient('org-1', 'invalid-id')).rejects.toThrow('Client not found');
    });

    it('should soft delete the client and emit an event', async () => {
      repositoryMock.softDelete.mockResolvedValue(undefined);

      const result = await service.deleteClient('org-1', 'client-1');

      expect(repositoryMock.softDelete).toHaveBeenCalledWith(
        'client-1',
        'org-1',
        expect.any(Date),
      );
      expect(eventBus.emitEvent).toHaveBeenCalledWith('ClientDeleted', {
        organizationId: 'org-1',
        clientId: 'client-1',
      });
      expect(result).toBe(true);
    });
  });
});
