import { randomUUID } from 'node:crypto';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';

import {
  PipelineStage,
  Role,
  User,
} from '@prisma/client';

import app from '../../../../app';
import { prisma } from '../../../../config/prisma';
import { closeRedisClient, getRedisClient } from '../../../../core/redis/redis.client';
import { signAccessToken } from '../../../../core/security/jwt';
import { allQueues } from '../../../jobs/queues';

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

let primaryStageOne: PipelineStage;
let primaryStageTwo: PipelineStage;
let otherTenantStage: PipelineStage;

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
      password: 'pipeline-security-test-password-hash',
      role,
      emailVerified: true,
      isActive: true,
    },
  });
};

const createPipelineStage = async (
  organizationId: string,
  name: string,
  position: number,
): Promise<PipelineStage> => {
  return prisma.pipelineStage.create({
    data: {
      organizationId,
      name: `${name}-${randomUUID()}`,
      probability: 50,
      position,
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
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  actor?: User,
  body?: Record<string, unknown>,
): Promise<TestResponse> => {
  const headers: Record<string, string> = {};

  if (actor) {
    headers.Authorization = `Bearer ${tokenFor(actor)}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : JSON.stringify(body),
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

  await prisma.activityLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
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
        name: 'Pipeline Security Primary Organization',
        slug:
          `pipeline-security-primary-${randomUUID()}`,
      },
    });

  const otherOrganization =
    await prisma.organization.create({
      data: {
        name: 'Pipeline Security Other Organization',
        slug:
          `pipeline-security-other-${randomUUID()}`,
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

  [
    primaryStageOne,
    primaryStageTwo,
    otherTenantStage,
  ] = await Promise.all([
    createPipelineStage(
      primaryOrganizationId,
      'Primary Qualification',
      1,
    ),
    createPipelineStage(
      primaryOrganizationId,
      'Primary Negotiation',
      2,
    ),
    createPipelineStage(
      otherOrganizationId,
      'Other Tenant Stage',
      1,
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

  await closeRedisClient();
  await prisma.$disconnect();
});

describe('pipeline route authentication and RBAC', () => {
  test('rejects unauthenticated pipeline requests', async () => {
    const response = await sendRequest(
      'GET',
      '/api/v1/crm/pipeline-stages',
    );

    expect(response.status).toBe(401);
  });

  test('allows an employee to read pipeline stages', async () => {
    const response = await sendRequest(
      'GET',
      '/api/v1/crm/pipeline-stages',
      primaryEmployee,
    );

    expect(response.status).toBe(200);

    const stages = response.body?.data as Array<{
      id: string;
    }>;

    const stageIds = stages.map((stage) => stage.id);

    expect(stageIds).toContain(primaryStageOne.id);
    expect(stageIds).toContain(primaryStageTwo.id);
    expect(stageIds).not.toContain(otherTenantStage.id);
  });

  test('rejects employee pipeline creation', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/pipeline-stages',
      primaryEmployee,
      {
        name: 'Employee Stage',
        probability: 25,
        position: 3,
      },
    );

    expect(response.status).toBe(403);
  });

  test('rejects employee pipeline updates', async () => {
    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/pipeline-stages/${primaryStageOne.id}`,
      primaryEmployee,
      {
        name: 'Forbidden Update',
      },
    );

    expect(response.status).toBe(403);
  });

  test('rejects employee pipeline deletion', async () => {
    const response = await sendRequest(
      'DELETE',
      `/api/v1/crm/pipeline-stages/${primaryStageOne.id}`,
      primaryEmployee,
    );

    expect(response.status).toBe(403);
  });

  test('rejects employee pipeline reordering', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/pipeline-stages/reorder',
      primaryEmployee,
      {
        stages: [
          {
            id: primaryStageOne.id,
            position: 2,
          },
        ],
      },
    );

    expect(response.status).toBe(403);
  });

  test('allows a manager to create a same-tenant stage', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/pipeline-stages',
      primaryManager,
      {
        name: '  Proposal Sent  ',
        probability: 70,
        position: 3,
      },
    );

    expect(response.status).toBe(201);

    const created = response.body?.data as {
      id: string;
      organizationId: string;
      name: string;
      probability: number;
    };

    expect(created).toEqual(
      expect.objectContaining({
        organizationId: primaryOrganizationId,
        name: 'Proposal Sent',
        probability: 70,
      }),
    );

    const persisted =
      await prisma.pipelineStage.findUniqueOrThrow({
        where: {
          id: created.id,
        },
      });

    expect(persisted.organizationId).toBe(
      primaryOrganizationId,
    );

    expect(persisted.name).toBe('Proposal Sent');
  });
});

describe(
  'pipeline request validation and mass-assignment protection',
  () => {
    test('rejects organization field injection', async () => {
      const response = await sendRequest(
        'POST',
        '/api/v1/crm/pipeline-stages',
        primaryAdmin,
        {
          name: 'Injected Stage',
          probability: 25,
          position: 3,
          organizationId: otherOrganizationId,
        },
      );

      expect(response.status).toBe(400);

      const persisted =
        await prisma.pipelineStage.findFirst({
          where: {
            name: 'Injected Stage',
          },
        });

      expect(persisted).toBeNull();
    });

    test('rejects blank stage names', async () => {
      const response = await sendRequest(
        'POST',
        '/api/v1/crm/pipeline-stages',
        primaryAdmin,
        {
          name: '   ',
          probability: 25,
          position: 3,
        },
      );

      expect(response.status).toBe(400);
    });

    test('rejects invalid stage probability', async () => {
      const response = await sendRequest(
        'POST',
        '/api/v1/crm/pipeline-stages',
        primaryAdmin,
        {
          name: 'Invalid Probability',
          probability: 101,
          position: 3,
        },
      );

      expect(response.status).toBe(400);
    });

    test('rejects empty stage updates', async () => {
      const response = await sendRequest(
        'PATCH',
        `/api/v1/crm/pipeline-stages/${primaryStageOne.id}`,
        primaryAdmin,
        {},
      );

      expect(response.status).toBe(400);
    });

    test('rejects invalid pipeline stage IDs', async () => {
      const response = await sendRequest(
        'GET',
        '/api/v1/crm/pipeline-stages/not-a-uuid',
        primaryAdmin,
      );

      expect(response.status).toBe(400);
    });

    test('rejects duplicate stage IDs during reorder', async () => {
      const response = await sendRequest(
        'POST',
        '/api/v1/crm/pipeline-stages/reorder',
        primaryAdmin,
        {
          stages: [
            {
              id: primaryStageOne.id,
              position: 1,
            },
            {
              id: primaryStageOne.id,
              position: 2,
            },
          ],
        },
      );

      expect(response.status).toBe(400);
    });
  },
);

describe('pipeline tenant isolation', () => {
  test('lists only stages belonging to the authenticated tenant', async () => {
    const response = await sendRequest(
      'GET',
      '/api/v1/crm/pipeline-stages',
      primaryAdmin,
    );

    expect(response.status).toBe(200);

    const stages = response.body?.data as Array<{
      id: string;
      organizationId: string;
    }>;

    expect(stages).toHaveLength(2);

    expect(
      stages.every(
        (stage) =>
          stage.organizationId === primaryOrganizationId,
      ),
    ).toBe(true);

    expect(
      stages.map((stage) => stage.id),
    ).not.toContain(otherTenantStage.id);
  });

  test('does not return a stage from another tenant', async () => {
    const response = await sendRequest(
      'GET',
      `/api/v1/crm/pipeline-stages/${otherTenantStage.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);
  });

  test('does not update a stage from another tenant', async () => {
    const originalName = otherTenantStage.name;

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/pipeline-stages/${otherTenantStage.id}`,
      primaryAdmin,
      {
        name: 'Cross Tenant Update',
      },
    );

    expect(response.status).toBe(404);

    const persisted =
      await prisma.pipelineStage.findUniqueOrThrow({
        where: {
          id: otherTenantStage.id,
        },
      });

    expect(persisted.name).toBe(originalName);
  });

  test('does not delete a stage from another tenant', async () => {
    const response = await sendRequest(
      'DELETE',
      `/api/v1/crm/pipeline-stages/${otherTenantStage.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);

    const persisted =
      await prisma.pipelineStage.findUnique({
        where: {
          id: otherTenantStage.id,
        },
      });

    expect(persisted).not.toBeNull();
  });

  test('rolls back reorder when any stage belongs to another tenant', async () => {
    const originalPrimaryPosition =
      primaryStageOne.position.toString();

    const originalOtherPosition =
      otherTenantStage.position.toString();

    const response = await sendRequest(
      'POST',
      '/api/v1/crm/pipeline-stages/reorder',
      primaryAdmin,
      {
        stages: [
          {
            id: primaryStageOne.id,
            position: 10,
          },
          {
            id: otherTenantStage.id,
            position: 20,
          },
        ],
      },
    );

    expect(response.status).toBe(404);

    const [
      persistedPrimaryStage,
      persistedOtherStage,
    ] = await Promise.all([
      prisma.pipelineStage.findUniqueOrThrow({
        where: {
          id: primaryStageOne.id,
        },
      }),
      prisma.pipelineStage.findUniqueOrThrow({
        where: {
          id: otherTenantStage.id,
        },
      }),
    ]);

    expect(
      persistedPrimaryStage.position.toString(),
    ).toBe(originalPrimaryPosition);

    expect(
      persistedOtherStage.position.toString(),
    ).toBe(originalOtherPosition);
  });

  test('updates a same-tenant pipeline stage', async () => {
    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/pipeline-stages/${primaryStageOne.id}`,
      primaryManager,
      {
        name: '  Updated Qualification  ',
        probability: 65,
        position: 4.5,
      },
    );

    expect(response.status).toBe(200);

    const updated = response.body?.data as {
      id: string;
      organizationId: string;
      name: string;
      probability: number;
    };

    expect(updated).toEqual(
      expect.objectContaining({
        id: primaryStageOne.id,
        organizationId: primaryOrganizationId,
        name: 'Updated Qualification',
        probability: 65,
      }),
    );

    const persisted =
      await prisma.pipelineStage.findUniqueOrThrow({
        where: {
          id: primaryStageOne.id,
        },
      });

    expect(persisted.name).toBe(
      'Updated Qualification',
    );

    expect(persisted.position.toString()).toBe('4.5');
  });

  test('reorders same-tenant stages', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/pipeline-stages/reorder',
      primaryManager,
      {
        stages: [
          {
            id: primaryStageOne.id,
            position: 2,
          },
          {
            id: primaryStageTwo.id,
            position: 1,
          },
        ],
      },
    );

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();

    const [
      persistedStageOne,
      persistedStageTwo,
    ] = await Promise.all([
      prisma.pipelineStage.findUniqueOrThrow({
        where: {
          id: primaryStageOne.id,
        },
      }),
      prisma.pipelineStage.findUniqueOrThrow({
        where: {
          id: primaryStageTwo.id,
        },
      }),
    ]);

    expect(persistedStageOne.position.toString()).toBe('2');
    expect(persistedStageTwo.position.toString()).toBe('1');
  });

  test('deletes a same-tenant pipeline stage', async () => {
    const response = await sendRequest(
      'DELETE',
      `/api/v1/crm/pipeline-stages/${primaryStageTwo.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();

    const persisted =
      await prisma.pipelineStage.findUnique({
        where: {
          id: primaryStageTwo.id,
        },
      });

    expect(persisted).toBeNull();
  });
});
