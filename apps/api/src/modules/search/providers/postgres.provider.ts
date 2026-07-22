import { PERMISSIONS } from '../../../core/auth/permissions';
import { ROLE_PERMISSIONS } from '../../../core/auth/rolePermissions';
import { prisma } from '../../../config/prisma';
import {
  SearchModule,
  SearchProvider,
  SearchQuery,
  SearchResult,
  SearchResultItem,
} from './search-provider.interface';

const ALL_SEARCH_MODULES: SearchModule[] = [
  'projects',
  'tasks',
  'crm',
];

export class PostgresSearchProvider
  implements SearchProvider {
  readonly name = 'postgres';

  async search(
    query: SearchQuery,
  ): Promise<SearchResult> {
    const {
      organizationId,
      role,
      term,
      modules,
      limit,
      offset,
    } = query;

    if (!organizationId) {
      throw new Error(
        'Search requires tenant isolation',
      );
    }

    const permissions = ROLE_PERMISSIONS[role];

    const allowedModules =
      ALL_SEARCH_MODULES.filter((module) => {
        switch (module) {
          case 'projects':
            return permissions.includes(
              PERMISSIONS.PROJECT.READ,
            );

          case 'tasks':
            return permissions.includes(
              PERMISSIONS.TASK.READ,
            );

          case 'crm':
            return permissions.includes(
              PERMISSIONS.CRM.READ,
            );
        }
      });

    const requestedModules =
      modules ?? allowedModules;

    const searchableModules =
      requestedModules.filter((module) =>
        allowedModules.includes(module),
      );

    const shouldSearch = (
      moduleName: SearchModule,
    ): boolean =>
      searchableModules.includes(moduleName);

    const queryLimit = offset + limit;

    const searches: Promise<
      SearchResultItem[]
    >[] = [];

    if (shouldSearch('projects')) {
      searches.push(
        prisma.project
          .findMany({
            where: {
              organizationId,
              deletedAt: null,
              OR: [
                {
                  name: {
                    contains: term,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: term,
                    mode: 'insensitive',
                  },
                },
              ],
            },
            take: queryLimit,
          })
          .then((projects) =>
            projects.map(
              (project): SearchResultItem => ({
                id: project.id,
                module: 'projects',
                title: project.name,
                description:
                  project.description?.substring(
                    0,
                    100,
                  ) ?? '',
                url: `/projects`,
                score: project.name
                  .toLowerCase()
                  .includes(term.toLowerCase())
                  ? 1
                  : 0.5,
              }),
            ),
          ),
      );
    }

    if (shouldSearch('tasks')) {
      searches.push(
        prisma.task
          .findMany({
            where: {
              organizationId,
              deletedAt: null,
              OR: [
                {
                  title: {
                    contains: term,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: term,
                    mode: 'insensitive',
                  },
                },
              ],
            },
            take: queryLimit,
          })
          .then((tasks) =>
            tasks.map(
              (task): SearchResultItem => ({
                id: task.id,
                module: 'tasks',
                title: task.title,
                description:
                  task.description?.substring(
                    0,
                    100,
                  ) ?? '',
                url: `/tasks`,
                score: task.title
                  .toLowerCase()
                  .includes(term.toLowerCase())
                  ? 1
                  : 0.5,
              }),
            ),
          ),
      );
    }

    if (shouldSearch('crm')) {
      searches.push(
        prisma.client
          .findMany({
            where: {
              organizationId,
              deletedAt: null,
              name: {
                contains: term,
                mode: 'insensitive',
              },
            },
            take: queryLimit,
          })
          .then((clients) =>
            clients.map(
              (client): SearchResultItem => ({
                id: client.id,
                module: 'crm',
                title: client.name,
                description:
                  `Client in ${
                    client.industry ??
                    'Unknown Industry'
                  }`,
                url: `/crm/clients/${client.id}`,
                score: 1,
              }),
            ),
          ),
      );

      searches.push(
        prisma.lead
          .findMany({
            where: {
              organizationId,
              deletedAt: null,
              title: {
                contains: term,
                mode: 'insensitive',
              },
            },
            take: queryLimit,
          })
          .then((leads) =>
            leads.map(
              (lead): SearchResultItem => ({
                id: lead.id,
                module: 'crm',
                title: lead.title,
                description:
                  `Lead (Status: ${lead.status})`,
                url: `/crm/leads`,
                score: 1,
              }),
            ),
          ),
      );
    }

    const resultGroups =
      await Promise.all(searches);

    const items = resultGroups.flat();

    const sortedItems = items
      .sort(
        (left, right) =>
          right.score - left.score,
      )
      .slice(offset, offset + limit);

    return {
      total: items.length,
      items: sortedItems,
    };
  }
}