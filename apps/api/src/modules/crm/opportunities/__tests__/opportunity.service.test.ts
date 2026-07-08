import { OpportunityService } from '../opportunity.service';
import { OpportunityRepository } from '../opportunity.repository';
import { eventBus } from '../../../../core/events/EventBus';

// Mock dependencies
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
    repositoryMock = (service as any).repository as jest.Mocked<OpportunityRepository>;

    repositoryMock.create = jest.fn();
    repositoryMock.findById = jest.fn();
    repositoryMock.findMany = jest.fn();
    repositoryMock.update = jest.fn();
  });

  describe('createOpportunity', () => {
    it('should create an opportunity, emit an event, and return it', async () => {
      const mockOpp = { id: 'opp-1', expectedRevenue: 10000 };
      repositoryMock.create.mockResolvedValue(mockOpp as any);

      const result = await service.createOpportunity('org-1', {
        leadId: 'lead-1',
        stageId: 'stage-1',
        expectedRevenue: 10000,
      });

      expect(repositoryMock.create).toHaveBeenCalledWith({
        organizationId: 'org-1',
        leadId: 'lead-1',
        stageId: 'stage-1',
        expectedRevenue: 10000,
        closeDate: undefined,
        probability: undefined,
      });
      expect(eventBus.emitEvent).toHaveBeenCalledWith('OpportunityCreated', {
        organizationId: 'org-1',
        opportunityId: 'opp-1',
      });
      expect(result).toEqual(mockOpp);
    });
  });

  describe('updateOpportunity', () => {
    it('should throw an error if opportunity does not exist', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(service.updateOpportunity('org-1', 'invalid-id', { expectedRevenue: 20000 })).rejects.toThrow('Opportunity not found');
    });

    it('should update the opportunity and format closeDate if provided', async () => {
      repositoryMock.findById.mockResolvedValue({ id: 'opp-1' } as any);
      repositoryMock.update.mockResolvedValue({ id: 'opp-1', expectedRevenue: 20000 } as any);

      const dateStr = '2026-12-31T00:00:00.000Z';
      const result = await service.updateOpportunity('org-1', 'opp-1', {
        expectedRevenue: 20000,
        closeDate: dateStr,
      });

      expect(repositoryMock.update).toHaveBeenCalledWith('opp-1', 'org-1', {
        expectedRevenue: 20000,
        closeDate: new Date(dateStr),
      });
      expect(eventBus.emitEvent).toHaveBeenCalledWith('OpportunityUpdated', {
        organizationId: 'org-1',
        opportunityId: 'opp-1',
      });
      expect(result).toEqual({ id: 'opp-1', expectedRevenue: 20000 });
    });
  });
});
