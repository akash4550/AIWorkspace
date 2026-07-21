import { eventBus } from '../../../../core/events/EventBus';
import { LeadRepository } from '../lead.repository';
import { LeadService } from '../lead.service';

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
    repositoryMock.softDelete = jest.fn();
  });

  describe('createLead', () => {
    it('creates a lead, emits an event, and returns the lead', async () => {
      const mockLead = {
        id: 'lead-1',
        title: 'New Lead',
      };

      repositoryMock.create.mockResolvedValue(mockLead as any);

      const result = await service.createLead(
        'org-1',
        'user-1',
        {
          title: 'New Lead',
          score: 50,
        },
      );

      expect(repositoryMock.create).toHaveBeenCalledWith({
        organizationId: 'org-1',
        title: 'New Lead',
        source: undefined,
        score: 50,
        assignedTo: undefined,
        expectedValue: undefined,
      });

      expect(eventBus.emitEvent).toHaveBeenCalledWith(
        'LeadCreated',
        {
          organizationId: 'org-1',
          leadId: 'lead-1',
        },
      );

      expect(result).toEqual(mockLead);
    });
  });

  describe('deleteLead', () => {
    it('soft deletes the lead and emits an event', async () => {
      repositoryMock.softDelete.mockResolvedValue();

      await service.deleteLead('org-1', 'lead-1');

      expect(repositoryMock.softDelete).toHaveBeenCalledWith(
        'lead-1',
        'org-1',
        expect.any(Date),
      );

      expect(eventBus.emitEvent).toHaveBeenCalledWith(
        'LeadDeleted',
        {
          organizationId: 'org-1',
          leadId: 'lead-1',
        },
      );
    });

    it('does not emit an event when soft deletion fails', async () => {
      repositoryMock.softDelete.mockRejectedValue(
        new Error('Lead not found'),
      );

      await expect(
        service.deleteLead('org-1', 'lead-1'),
      ).rejects.toThrow('Lead not found');

      expect(eventBus.emitEvent).not.toHaveBeenCalled();
    });
  });
});