export interface SearchQuery {
  organizationId: string;
  userId: string;
  term: string;
  modules?: string[]; // e.g. ['projects', 'tasks', 'crm']
  limit?: number;
  offset?: number;
}

export interface SearchResultItem {
  id: string;
  module: string;
  title: string;
  description?: string;
  url: string;
  score: number;
  metadata?: any;
}

export interface SearchResult {
  total: number;
  items: SearchResultItem[];
}

export interface SearchProvider {
  /**
   * Identifies the provider (e.g., 'postgres', 'elasticsearch')
   */
  readonly name: string;

  /**
   * Executes a global search query across indexed modules.
   */
  search(query: SearchQuery): Promise<SearchResult>;
}
