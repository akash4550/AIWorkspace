import { randomUUID } from 'node:crypto';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';

import {
  Client,
  CRMActivity,
  CRMActivityType,
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

let server: Server;
let baseUrl: string;

let primaryOrganizationId: string;
let otherOrganizationId: string;

let primaryAdmin: User;
let primaryManager: User;
let primaryEmployee: User;
let otherTenantAdmin: User;

let primaryClient: Client;
let otherTenantClient: Client;

let primaryLead: Lead;
let secondaryPrimaryLead: Lead;
let otherTenantLead: Lead;

let primaryStage: PipelineStage;
let otherTenantStage: PipelineStage;

let primaryOpportunity: Opportunity;
let otherTenantOpportunity: Opportunity;

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
      password: 'activity-security-test-password-hash',
      role,
      emailVerified: true,
      isActive: true,
    },
  });
};

const createClient = async (
  organizationId: string,
  ownerId: string,
  name: string,
  deletedAt?: Date,
): Promise<Client> => {
  return prisma.client.create({
    data: {
      organizationId,
      ownerId,
      name: `${name}-${randomUUID()}`,
      deletedAt,
    },
  });
};

const createLead = async (
  organizationId: string,
  title: string,
  deletedAt?: Date,
): Promise<Lead> => {
  return prisma.lead.create({
    data: {
      organizationId,
      title: `${title}-${randomUUID()}`,
      deletedAt,
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

const createOpportunity = async (
  organizationId: string,
  leadId: string,
  stageId: string,
  deletedAt?: Date,
): Promise<Opportunity> => {
  return prisma.opportunity.create({
    data: {
      organizationId,
      leadId,
      stageId,
      expectedRevenue: 10000,
      probability: 50,
      deletedAt,
    },
  });
};

const createActivity = async (
  organizationId: string,
  createdById: string,
  description: string,
  links: {
    clientId?: string;
    leadId?: string;
    opportunityId?: string;
  },
): Promise<CRMActivity> => {
  return prisma.cRMActivity.create({
    data: {
      organizationId,
      createdById,
      type: CRMActivityType.NOTE,
      description,
      clientId: links.clientId,
      leadId: links.leadId,
      opportunityId: links.opportunityId,
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
  method: 'GET' | 'POST',
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
        name: 'Activity Security Primary Organization',
        slug: `activity-security-primary-${randomUUID()}`,
      },
    });

  const otherOrganization =
    await prisma.organization.create({
      data: {
        name: 'Activity Security Other Organization',
        slug: `activity-security-other-${randomUUID()}`,
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
    primaryClient,
    otherTenantClient,
  ] = await Promise.all([
    createClient(
      primaryOrganizationId,
      primaryAdmin.id,
      'Primary Client',
    ),
    createClient(
      otherOrganizationId,
      otherTenantAdmin.id,
      'Other Tenant Client',
    ),
  ]);

  [
    primaryLead,
    secondaryPrimaryLead,
    otherTenantLead,
  ] = await Promise.all([
    createLead(
      primaryOrganizationId,
      'Primary Lead',
    ),
    createLead(
      primaryOrganizationId,
      'Secondary Primary Lead',
    ),
    createLead(
      otherOrganizationId,
      'Other Tenant Lead',
    ),
  ]);

  [
    primaryStage,
    otherTenantStage,
  ] = await Promise.all([
    createPipelineStage(
      primaryOrganizationId,
      'Primary Stage',
      1,
    ),
    createPipelineStage(
      otherOrganizationId,
      'Other Tenant Stage',
      1,
    ),
  ]);

  [
    primaryOpportunity,
    otherTenantOpportunity,
  ] = await Promise.all([
    createOpportunity(
      primaryOrganizationId,
      primaryLead.id,
      primaryStage.id,
    ),
    createOpportunity(
      otherOrganizationId,
      otherTenantLead.id,
      otherTenantStage.id,
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

describe('activity route authentication and RBAC', () => {
  test('rejects unauthenticated activity requests', async () => {
    const response = await sendRequest(
      'GET',
      '/api/v1/crm/activities',
    );

    expect(response.status).toBe(401);
  });

  test('allows an employee to read activities', async () => {
    const activity = await createActivity(
      primaryOrganizationId,
      primaryAdmin.id,
      'Employee-visible activity',
      {
        clientId: primaryClient.id,
      },
    );

    const response = await sendRequest(
      'GET',
      '/api/v1/crm/activities?page=1&limit=20',
      primaryEmployee,
    );

    expect(response.status).toBe(200);

    const data = response.body?.data as CRMActivity[];
    const ids = data.map((item) => item.id);

    expect(ids).toContain(activity.id);
  });

  test('rejects employee activity creation', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/activities',
      primaryEmployee,
      {
        type: CRMActivityType.NOTE,
        content: 'Forbidden activity',
        clientId: primaryClient.id,
      },
    );

    expect(response.status).toBe(403);
  });

  test('allows a manager to create a same-tenant activity', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/activities',
      primaryManager,
      {
        type: CRMActivityType.MEETING,
        content: '  Customer review meeting  ',
        clientId: primaryClient.id,
        leadId: primaryLead.id,
        opportunityId: primaryOpportunity.id,
      },
    );

    expect(response.status).toBe(201);

    const created = response.body?.data as CRMActivity;

    expect(created).toEqual(
      expect.objectContaining({
        organizationId: primaryOrganizationId,
        createdById: primaryManager.id,
        type: CRMActivityType.MEETING,
        description: 'Customer review meeting',
        clientId: primaryClient.id,
        leadId: primaryLead.id,
        opportunityId: primaryOpportunity.id,
      }),
    );

    const persisted =
      await prisma.cRMActivity.findUniqueOrThrow({
        where: {
          id: created.id,
        },
      });

    expect(persisted.organizationId).toBe(
      primaryOrganizationId,
    );
    expect(persisted.createdById).toBe(
      primaryManager.id,
    );
  });
});

describe('activity request validation and mass-assignment protection', () => {
  test('rejects protected field injection', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/activities',
      primaryAdmin,
      {
        type: CRMActivityType.NOTE,
        content: 'Injected activity',
        clientId: primaryClient.id,
        organizationId: otherOrganizationId,
        createdById: otherTenantAdmin.id,
      },
    );

    expect(response.status).toBe(400);

    const persisted =
      await prisma.cRMActivity.findFirst({
        where: {
          description: 'Injected activity',
        },
      });

    expect(persisted).toBeNull();
  });

  test('requires at least one linked CRM entity', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/activities',
      primaryAdmin,
      {
        type: CRMActivityType.NOTE,
        content: 'Unlinked activity',
      },
    );

    expect(response.status).toBe(400);
  });

  test('rejects empty activity content', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/activities',
      primaryAdmin,
      {
        type: CRMActivityType.NOTE,
        content: '   ',
        clientId: primaryClient.id,
      },
    );

    expect(response.status).toBe(400);
  });

  test('rejects invalid entity UUIDs', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/activities',
      primaryAdmin,
      {
        type: CRMActivityType.NOTE,
        content: 'Invalid UUID activity',
        clientId: 'not-a-uuid',
      },
    );

    expect(response.status).toBe(400);
  });

  test('rejects invalid list pagination', async () => {
    const response = await sendRequest(
      'GET',
      '/api/v1/crm/activities?page=0&limit=101',
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });
});

describe('activity linked-entity tenant validation', () => {
  test('rejects another tenant client', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/activities',
      primaryAdmin,
      {
        type: CRMActivityType.CALL,
        content: 'Cross-tenant client activity',
        clientId: otherTenantClient.id,
      },
    );

    expect(response.status).toBe(400);
  });

  test('rejects a deleted same-tenant client', async () => {
    const deletedClient = await createClient(
      primaryOrganizationId,
      primaryAdmin.id,
      'Deleted Client',
      new Date(),
    );

    const response = await sendRequest(
      'POST',
      '/api/v1/crm/activities',
      primaryAdmin,
      {
        type: CRMActivityType.CALL,
        content: 'Deleted client activity',
        clientId: deletedClient.id,
      },
    );

    expect(response.status).toBe(400);
  });

  test('rejects another tenant lead', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/activities',
      primaryAdmin,
      {
        type: CRMActivityType.EMAIL,
        content: 'Cross-tenant lead activity',
        leadId: otherTenantLead.id,
      },
    );

    expect(response.status).toBe(400);
  });

  test('rejects a deleted same-tenant lead', async () => {
    const deletedLead = await createLead(
      primaryOrganizationId,
      'Deleted Lead',
      new Date(),
    );

    const response = await sendRequest(
      'POST',
      '/api/v1/crm/activities',
      primaryAdmin,
      {
        type: CRMActivityType.EMAIL,
        content: 'Deleted lead activity',
        leadId: deletedLead.id,
      },
    );

    expect(response.status).toBe(400);
  });

  test('rejects another tenant opportunity', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/activities',
      primaryAdmin,
      {
        type: CRMActivityType.MEETING,
        content: 'Cross-tenant opportunity activity',
        opportunityId: otherTenantOpportunity.id,
      },
    );

    expect(response.status).toBe(400);
  });

  test('rejects a deleted same-tenant opportunity', async () => {
    const deletedOpportunity = await createOpportunity(
      primaryOrganizationId,
      primaryLead.id,
      primaryStage.id,
      new Date(),
    );

    const response = await sendRequest(
      'POST',
      '/api/v1/crm/activities',
      primaryAdmin,
      {
        type: CRMActivityType.MEETING,
        content: 'Deleted opportunity activity',
        opportunityId: deletedOpportunity.id,
      },
    );

    expect(response.status).toBe(400);
  });

  test('rejects a lead that does not match the opportunity', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/activities',
      primaryAdmin,
      {
        type: CRMActivityType.STATUS_CHANGE,
        content: 'Mismatched opportunity lead',
        leadId: secondaryPrimaryLead.id,
        opportunityId: primaryOpportunity.id,
      },
    );

    expect(response.status).toBe(400);

    const persisted =
      await prisma.cRMActivity.findFirst({
        where: {
          description: 'Mismatched opportunity lead',
        },
      });

    expect(persisted).toBeNull();
  });
});

describe('activity tenant isolation', () => {
  test('lists only activities from the authenticated tenant', async () => {
    const visibleActivity = await createActivity(
      primaryOrganizationId,
      primaryAdmin.id,
      'Visible activity',
      {
        clientId: primaryClient.id,
      },
    );

    const otherActivity = await createActivity(
      otherOrganizationId,
      otherTenantAdmin.id,
      'Invisible activity',
      {
        clientId: otherTenantClient.id,
      },
    );

    const response = await sendRequest(
      'GET',
      '/api/v1/crm/activities?page=1&limit=100',
      primaryEmployee,
    );

    expect(response.status).toBe(200);

    const data = response.body?.data as CRMActivity[];
    const ids = data.map((activity) => activity.id);

    expect(ids).toContain(visibleActivity.id);
    expect(ids).not.toContain(otherActivity.id);
    expect(data).toHaveLength(1);
    expect(response.body?.total).toBe(1);
  });

  test('does not expose another tenant activity through a client filter', async () => {
    await createActivity(
      otherOrganizationId,
      otherTenantAdmin.id,
      'Other tenant filtered activity',
      {
        clientId: otherTenantClient.id,
      },
    );

    const response = await sendRequest(
      'GET',
      `/api/v1/crm/activities?clientId=${otherTenantClient.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(200);
    expect(response.body?.data).toEqual([]);
    expect(response.body?.total).toBe(0);
  });

  test('filters same-tenant activities by linked entity', async () => {
    const clientActivity = await createActivity(
      primaryOrganizationId,
      primaryAdmin.id,
      'Client-filtered activity',
      {
        clientId: primaryClient.id,
      },
    );

    await createActivity(
      primaryOrganizationId,
      primaryAdmin.id,
      'Lead-only activity',
      {
        leadId: primaryLead.id,
      },
    );

    const response = await sendRequest(
      'GET',
      `/api/v1/crm/activities?clientId=${primaryClient.id}`,
      primaryEmployee,
    );

    expect(response.status).toBe(200);

    const data = response.body?.data as CRMActivity[];

    expect(data).toHaveLength(1);
    expect(data[0].id).toBe(clientActivity.id);
    expect(response.body?.total).toBe(1);
  });
});
