import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

// Types for responses based on standard DTOs
export interface Client {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  title: string;
  value: number;
  status: 'OPEN' | 'WON' | 'LOST';
  pipelineStageId?: string;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CRMActivity {
  id: string;
  type: 'NOTE' | 'CALL' | 'MEETING' | 'EMAIL' | 'TASK';
  description: string;
  dueDate?: string;
  status: 'PENDING' | 'COMPLETED';
  entityId: string;
  entityType: 'CLIENT' | 'CONTACT' | 'LEAD' | 'OPPORTUNITY';
  createdAt: string;
  updatedAt: string;
}

export const useClients = () => {
  return useQuery({
    queryKey: ['crm', 'clients'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Client[] }>('/crm/clients');
      return data.data;
    },
  });
};

export const useOpportunities = () => {
  return useQuery({
    queryKey: ['crm', 'opportunities'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Opportunity[] }>('/crm/opportunities');
      return data.data;
    },
  });
};

export const useActivities = () => {
  return useQuery({
    queryKey: ['crm', 'activities'],
    queryFn: async () => {
      const { data } = await api.get<{ data: CRMActivity[] }>('/crm/activities');
      return data.data;
    },
  });
};
