import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface MetricFilter {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  teamId?: string;
  userId?: string;
}

export const useReport = (reportType: string, filters: MetricFilter) => {
  return useQuery({
    queryKey: ['analytics', 'report', reportType, filters],
    queryFn: async () => {
      const { data } = await api.get<{ data: any }>(`/analytics/reports/${reportType}`, {
        params: filters,
      });
      return data.data;
    },
  });
};

export const useMetric = (metricName: string, filters: MetricFilter) => {
  return useQuery({
    queryKey: ['analytics', 'metric', metricName, filters],
    queryFn: async () => {
      const { data } = await api.get<{ data: any }>(`/analytics/metrics/${metricName}`, {
        params: filters,
      });
      return data.data;
    },
  });
};
