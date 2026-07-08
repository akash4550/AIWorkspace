import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface QueueStatus {
  name: string;
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
}

export interface FailedJob {
  id: string;
  name: string;
  data: any;
  failedReason: string;
  stacktrace: string[];
  timestamp: number;
}

export const useQueueStatus = () => {
  return useQuery({
    queryKey: ['jobs', 'status'],
    queryFn: async () => {
      const { data } = await api.get<{ data: QueueStatus[] }>('/jobs/status');
      return data.data;
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });
};

export const useFailedJobs = (queueName: string) => {
  return useQuery({
    queryKey: ['jobs', 'failed', queueName],
    queryFn: async () => {
      const { data } = await api.get<{ data: FailedJob[] }>(`/jobs/failed/${queueName}`);
      return data.data;
    },
    enabled: !!queueName,
  });
};

export const useRetryJobs = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (queueName: string) => {
      const { data } = await api.post('/jobs/retry', { queueName });
      return data;
    },
    onSuccess: (_, queueName) => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'failed', queueName] });
    },
  });
};
