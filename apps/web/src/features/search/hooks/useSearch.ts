import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface SearchResultItem {
  id: string;
  module: string;
  title: string;
  description?: string;
  url: string;
  score: number;
}

export interface SearchResult {
  total: number;
  items: SearchResultItem[];
}

export const useGlobalSearch = (term: string, modules?: string[], limit: number = 20) => {
  return useQuery({
    queryKey: ['search', term, modules, limit],
    queryFn: async () => {
      if (!term || term.trim().length < 2) return { total: 0, items: [] } as SearchResult;
      
      const queryParams = new URLSearchParams({
        q: term,
        limit: limit.toString(),
      });
      
      if (modules && modules.length > 0) {
        queryParams.append('modules', modules.join(','));
      }

      const { data } = await api.get<{ data: SearchResult }>(`/search?${queryParams.toString()}`);
      return data.data;
    },
    enabled: term.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes to prevent spamming
  });
};
