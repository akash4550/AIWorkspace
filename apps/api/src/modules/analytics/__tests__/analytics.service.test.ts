import { AnalyticsRepository } from '../analytics.repository';
import { AnalyticsService } from '../analytics.service';
import { KPIEngine } from '../kpi.engine';

jest.mock('../analytics.repository');

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let repositoryMock: jest.Mocked<AnalyticsRepository>;
  let kpiEngineMock: jest.Mocked<KPIEngine>;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AnalyticsService();

    repositoryMock = (service as any)
      .repository as jest.Mocked<AnalyticsRepository>;

    kpiEngineMock = (service as any)
      .kpiEngine as jest.Mocked<KPIEngine>;

    repositoryMock.assertFilterScope = jest.fn();
    kpiEngineMock.calculateMetric = jest.fn();
  });

  describe('getMetric', () => {
    it('validates filter scope before calculating the metric', async () => {
      const filters = {
        projectId: 'project-1',
      };

      const metricResult = {
        name: 'Tasks Created',
        type: 'scalar',
        value: 12,
      };

      repositoryMock.assertFilterScope.mockResolvedValue();
      kpiEngineMock.calculateMetric.mockResolvedValue(
        metricResult as any,
      );

      const result = await service.getMetric(
        'org-1',
        'tasks_created',
        filters,
      );

      expect(
        repositoryMock.assertFilterScope,
      ).toHaveBeenCalledWith(
        'org-1',
        filters,
      );

      expect(
        kpiEngineMock.calculateMetric,
      ).toHaveBeenCalledWith(
        'TASKS_CREATED',
        'org-1',
        filters,
      );

      expect(
        repositoryMock.assertFilterScope.mock
          .invocationCallOrder[0],
      ).toBeLessThan(
        kpiEngineMock.calculateMetric.mock
          .invocationCallOrder[0],
      );

      expect(result).toEqual(metricResult);
    });

    it('does not calculate a metric when filter scope validation fails', async () => {
      repositoryMock.assertFilterScope.mockRejectedValue(
        new Error(
          'One or more analytics filters were not found',
        ),
      );

      await expect(
        service.getMetric(
          'org-1',
          'ACTIVE_USERS',
          {
            userId: 'other-tenant-user',
          },
        ),
      ).rejects.toThrow(
        'One or more analytics filters were not found',
      );

      expect(
        kpiEngineMock.calculateMetric,
      ).not.toHaveBeenCalled();
    });
  });

  describe('getReport', () => {
    it('validates filter scope before calculating report metrics', async () => {
      const filters = {
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-20T00:00:00.000Z',
      };

      repositoryMock.assertFilterScope.mockResolvedValue();

      kpiEngineMock.calculateMetric.mockImplementation(
        async (metricName) => ({
          name: metricName,
          type: 'scalar',
          value: 1,
        } as any),
      );

      const result = await service.getReport(
        'org-1',
        'crm_overview',
        filters,
      );

      expect(
        repositoryMock.assertFilterScope,
      ).toHaveBeenCalledWith(
        'org-1',
        filters,
      );

      expect(
        kpiEngineMock.calculateMetric,
      ).toHaveBeenCalledTimes(3);

      expect(
        kpiEngineMock.calculateMetric,
      ).toHaveBeenNthCalledWith(
        1,
        'LEADS_CREATED',
        'org-1',
        filters,
      );

      expect(
        kpiEngineMock.calculateMetric,
      ).toHaveBeenNthCalledWith(
        2,
        'PIPELINE_VALUE',
        'org-1',
        filters,
      );

      expect(
        kpiEngineMock.calculateMetric,
      ).toHaveBeenNthCalledWith(
        3,
        'WIN_RATE',
        'org-1',
        filters,
      );

      expect(result).toEqual(
        expect.objectContaining({
          type: 'CRM_OVERVIEW',
          title: 'CRM Overview',
          filters,
          generatedAt: expect.any(Date),
          results: expect.arrayContaining([
            expect.objectContaining({
              name: 'LEADS_CREATED',
              value: 1,
            }),
            expect.objectContaining({
              name: 'PIPELINE_VALUE',
              value: 1,
            }),
            expect.objectContaining({
              name: 'WIN_RATE',
              value: 1,
            }),
          ]),
        }),
      );
    });

    it('does not calculate report metrics when filter scope validation fails', async () => {
      repositoryMock.assertFilterScope.mockRejectedValue(
        new Error(
          'One or more analytics filters were not found',
        ),
      );

      await expect(
        service.getReport(
          'org-1',
          'PROJECT_HEALTH',
          {
            projectId: 'other-tenant-project',
          },
        ),
      ).rejects.toThrow(
        'One or more analytics filters were not found',
      );

      expect(
        kpiEngineMock.calculateMetric,
      ).not.toHaveBeenCalled();
    });

    it('isolates individual metric failures inside a report', async () => {
      repositoryMock.assertFilterScope.mockResolvedValue();

      kpiEngineMock.calculateMetric
        .mockResolvedValueOnce({
          name: 'Leads Created',
          type: 'scalar',
          value: 5,
        } as any)
        .mockRejectedValueOnce(
          new Error('Pipeline calculation failed'),
        )
        .mockResolvedValueOnce({
          name: 'Win Rate',
          type: 'scalar',
          value: 40,
        } as any);

      const result = await service.getReport(
        'org-1',
        'CRM_OVERVIEW',
        {},
      );

      expect(result.results).toEqual([
        expect.objectContaining({
          name: 'Leads Created',
          value: 5,
        }),
        {
          name: 'PIPELINE_VALUE',
          type: 'scalar',
          value: null,
          error: 'Pipeline calculation failed',
        },
        expect.objectContaining({
          name: 'Win Rate',
          value: 40,
        }),
      ]);
    });
  });
});