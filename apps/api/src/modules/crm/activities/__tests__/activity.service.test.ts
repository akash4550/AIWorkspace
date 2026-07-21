import { CRMActivityType } from '@prisma/client';

import { eventBus } from '../../../../core/events/EventBus';
import { CRMActivityRepository } from '../activity.repository';
import { CRMActivityService } from '../activity.service';

jest.mock('../activity.repository');

jest.mock('../../../../core/events/EventBus', () => ({
  eventBus: {
    emitEvent: jest.fn(),
  },
}));

describe('CRMActivityService', () => {
  let service: CRMActivityService;
  let repositoryMock: jest.Mocked<CRMActivityRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new CRMActivityService();

    repositoryMock = (service as any)
      .repository as jest.Mocked<CRMActivityRepository>;

    repositoryMock.create = jest.fn();
    repositoryMock.findMany = jest.fn();
  });

  describe('createActivity', () => {
    it('creates an activity, emits an event, and returns it', async () => {
      const mockActivity = {
        id: 'activity-1',
        organizationId: 'org-1',
        createdById: 'user-1',
        type: CRMActivityType.NOTE,
        description: 'Follow-up note',
        clientId: 'client-1',
        leadId: null,
        opportunityId: null,
      };

      repositoryMock.create.mockResolvedValue(
        mockActivity as any,
      );

      const result = await service.createActivity(
        'org-1',
        'user-1',
        {
          type: CRMActivityType.NOTE,
          content: 'Follow-up note',
          clientId: 'client-1',
        },
      );

      expect(repositoryMock.create).toHaveBeenCalledWith({
        organizationId: 'org-1',
        createdById: 'user-1',
        type: CRMActivityType.NOTE,
        description: 'Follow-up note',
        clientId: 'client-1',
        leadId: undefined,
        opportunityId: undefined,
      });

      expect(eventBus.emitEvent).toHaveBeenCalledWith(
        'CRMActivityLogged',
        {
          organizationId: 'org-1',
          activityId: 'activity-1',
        },
      );

      expect(result).toEqual(mockActivity);
    });

    it('does not emit an event when persistence fails', async () => {
      repositoryMock.create.mockRejectedValue(
        new Error('Invalid activity client'),
      );

      await expect(
        service.createActivity(
          'org-1',
          'user-1',
          {
            type: CRMActivityType.NOTE,
            content: 'Follow-up note',
            clientId: 'client-1',
          },
        ),
      ).rejects.toThrow('Invalid activity client');

      expect(eventBus.emitEvent).not.toHaveBeenCalled();
    });

    it('passes all linked CRM entities to the repository', async () => {
      repositoryMock.create.mockResolvedValue({
        id: 'activity-1',
      } as any);

      await service.createActivity(
        'org-1',
        'user-1',
        {
          type: CRMActivityType.MEETING,
          content: 'Deal review meeting',
          clientId: 'client-1',
          leadId: 'lead-1',
          opportunityId: 'opportunity-1',
        },
      );

      expect(repositoryMock.create).toHaveBeenCalledWith({
        organizationId: 'org-1',
        createdById: 'user-1',
        type: CRMActivityType.MEETING,
        description: 'Deal review meeting',
        clientId: 'client-1',
        leadId: 'lead-1',
        opportunityId: 'opportunity-1',
      });
    });
  });

  describe('getActivities', () => {
    it('delegates tenant-scoped filters to the repository', async () => {
      const repositoryResult = {
        data: [],
        total: 0,
      };

      repositoryMock.findMany.mockResolvedValue(
        repositoryResult,
      );

      const query = {
        page: 2,
        limit: 25,
        clientId: 'client-1',
        leadId: 'lead-1',
        opportunityId: 'opportunity-1',
      };

      const result = await service.getActivities(
        'org-1',
        query,
      );

      expect(repositoryMock.findMany).toHaveBeenCalledWith(
        'org-1',
        query,
      );

      expect(result).toEqual(repositoryResult);
    });
  });
});