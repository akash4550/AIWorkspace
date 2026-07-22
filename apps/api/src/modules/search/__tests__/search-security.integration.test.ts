import { randomUUID } from 'node:crypto';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';

import {
  Client,
  Lead,
  Project,
  Role,
  Task,
  User,
} from '@prisma/client';

import app from '../../../app';
import { prisma } from '../../../config/prisma';
import { getRedisClient } from '../../../core/redis/redis.client';
import { signAccessToken } from '../../../core/security/jwt';
import { allQueues } from '../../jobs/queues';

interface SearchResultItem {
  id: string;
  module: 'projects' | 'tasks' | 'crm';
  title: string;
  description?: string;
  url: string;
  score: number;
}

interface SearchResult {
  total: number;
  items: SearchResultItem[];
}

interface JsonResponse {
  data?: SearchResult;
  error?: {
    message?: string;
  };
}

interface TestResponse {
  status: number;
  body: JsonResponse | null;
}

let server: Server;
let baseUrl: string;

let primaryOrganizationId: string;
let otherOrganizationId: string;

let primaryAdmin: User;
let primaryEmployee: User;
let otherTenantAdmin: User;

let primaryProject: Project;
let primaryTask: Task;
let primaryClient: Client;
let primaryLead: Lead;

let deletedProject: Project;
let deletedTask: Task;
let deletedClient: Client;
let deletedLead: Lead;

let otherTenantProject: Project;
let otherTenantTask: Task;
let otherTenantClient: Client;
let otherTenantLead: Lead;

const SEARCH_TERM = 'SearchTarget';

const createUser = async (
  organizationId: string,
  role: Role,
  label: string,
): Promise<User> => {
  return prisma.user.create({
    data: {
      organizationId,
      firstName: label,
      lastName: 'User',
      email:
        `${label.toLowerCase()}-${randomUUID()}@example.com`,
      password: 'search-security-test-password-hash',
      role,
      emailVerified: true,
      isActive: true,
    },
  });
};

const createProject = async (
  organizationId: string,
  ownerId: string,
  label: string,
  deletedAt?: Date,
): Promise<Project> => {
  return prisma.project.create({
    data: {
      organizationId,
      ownerId,
      name: `${SEARCH_TERM} ${label}`,
      key:
        `SEARCH-${randomUUID()}`,
      description:
        `${SEARCH_TERM} project description`,
      status: 'ACTIVE',
      deletedAt,
    },
  });
};

const createTask = async (
  organizationId: string,
  projectId: string,
  reporterId: string,
  label: string,
  deletedAt?: Date,
): Promise<Task> => {
  return prisma.task.create({
    data: {
      organizationId,
      projectId,
      reporterId,
      title: `${SEARCH_TERM} ${label}`,
      description:
        `${SEARCH_TERM} task description`,
      position: 1,
      deletedAt,
    },
  });
};

const createClient = async (
  organizationId: string,
  ownerId: string,
  label: string,
  deletedAt?: Date,
): Promise<Client> => {
  return prisma.client.create({
    data: {
      organizationId,
      ownerId,
      name: `${SEARCH_TERM} ${label}`,
      industry: 'Software',
      deletedAt,
    },
  });
};

const createLead = async (
  organizationId: string,
  assignedTo: string,
  label: string,
  deletedAt?: Date,
): Promise<Lead> => {
  return prisma.lead.create({
    data: {
      organizationId,
      assignedTo,
      title: `${SEARCH_TERM} ${label}`,
      source: 'Integration Test',
      deletedAt,
    },
  });
};

const tokenFor = (user: User): string => {
  return signAccessToken({
    userId: user.id,
    organizationId: user.organizationId,
  });
};

const sendRequest = async (
  query: URLSearchParams | string,
  actor?: User,
): Promise<TestResponse> => {
  const headers: Record<string, string> = {};

  if (actor) {
    headers.Authorization =
      `Bearer ${tokenFor(actor)}`;
  }

  const queryString =
    typeof query === 'string'
      ? query
      : query.toString();

  const response = await fetch(
    `${baseUrl}/api/v1/search?${queryString}`,
    {
      method: 'GET',
      headers,
    },
  );

  const responseText = await response.text();

  return {
    status: response.status,
    body: responseText
      ? JSON.parse(responseText) as JsonResponse
      : null,
  };
};

const clearDatabase = async (): Promise<void> => {
  await prisma.cRMActivity.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.client.deleteMany();

  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();

  await prisma.teamInvitation.deleteMany();
  await prisma.teamMembership.deleteMany();
  await prisma.team.deleteMany();

  await prisma.activityLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
};

beforeAll(async () => {
  server = app.listen(0);

  await new Promise<void>((resolve) => {
    server.once('listening', resolve);
  });

  const address = server.address() as AddressInfo;

  baseUrl = `http://127.0.0.1:${address.port}`;
});

beforeEach(async () => {
  await clearDatabase();

  const primaryOrganization =
    await prisma.organization.create({
      data: {
        name: 'Search Security Primary Organization',
        slug:
          `search-security-primary-${randomUUID()}`,
      },
    });

  const otherOrganization =
    await prisma.organization.create({
      data: {
        name: 'Search Security Other Organization',
        slug:
          `search-security-other-${randomUUID()}`,
      },
    });

  primaryOrganizationId =
    primaryOrganization.id;

  otherOrganizationId =
    otherOrganization.id;

  [
    primaryAdmin,
    primaryEmployee,
    otherTenantAdmin,
  ] = await Promise.all([
    createUser(
      primaryOrganizationId,
      Role.ADMIN,
      'PrimaryAdmin',
    ),
    createUser(
      primaryOrganizationId,
      Role.EMPLOYEE,
      'PrimaryEmployee',
    ),
    createUser(
      otherOrganizationId,
      Role.ADMIN,
      'OtherTenantAdmin',
    ),
  ]);

  primaryProject = await createProject(
    primaryOrganizationId,
    primaryAdmin.id,
    'Primary Project',
  );

  deletedProject = await createProject(
    primaryOrganizationId,
    primaryAdmin.id,
    'Deleted Project',
    new Date(),
  );

  otherTenantProject = await createProject(
    otherOrganizationId,
    otherTenantAdmin.id,
    'Other Tenant Project',
  );

  [
    primaryTask,
    deletedTask,
    otherTenantTask,
  ] = await Promise.all([
    createTask(
      primaryOrganizationId,
      primaryProject.id,
      primaryAdmin.id,
      'Primary Task',
    ),
    createTask(
      primaryOrganizationId,
      deletedProject.id,
      primaryAdmin.id,
      'Deleted Task',
      new Date(),
    ),
    createTask(
      otherOrganizationId,
      otherTenantProject.id,
      otherTenantAdmin.id,
      'Other Tenant Task',
    ),
  ]);

  [
    primaryClient,
    deletedClient,
    otherTenantClient,
  ] = await Promise.all([
    createClient(
      primaryOrganizationId,
      primaryAdmin.id,
      'Primary Client',
    ),
    createClient(
      primaryOrganizationId,
      primaryAdmin.id,
      'Deleted Client',
      new Date(),
    ),
    createClient(
      otherOrganizationId,
      otherTenantAdmin.id,
      'Other Tenant Client',
    ),
  ]);

  [
    primaryLead,
    deletedLead,
    otherTenantLead,
  ] = await Promise.all([
    createLead(
      primaryOrganizationId,
      primaryAdmin.id,
      'Primary Lead',
    ),
    createLead(
      primaryOrganizationId,
      primaryAdmin.id,
      'Deleted Lead',
      new Date(),
    ),
    createLead(
      otherOrganizationId,
      otherTenantAdmin.id,
      'Other Tenant Lead',
    ),
  ]);
});

afterAll(async () => {
  await clearDatabase();

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });

    server.closeAllConnections();
  });

  await Promise.all(
    allQueues.map((queue) => queue.close()),
  );

  await getRedisClient().quit();
  await prisma.$disconnect();
});

describe('search authentication', () => {
  test('rejects unauthenticated requests', async () => {
    const response = await sendRequest(
      new URLSearchParams({
        q: SEARCH_TERM,
      }),
    );

    expect(response.status).toBe(401);
  });

  test('allows an employee with read permissions to search', async () => {
    const response = await sendRequest(
      new URLSearchParams({
        q: SEARCH_TERM,
        modules: 'projects,tasks,crm',
      }),
      primaryEmployee,
    );

    expect(response.status).toBe(200);
  });
});

describe('search request validation', () => {
  test('rejects a missing search term', async () => {
    const response = await sendRequest(
      '',
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });

  test('rejects a one-character search term', async () => {
    const response = await sendRequest(
      new URLSearchParams({
        q: 'a',
      }),
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });

  test('rejects unsupported modules', async () => {
    const response = await sendRequest(
      new URLSearchParams({
        q: SEARCH_TERM,
        modules: 'projects,users',
      }),
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });

  test('rejects duplicate modules', async () => {
    const response = await sendRequest(
      new URLSearchParams({
        q: SEARCH_TERM,
        modules: 'crm,crm',
      }),
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });

  test('rejects a limit above the maximum', async () => {
    const response = await sendRequest(
      new URLSearchParams({
        q: SEARCH_TERM,
        limit: '51',
      }),
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });

  test('rejects a negative offset', async () => {
    const response = await sendRequest(
      new URLSearchParams({
        q: SEARCH_TERM,
        offset: '-1',
      }),
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });

  test('rejects unknown query fields', async () => {
    const response = await sendRequest(
      new URLSearchParams({
        q: SEARCH_TERM,
        organizationId:
          otherOrganizationId,
      }),
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });

  test('normalizes module names and pagination values', async () => {
    const response = await sendRequest(
      new URLSearchParams({
        q: `  ${SEARCH_TERM}  `,
        modules: ' PROJECTS , CRM ',
        limit: '10',
        offset: '0',
      }),
      primaryAdmin,
    );

    expect(response.status).toBe(200);

    expect(
      response.body?.data?.items.every(
        (item) =>
          item.module === 'projects' ||
          item.module === 'crm',
      ),
    ).toBe(true);
  });
});

describe('search tenant and deletion isolation', () => {
  test('returns only active records from the authenticated tenant', async () => {
    const response = await sendRequest(
      new URLSearchParams({
        q: SEARCH_TERM,
        limit: '50',
      }),
      primaryAdmin,
    );

    expect(response.status).toBe(200);

    const resultIds =
      response.body?.data?.items.map(
        (item) => item.id,
      ) ?? [];

    expect(resultIds).toEqual(
      expect.arrayContaining([
        primaryProject.id,
        primaryTask.id,
        primaryClient.id,
        primaryLead.id,
      ]),
    );

    expect(resultIds).not.toEqual(
      expect.arrayContaining([
        deletedProject.id,
        deletedTask.id,
        deletedClient.id,
        deletedLead.id,
        otherTenantProject.id,
        otherTenantTask.id,
        otherTenantClient.id,
        otherTenantLead.id,
      ]),
    );

    expect(response.body?.data?.items).toHaveLength(4);
    expect(response.body?.data?.total).toBe(4);
  });

  test('restricts results to the requested project module', async () => {
    const response = await sendRequest(
      new URLSearchParams({
        q: SEARCH_TERM,
        modules: 'projects',
      }),
      primaryAdmin,
    );

    expect(response.status).toBe(200);

    expect(response.body?.data?.items).toEqual([
      expect.objectContaining({
        id: primaryProject.id,
        module: 'projects',
      }),
    ]);
  });

  test('restricts results to the requested task module', async () => {
    const response = await sendRequest(
      new URLSearchParams({
        q: SEARCH_TERM,
        modules: 'tasks',
      }),
      primaryAdmin,
    );

    expect(response.status).toBe(200);

    expect(response.body?.data?.items).toEqual([
      expect.objectContaining({
        id: primaryTask.id,
        module: 'tasks',
      }),
    ]);
  });

  test('returns both active CRM result types', async () => {
    const response = await sendRequest(
      new URLSearchParams({
        q: SEARCH_TERM,
        modules: 'crm',
      }),
      primaryAdmin,
    );

    expect(response.status).toBe(200);

    const resultIds =
      response.body?.data?.items.map(
        (item) => item.id,
      ) ?? [];

    expect(resultIds).toEqual(
      expect.arrayContaining([
        primaryClient.id,
        primaryLead.id,
      ]),
    );

    expect(resultIds).toHaveLength(2);
  });
});