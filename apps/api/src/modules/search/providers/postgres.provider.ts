import { PrismaClient } from '@prisma/client';
import { SearchProvider, SearchQuery, SearchResult, SearchResultItem } from './search-provider.interface';

const prisma = new PrismaClient();

export class PostgresSearchProvider implements SearchProvider {
  readonly name = 'postgres';

  async search(query: SearchQuery): Promise<SearchResult> {
    const { organizationId, term, limit = 20, offset = 0, modules } = query;
    const items: SearchResultItem[] = [];
    
    // Safety check - we refuse to query without organizationId
    if (!organizationId) throw new Error('Search requires tenant isolation');
    
    // For local dev simulation, we query relevant models concurrently
    // In production, this would use raw SQL `to_tsvector` against an indexed materialized view
    const promises = [];

    const shouldSearch = (moduleName: string) => !modules || modules.includes(moduleName);

    if (shouldSearch('projects')) {
      promises.push(
        prisma.project.findMany({
          where: {
            organizationId,
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } }
            ]
          },
          take: limit,
        }).then(res => res.map(p => ({
          id: p.id,
          module: 'projects',
          title: p.name,
          description: p.description?.substring(0, 100) || '',
          url: `/projects`,
          score: p.name.toLowerCase().includes(term.toLowerCase()) ? 1.0 : 0.5
        })))
      );
    }

    if (shouldSearch('tasks')) {
      promises.push(
        prisma.task.findMany({
          where: {
            organizationId,
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } }
            ]
          },
          take: limit,
        }).then(res => res.map(t => ({
          id: t.id,
          module: 'tasks',
          title: t.title,
          description: t.description?.substring(0, 100) || '',
          url: `/tasks`,
          score: t.title.toLowerCase().includes(term.toLowerCase()) ? 1.0 : 0.5
        })))
      );
    }

    if (shouldSearch('crm')) {
      promises.push(
        prisma.client.findMany({
          where: {
            organizationId,
            name: { contains: term, mode: 'insensitive' }
          },
          take: limit,
        }).then(res => res.map(c => ({
          id: c.id,
          module: 'crm',
          title: c.name,
          description: `Client in ${c.industry || 'Unknown Industry'}`,
          url: `/crm/clients/${c.id}`,
          score: 1.0
        })))
      );
      
      promises.push(
        prisma.lead.findMany({
          where: {
            organizationId,
            title: { contains: term, mode: 'insensitive' }
          },
          take: limit,
        }).then(res => res.map(l => ({
          id: l.id,
          module: 'crm',
          title: l.title,
          description: `Lead (Status: ${l.status})`,
          url: `/crm/leads`,
          score: 1.0
        })))
      );
    }

    const resultsArray = await Promise.all(promises);
    resultsArray.forEach(arr => items.push(...arr));

    // Sort by pseudo-score and truncate to limit
    const sortedItems = items.sort((a, b) => b.score - a.score).slice(offset, offset + limit);

    return {
      total: items.length,
      items: sortedItems
    };
  }
}
