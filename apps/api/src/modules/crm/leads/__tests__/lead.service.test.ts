import { LeadService } from '../lead.service';
import { LeadRepository } from '../lead.repository';
import { eventBus } from '../../../../core/events/EventBus';

jest.mock('../lead.repository');
jest.mock('../../../../core/events/EventBus', () => ({
  eventBus: {
    emitEvent: jest.fn(),
  },
}));

describe('LeadService', () => {
  let service: LeadService;
  let repositoryMock: jest.Mocked<LeadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LeadService();
    repositoryMock = (service as any).repository as jest.Mocked<LeadRepository>;

    repositoryMock.create = jest.fn();
    repositoryMock.findById = jest.fn();
    repositoryMock.findMany = jest.fn();
    repositoryMock.update = jest.fn();
  });

  describe('createLead', () => {
    it('should create a lead, emit an event, and return it', async () => {
      const mockLead = { id: 'lead-1', title: 'New Lead' };
      repositoryMock.create.mockResolvedValue(mockLead as any);

      const result = await service.createLead('org-1', 'user-1', {
        title: 'New Lead',
        score: 50,
      });

      expect(repositoryMock.create).toHaveBeenCalledWith({
        organizationId: 'org-1',
        title: 'New Lead',
        source: undefined,
        score: 50,
        assignedTo: undefined,
        expectedValue: undefined,
      });
      expect(eventBus.emitEvent).toHaveBeenCalledWith('LeadCreated', {
        organizationId: 'org-1',
        leadId: 'lead-1',
      });
      expect(result).toEqual(mockLead);
    });
  });

  describe('deleteLead', () => {
    it('should throw an error if lead does not exist', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(service.deleteLead('org-1', 'invalid-id')).rejects.toThrow('Lead not found');
    });

    it('should soft delete the lead and emit an event', async () => {
      repositoryMock.findById.mockResolvedValue({ id: 'lead-1' } as any);
      repositoryMock.update.mockResolvedValue({ id: 'lead-1' } as any);

      const result = await service.deleteLead('org-1', 'lead-1');

      expect(repositoryMock.update).toHaveBeenCalledWith(
        'lead-1',
        'org-1',
        expect.objectContaining({ deletedAt: expect.any(Date) })
      );
      expect(eventBus.emitEvent).toHaveBeenCalledWith('LeadDeleted', {
        organizationId: 'org-1',
        leadId: 'lead-1',
      });
      expect(result).toBe(true);
    });
  });
});
