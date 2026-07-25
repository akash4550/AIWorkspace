import { randomUUID } from 'node:crypto';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';

import {
  Lead,
  Opportunity,
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
  success?: boolean;
  data?: unknown;
  total?: number;
  page?: number;
  limit?: number;
  error?: {
    message: string;
  };
}

interface TestResponse {
  status: number;
  body: JsonResponse | null;
}

type EmployeeWriteCase = {
  label: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  buildPath: () => string;
  buildBody: () => Record<string, unknown> | undefined;
};

let server: Server;
let baseUrl: string;

let primaryOrganizationId: string;
let otherOrganizationId: string;

let primaryAdmin: User;
let primaryManager: User;
let primaryEmployee: User;
let otherTenantEmployee: User;

let primaryLead: Lead;
let otherTenantLead: Lead;
let deletedPrimaryLead: Lead;

let primaryStage: PipelineStage;
let secondaryPrimaryStage: PipelineStage;
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
      email: `${label.toLowerCase()}-${randomUUID()}@example.com`,
      password: 'opportunity-security-test-password-hash',
      role,
      emailVerified: true,
      isActive: true,
    },
  });
};

const createLead = async (
  organizationId: string,
  title: string,
  assignedTo: string,
  deletedAt?: Date,
): Promise<Lead> => {
  return prisma.lead.create({
    data: {
      organizationId,
      title: `${title}-${randomUUID()}`,
      assignedTo,
      deletedAt,
    },
  });
};

const createStage = async (
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

const createOpportunity = async (
  organizationId: string,
  leadId: string,
  stageId: string,
  overrides: Partial<{
    expectedRevenue: number;
    probability: number;
    closeDate: Date;
    deletedAt: Date;
  }> = {},
): Promise<Opportunity> => {
  return prisma.opportunity.create({
    data: {
      organizationId,
      leadId,
      stageId,
      expectedRevenue: overrides.expectedRevenue,
      probability: overrides.probability ?? 50,
      closeDate: overrides.closeDate,
      deletedAt: overrides.deletedAt,
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

const reloadOpportunity = async (
  id: string,
): Promise<Opportunity> => {
  return prisma.opportunity.findUniqueOrThrow({
    where: {
      id,
    },
  });
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
        name: 'Opportunity Security Primary Organization',
        slug: `opportunity-security-primary-${randomUUID()}`,
      },
    });

  const otherOrganization =
    await prisma.organization.create({
      data: {
        name: 'Opportunity Security Other Organization',
        slug: `opportunity-security-other-${randomUUID()}`,
      },
    });

  primaryOrganizationId = primaryOrganization.id;
  otherOrganizationId = otherOrganization.id;

  [
    primaryAdmin,
    primaryManager,
    primaryEmployee,
    otherTenantEmployee,
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
      Role.EMPLOYEE,
      'OtherTenantEmployee',
    ),
  ]);

  [
    primaryLead,
    otherTenantLead,
    deletedPrimaryLead,
  ] = await Promise.all([
    createLead(
      primaryOrganizationId,
      'Primary Lead',
      primaryEmployee.id,
    ),
    createLead(
      otherOrganizationId,
      'Other Tenant Lead',
      otherTenantEmployee.id,
    ),
    createLead(
      primaryOrganizationId,
      'Deleted Primary Lead',
      primaryEmployee.id,
      new Date(),
    ),
  ]);

  [
    primaryStage,
    secondaryPrimaryStage,
    otherTenantStage,
  ] = await Promise.all([
    createStage(
      primaryOrganizationId,
      'Primary Stage',
      1,
    ),
    createStage(
      primaryOrganizationId,
      'Secondary Primary Stage',
      2,
    ),
    createStage(
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

describe('opportunity route authentication and RBAC', () => {
  const employeeWriteCases: EmployeeWriteCase[] = [
    {
      label: 'POST',
      method: 'POST',
      buildPath: (): string =>
        '/api/v1/crm/opportunities',
      buildBody: (): Record<string, unknown> => ({
        leadId: primaryLead.id,
        stageId: primaryStage.id,
      }),
    },
    {
      label: 'PATCH',
      method: 'PATCH',
      buildPath: (): string =>
        `/api/v1/crm/opportunities/${randomUUID()}`,
      buildBody: (): Record<string, unknown> => ({
        probability: 75,
      }),
    },
    {
      label: 'DELETE',
      method: 'DELETE',
      buildPath: (): string =>
        `/api/v1/crm/opportunities/${randomUUID()}`,
      buildBody: (): undefined => undefined,
    },
  ];

  test('rejects unauthenticated opportunity requests', async () => {
    const response = await sendRequest(
      'GET',
      '/api/v1/crm/opportunities',
    );

    expect(response.status).toBe(401);
  });

  test('allows an employee to read opportunities', async () => {
    const opportunity = await createOpportunity(
      primaryOrganizationId,
      primaryLead.id,
      primaryStage.id,
    );

    const response = await sendRequest(
      'GET',
      `/api/v1/crm/opportunities/${opportunity.id}`,
      primaryEmployee,
    );

    expect(response.status).toBe(200);

    expect(response.body?.data).toEqual(
      expect.objectContaining({
        id: opportunity.id,
        organizationId: primaryOrganizationId,
        leadId: primaryLead.id,
        stageId: primaryStage.id,
      }),
    );
  });

  test.each(employeeWriteCases)(
    'rejects employee write operation $label',
    async ({
      method,
      buildPath,
      buildBody,
    }: EmployeeWriteCase) => {
      const response = await sendRequest(
        method,
        buildPath(),
        primaryEmployee,
        buildBody(),
      );

      expect(response.status).toBe(403);
    },
  );

  test('allows a manager to create an opportunity with same-tenant references', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/opportunities',
      primaryManager,
      {
        leadId: primaryLead.id,
        stageId: primaryStage.id,
        expectedRevenue: 25000,
        probability: 70,
        closeDate: '2026-12-31T00:00:00.000Z',
      },
    );

    expect(response.status).toBe(201);

    const created = response.body?.data as Opportunity;

    expect(created).toEqual(
      expect.objectContaining({
        organizationId: primaryOrganizationId,
        leadId: primaryLead.id,
        stageId: primaryStage.id,
        probability: 70,
      }),
    );

    const persisted = await reloadOpportunity(
      created.id,
    );

    expect(persisted.organizationId).toBe(
      primaryOrganizationId,
    );
    expect(persisted.leadId).toBe(primaryLead.id);
    expect(persisted.stageId).toBe(primaryStage.id);
  });
});

describe('opportunity validation and mass-assignment protection', () => {
  test('rejects organizationId injection during creation', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/opportunities',
      primaryAdmin,
      {
        leadId: primaryLead.id,
        stageId: primaryStage.id,
        organizationId: otherOrganizationId,
      },
    );

    expect(response.status).toBe(400);

    const persisted =
      await prisma.opportunity.findFirst({
        where: {
          organizationId: otherOrganizationId,
          leadId: primaryLead.id,
        },
      });

    expect(persisted).toBeNull();
  });

  test('rejects unknown update fields before changes are persisted', async () => {
    const opportunity = await createOpportunity(
      primaryOrganizationId,
      primaryLead.id,
      primaryStage.id,
      {
        probability: 40,
      },
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/opportunities/${opportunity.id}`,
      primaryAdmin,
      {
        probability: 90,
        deletedAt: new Date().toISOString(),
      },
    );

    expect(response.status).toBe(400);

    const persisted = await reloadOpportunity(
      opportunity.id,
    );

    expect(persisted.probability).toBe(40);
    expect(persisted.deletedAt).toBeNull();
  });

  test('rejects an invalid opportunity UUID', async () => {
    const response = await sendRequest(
      'GET',
      '/api/v1/crm/opportunities/not-a-uuid',
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });

  test('rejects an empty update body', async () => {
    const opportunity = await createOpportunity(
      primaryOrganizationId,
      primaryLead.id,
      primaryStage.id,
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/opportunities/${opportunity.id}`,
      primaryAdmin,
      {},
    );

    expect(response.status).toBe(400);
  });

  test('rejects an invalid stage filter UUID', async () => {
    const response = await sendRequest(
      'GET',
      '/api/v1/crm/opportunities?stageId=not-a-uuid',
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });
});

describe('opportunity lead and stage tenant validation', () => {
  test('rejects another tenant lead during creation', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/opportunities',
      primaryAdmin,
      {
        leadId: otherTenantLead.id,
        stageId: primaryStage.id,
      },
    );

    expect(response.status).toBe(400);
  });

  test('rejects a deleted same-tenant lead during creation', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/opportunities',
      primaryAdmin,
      {
        leadId: deletedPrimaryLead.id,
        stageId: primaryStage.id,
      },
    );

    expect(response.status).toBe(400);
  });

  test('rejects another tenant stage during creation', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/opportunities',
      primaryAdmin,
      {
        leadId: primaryLead.id,
        stageId: otherTenantStage.id,
      },
    );

    expect(response.status).toBe(400);
  });

  test('rejects reassignment to another tenant lead without changing the opportunity', async () => {
    const opportunity = await createOpportunity(
      primaryOrganizationId,
      primaryLead.id,
      primaryStage.id,
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/opportunities/${opportunity.id}`,
      primaryAdmin,
      {
        leadId: otherTenantLead.id,
      },
    );

    expect(response.status).toBe(400);

    const persisted = await reloadOpportunity(
      opportunity.id,
    );

    expect(persisted.leadId).toBe(primaryLead.id);
  });

  test('rejects reassignment to another tenant stage without changing the opportunity', async () => {
    const opportunity = await createOpportunity(
      primaryOrganizationId,
      primaryLead.id,
      primaryStage.id,
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/opportunities/${opportunity.id}`,
      primaryAdmin,
      {
        stageId: otherTenantStage.id,
      },
    );

    expect(response.status).toBe(400);

    const persisted = await reloadOpportunity(
      opportunity.id,
    );

    expect(persisted.stageId).toBe(primaryStage.id);
  });

  test('allows reassignment to valid same-tenant references', async () => {
    const replacementLead = await createLead(
      primaryOrganizationId,
      'Replacement Lead',
      primaryManager.id,
    );

    const opportunity = await createOpportunity(
      primaryOrganizationId,
      primaryLead.id,
      primaryStage.id,
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/opportunities/${opportunity.id}`,
      primaryManager,
      {
        leadId: replacementLead.id,
        stageId: secondaryPrimaryStage.id,
      },
    );

    expect(response.status).toBe(200);

    const persisted = await reloadOpportunity(
      opportunity.id,
    );

    expect(persisted.leadId).toBe(
      replacementLead.id,
    );
    expect(persisted.stageId).toBe(
      secondaryPrimaryStage.id,
    );
  });
});

describe('opportunity tenant isolation', () => {
  test('does not expose another tenant opportunity by ID', async () => {
    const opportunity = await createOpportunity(
      otherOrganizationId,
      otherTenantLead.id,
      otherTenantStage.id,
    );

    const response = await sendRequest(
      'GET',
      `/api/v1/crm/opportunities/${opportunity.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);
  });

  test('does not update another tenant opportunity', async () => {
    const opportunity = await createOpportunity(
      otherOrganizationId,
      otherTenantLead.id,
      otherTenantStage.id,
      {
        probability: 30,
      },
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/opportunities/${opportunity.id}`,
      primaryAdmin,
      {
        probability: 95,
      },
    );

    expect(response.status).toBe(404);

    const persisted = await reloadOpportunity(
      opportunity.id,
    );

    expect(persisted.probability).toBe(30);
    expect(persisted.organizationId).toBe(
      otherOrganizationId,
    );
  });

  test('does not delete another tenant opportunity', async () => {
    const opportunity = await createOpportunity(
      otherOrganizationId,
      otherTenantLead.id,
      otherTenantStage.id,
    );

    const response = await sendRequest(
      'DELETE',
      `/api/v1/crm/opportunities/${opportunity.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);

    const persisted = await reloadOpportunity(
      opportunity.id,
    );

    expect(persisted.deletedAt).toBeNull();
  });

  test('lists only active opportunities from the authenticated tenant', async () => {
    const visibleOpportunity =
      await createOpportunity(
        primaryOrganizationId,
        primaryLead.id,
        primaryStage.id,
      );

    await createOpportunity(
      primaryOrganizationId,
      primaryLead.id,
      primaryStage.id,
      {
        deletedAt: new Date(),
      },
    );

    const otherTenantOpportunity =
      await createOpportunity(
        otherOrganizationId,
        otherTenantLead.id,
        otherTenantStage.id,
      );

    const response = await sendRequest(
      'GET',
      '/api/v1/crm/opportunities?page=1&limit=100',
      primaryEmployee,
    );

    expect(response.status).toBe(200);

    const data = response.body?.data as Opportunity[];
    const returnedIds = data.map(
      (opportunity) => opportunity.id,
    );

    expect(returnedIds).toContain(
      visibleOpportunity.id,
    );

    expect(returnedIds).not.toContain(
      otherTenantOpportunity.id,
    );

    expect(data).toHaveLength(1);
    expect(response.body?.total).toBe(1);
  });
});

describe('opportunity soft deletion', () => {
  test('soft deletes a same-tenant opportunity', async () => {
    const opportunity = await createOpportunity(
      primaryOrganizationId,
      primaryLead.id,
      primaryStage.id,
    );

    const response = await sendRequest(
      'DELETE',
      `/api/v1/crm/opportunities/${opportunity.id}`,
      primaryManager,
    );

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();

    const persisted = await reloadOpportunity(
      opportunity.id,
    );

    expect(persisted.deletedAt).toBeInstanceOf(Date);
  });

  test('returns not found when deleting an already deleted opportunity', async () => {
    const opportunity = await createOpportunity(
      primaryOrganizationId,
      primaryLead.id,
      primaryStage.id,
      {
        deletedAt: new Date(),
      },
    );

    const response = await sendRequest(
      'DELETE',
      `/api/v1/crm/opportunities/${opportunity.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);
  });
});
