import { eventBus } from '../../../../core/events/EventBus';
import { OpportunityRepository } from '../opportunity.repository';
import { OpportunityService } from '../opportunity.service';

jest.mock('../opportunity.repository');
jest.mock('../../../../core/events/EventBus', () => ({
  eventBus: {
    emitEvent: jest.fn(),
  },
}));

describe('OpportunityService', () => {
  let service: OpportunityService;
  let repositoryMock: jest.Mocked<OpportunityRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new OpportunityService();
    repositoryMock = (service as any)
      .repository as jest.Mocked<OpportunityRepository>;

    repositoryMock.create = jest.fn();
    repositoryMock.findById = jest.fn();
    repositoryMock.findMany = jest.fn();
    repositoryMock.update = jest.fn();
    repositoryMock.softDelete = jest.fn();
  });

  describe('createOpportunity', () => {
    it('creates an opportunity, emits an event, and returns it', async () => {
      const mockOpportunity = {
        id: 'opportunity-1',
        expectedRevenue: 10000,
      };

      repositoryMock.create.mockResolvedValue(
        mockOpportunity as any,
      );

      const result = await service.createOpportunity(
        'org-1',
        {
          leadId: 'lead-1',
          stageId: 'stage-1',
          expectedRevenue: 10000,
        },
      );

      expect(repositoryMock.create).toHaveBeenCalledWith({
        organizationId: 'org-1',
        leadId: 'lead-1',
        stageId: 'stage-1',
        expectedRevenue: 10000,
        closeDate: undefined,
        probability: undefined,
      });

      expect(eventBus.emitEvent).toHaveBeenCalledWith(
        'OpportunityCreated',
        {
          organizationId: 'org-1',
          opportunityId: 'opportunity-1',
        },
      );

      expect(result).toEqual(mockOpportunity);
    });
  });

  describe('updateOpportunity', () => {
    it('updates the opportunity and converts closeDate', async () => {
      const closeDate = '2026-12-31T00:00:00.000Z';

      const updatedOpportunity = {
        id: 'opportunity-1',
        expectedRevenue: 20000,
      };

      repositoryMock.update.mockResolvedValue(
        updatedOpportunity as any,
      );

      const result = await service.updateOpportunity(
        'org-1',
        'opportunity-1',
        {
          expectedRevenue: 20000,
          closeDate,
        },
      );

      expect(repositoryMock.update).toHaveBeenCalledWith(
        'opportunity-1',
        'org-1',
        {
          leadId: undefined,
          stageId: undefined,
          expectedRevenue: 20000,
          closeDate: new Date(closeDate),
          probability: undefined,
        },
      );

      expect(eventBus.emitEvent).toHaveBeenCalledWith(
        'OpportunityUpdated',
        {
          organizationId: 'org-1',
          opportunityId: 'opportunity-1',
        },
      );

      expect(result).toEqual(updatedOpportunity);
    });

    it('does not emit an event when the update fails', async () => {
      repositoryMock.update.mockRejectedValue(
        new Error('Opportunity not found'),
      );

      await expect(
        service.updateOpportunity(
          'org-1',
          'opportunity-1',
          {
            expectedRevenue: 20000,
          },
        ),
      ).rejects.toThrow('Opportunity not found');

      expect(eventBus.emitEvent).not.toHaveBeenCalled();
    });
  });

  describe('deleteOpportunity', () => {
    it('soft deletes the opportunity and emits an event', async () => {
      repositoryMock.softDelete.mockResolvedValue();

      await service.deleteOpportunity(
        'org-1',
        'opportunity-1',
      );

      expect(repositoryMock.softDelete).toHaveBeenCalledWith(
        'opportunity-1',
        'org-1',
        expect.any(Date),
      );

      expect(eventBus.emitEvent).toHaveBeenCalledWith(
        'OpportunityDeleted',
        {
          organizationId: 'org-1',
          opportunityId: 'opportunity-1',
        },
      );
    });

    it('does not emit an event when soft deletion fails', async () => {
      repositoryMock.softDelete.mockRejectedValue(
        new Error('Opportunity not found'),
      );

      await expect(
        service.deleteOpportunity(
          'org-1',
          'opportunity-1',
        ),
      ).rejects.toThrow('Opportunity not found');

      expect(eventBus.emitEvent).not.toHaveBeenCalled();
    });
  });
});