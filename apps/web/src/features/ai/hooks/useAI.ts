import { useMutation } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export const useTaskSummary = () => {
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await api.get<{ data: string }>(`/ai/tasks/${taskId}/summary`);
      return data.data;
    }
  });
};

interface AssistantParams {
  query: string;
  contextType: 'GLOBAL' | 'TASK' | 'PROJECT' | 'CRM';
  entityId?: string;
}

export const useAssistant = () => {
  return useMutation({
    mutationFn: async (params: AssistantParams) => {
      const { data } = await api.post<{ data: string }>('/ai/assistant/ask', params);
      return data.data;
    }
  });
};
