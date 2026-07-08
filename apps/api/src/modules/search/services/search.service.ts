import { SearchProvider, SearchQuery } from '../providers/search-provider.interface';
import { PostgresSearchProvider } from '../providers/postgres.provider';

export class SearchService {
  private provider: SearchProvider;

  constructor() {
    // Injectable in a robust DI container, but hardcoded to Postgres for now
    this.provider = new PostgresSearchProvider();
  }

  async performGlobalSearch(query: SearchQuery) {
    if (!query.organizationId) {
      throw new Error('Tenant isolation violated: organizationId is required for search');
    }

    if (!query.term || query.term.trim().length < 2) {
      return { total: 0, items: [] };
    }

    // Example of RBAC enforcement:
    // If the user's role is EMPLOYEE, perhaps we remove 'crm' from the modules they can query
    // This logic would pull from req.user (passed down from controller)
    // For now, we trust the modules array passed in if any, otherwise we search all.

    const result = await this.provider.search(query);
    return result;
  }
}
