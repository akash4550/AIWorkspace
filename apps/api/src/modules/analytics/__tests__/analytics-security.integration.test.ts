import { randomUUID } from 'node:crypto';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';

import {
  Project,
  Role,
  Team,
  User,
} from '@prisma/client';

import app from '../../../app';
import { prisma } from '../../../config/prisma';
import { closeRedisClient, getRedisClient } from '../../../core/redis/redis.client';
import { signAccessToken } from '../../../core/security/jwt';
import { allQueues } from '../../jobs/queues';

interface JsonResponse {
  data?: unknown;
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
let primaryManager: User;
let primaryEmployee: User;
let otherTenantAdmin: User;

let primaryProject: Project;
let otherTenantProject: Project;
let otherTenantTeam: Team;

const createUser = async (
  organizationId: string,
  role: Role,
  label: string,
  options: {
    isActive?: boolean;
    deletedAt?: Date;
  } = {},
): Promise<User> => {
  return prisma.user.create({
    data: {
      organizationId,
      firstName: label,
      lastName: 'User',
      email:
        `${label.toLowerCase()}-${randomUUID()}@example.com`,
      password: 'analytics-security-test-password-hash',
      role,
      emailVerified: true,
      isActive: options.isActive ?? true,
      deletedAt: options.deletedAt,
    },
  });
};

const createProject = async (
  organizationId: string,
  ownerId: string,
  name: string,
): Promise<Project> => {
  return prisma.project.create({
    data: {
      organizationId,
      ownerId,
      name: `${name}-${randomUUID()}`,
      key: `AN-${randomUUID()}`,
      status: 'ACTIVE',
    },
  });
};

const createTeam = async (
  organizationId: string,
  ownerId: string,
  name: string,
): Promise<Team> => {
  return prisma.team.create({
    data: {
      organizationId,
      ownerId,
      name: `${name}-${randomUUID()}`,
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
  path: string,
  actor?: User,
): Promise<TestResponse> => {
  const headers: Record<string, string> = {};

  if (actor) {
    headers.Authorization = `Bearer ${tokenFor(actor)}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers,
  });

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
        name: 'Analytics Security Primary Organization',
        slug:
          `analytics-security-primary-${randomUUID()}`,
      },
    });

  const otherOrganization =
    await prisma.organization.create({
      data: {
        name: 'Analytics Security Other Organization',
        slug:
          `analytics-security-other-${randomUUID()}`,
      },
    });

  primaryOrganizationId = primaryOrganization.id;
  otherOrganizationId = otherOrganization.id;

  [
    primaryAdmin,
    primaryManager,
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
      Role.MANAGER,
      'PrimaryManager',
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

  await Promise.all([
    createUser(
      primaryOrganizationId,
      Role.EMPLOYEE,
      'InactivePrimaryEmployee',
      {
        isActive: false,
      },
    ),
    createUser(
      primaryOrganizationId,
      Role.EMPLOYEE,
      'DeletedPrimaryEmployee',
      {
        deletedAt: new Date(),
      },
    ),
  ]);

  [
    primaryProject,
    otherTenantProject,
    otherTenantTeam,
  ] = await Promise.all([
    createProject(
      primaryOrganizationId,
      primaryAdmin.id,
      'Primary Project',
    ),
    createProject(
      otherOrganizationId,
      otherTenantAdmin.id,
      'Other Tenant Project',
    ),
    createTeam(
      otherOrganizationId,
      otherTenantAdmin.id,
      'Other Tenant Team',
    ),
  ]);

  await Promise.all([
    prisma.task.create({
      data: {
        organizationId: primaryOrganizationId,
        projectId: primaryProject.id,
        title: 'Primary analytics task',
        reporterId: primaryAdmin.id,
        assigneeId: primaryManager.id,
        position: 1,
      },
    }),

    prisma.task.create({
      data: {
        organizationId: otherOrganizationId,
        projectId: otherTenantProject.id,
        title: 'Other tenant analytics task',
        reporterId: otherTenantAdmin.id,
        assigneeId: otherTenantAdmin.id,
        position: 1,
      },
    }),
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

  await closeRedisClient();
  await prisma.$disconnect();
});

describe('analytics authentication and role authorization', () => {
  test('rejects unauthenticated metric requests', async () => {
    const response = await sendRequest(
      '/api/v1/analytics/metrics/ACTIVE_USERS',
    );

    expect(response.status).toBe(401);
  });

  test('rejects unauthenticated report requests', async () => {
    const response = await sendRequest(
      '/api/v1/analytics/reports/EXECUTIVE_SUMMARY',
    );

    expect(response.status).toBe(401);
  });

  test('rejects employee metric access', async () => {
    const response = await sendRequest(
      '/api/v1/analytics/metrics/ACTIVE_USERS',
      primaryEmployee,
    );

    expect(response.status).toBe(403);
  });

  test('rejects employee report access', async () => {
    const response = await sendRequest(
      '/api/v1/analytics/reports/EXECUTIVE_SUMMARY',
      primaryEmployee,
    );

    expect(response.status).toBe(403);
  });

  test('allows a manager to read analytics metrics', async () => {
    const response = await sendRequest(
      '/api/v1/analytics/metrics/active_users',
      primaryManager,
    );

    expect(response.status).toBe(200);

    expect(response.body?.data).toEqual(
      expect.objectContaining({
        name: 'Active Users',
        type: 'scalar',
        value: 3,
      }),
    );
  });

  test('allows an administrator to read analytics reports', async () => {
    const response = await sendRequest(
      '/api/v1/analytics/reports/crm_overview',
      primaryAdmin,
    );

    expect(response.status).toBe(200);

    expect(response.body?.data).toEqual(
      expect.objectContaining({
        type: 'CRM_OVERVIEW',
        title: 'CRM Overview',
        generatedAt: expect.any(String),
        results: expect.any(Array),
      }),
    );
  });
});

describe('analytics request validation', () => {
  test('rejects unsupported metric names', async () => {
    const response = await sendRequest(
      '/api/v1/analytics/metrics/UNKNOWN_METRIC',
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });

  test('rejects unsupported report types', async () => {
    const response = await sendRequest(
      '/api/v1/analytics/reports/TEAM_PRODUCTIVITY',
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });

  test('rejects invalid filter UUIDs', async () => {
    const response = await sendRequest(
      '/api/v1/analytics/metrics/TASKS_CREATED' +
        '?projectId=not-a-uuid',
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });

  test('rejects unknown query fields', async () => {
    const response = await sendRequest(
      '/api/v1/analytics/metrics/ACTIVE_USERS' +
        `?organizationId=${otherOrganizationId}`,
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });

  test('rejects inverted date ranges', async () => {
    const query = new URLSearchParams({
      startDate: '2026-07-20T00:00:00.000Z',
      endDate: '2026-07-01T00:00:00.000Z',
    });

    const response = await sendRequest(
      `/api/v1/analytics/metrics/ACTIVE_USERS?${query}`,
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });
});

describe('analytics tenant isolation', () => {
  test('does not include users from another tenant', async () => {
    const response = await sendRequest(
      '/api/v1/analytics/metrics/ACTIVE_USERS',
      primaryAdmin,
    );

    expect(response.status).toBe(200);

    expect(response.body?.data).toEqual(
      expect.objectContaining({
        value: 3,
      }),
    );
  });

  test('counts only tasks from a same-tenant project', async () => {
    const response = await sendRequest(
      '/api/v1/analytics/metrics/TASKS_CREATED' +
        `?projectId=${primaryProject.id}`,
      primaryManager,
    );

    expect(response.status).toBe(200);

    expect(response.body?.data).toEqual(
      expect.objectContaining({
        name: 'Tasks Created',
        value: 1,
      }),
    );
  });

  test('rejects a project filter from another tenant', async () => {
    const response = await sendRequest(
      '/api/v1/analytics/metrics/TASKS_CREATED' +
        `?projectId=${otherTenantProject.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);
  });

  test('rejects a user filter from another tenant', async () => {
    const response = await sendRequest(
      '/api/v1/analytics/metrics/TASKS_CREATED' +
        `?userId=${otherTenantAdmin.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);
  });

  test('rejects a team filter from another tenant', async () => {
    const response = await sendRequest(
      '/api/v1/analytics/metrics/ACTIVE_USERS' +
        `?teamId=${otherTenantTeam.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);
  });

  test('rejects cross-tenant filters before report calculation', async () => {
    const response = await sendRequest(
      '/api/v1/analytics/reports/PROJECT_HEALTH' +
        `?projectId=${otherTenantProject.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);
  });
});
