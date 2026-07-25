import { randomUUID } from 'node:crypto';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';

import {
  Lead,
  LeadStatus,
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
let inactivePrimaryUser: User;
let deletedPrimaryUser: User;
let otherTenantAdmin: User;
let otherTenantEmployee: User;

const createUser = async (
  organizationId: string,
  role: Role,
  label: string,
  overrides: Partial<{
    isActive: boolean;
    deletedAt: Date;
  }> = {},
): Promise<User> => {
  return prisma.user.create({
    data: {
      organizationId,
      firstName: label,
      lastName: 'User',
      email: `${label.toLowerCase()}-${randomUUID()}@example.com`,
      password: 'lead-security-test-password-hash',
      role,
      emailVerified: true,
      isActive: overrides.isActive ?? true,
      deletedAt: overrides.deletedAt,
    },
  });
};

const createLead = async (
  organizationId: string,
  title: string,
  overrides: Partial<{
    assignedTo: string;
    status: LeadStatus;
    deletedAt: Date;
  }> = {},
): Promise<Lead> => {
  return prisma.lead.create({
    data: {
      organizationId,
      title: `${title}-${randomUUID()}`,
      assignedTo: overrides.assignedTo,
      status: overrides.status ?? LeadStatus.NEW,
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
    body: body === undefined
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

const reloadLead = async (id: string): Promise<Lead> => {
  return prisma.lead.findUniqueOrThrow({
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

  const primaryOrganization = await prisma.organization.create({
    data: {
      name: 'Lead Security Primary Organization',
      slug: `lead-security-primary-${randomUUID()}`,
    },
  });

  const otherOrganization = await prisma.organization.create({
    data: {
      name: 'Lead Security Other Organization',
      slug: `lead-security-other-${randomUUID()}`,
    },
  });

  primaryOrganizationId = primaryOrganization.id;
  otherOrganizationId = otherOrganization.id;

  [
    primaryAdmin,
    primaryManager,
    primaryEmployee,
    inactivePrimaryUser,
    deletedPrimaryUser,
    otherTenantAdmin,
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
    createUser(
      otherOrganizationId,
      Role.ADMIN,
      'OtherTenantAdmin',
    ),
    createUser(
      otherOrganizationId,
      Role.EMPLOYEE,
      'OtherTenantEmployee',
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

describe('lead route authentication and RBAC', () => {
  test('rejects unauthenticated lead requests', async () => {
    const response = await sendRequest(
      'GET',
      '/api/v1/crm/leads',
    );

    expect(response.status).toBe(401);
  });

  test('allows an employee to read leads', async () => {
    const lead = await createLead(
      primaryOrganizationId,
      'Readable Lead',
      {
        assignedTo: primaryEmployee.id,
      },
    );

    const response = await sendRequest(
      'GET',
      `/api/v1/crm/leads/${lead.id}`,
      primaryEmployee,
    );

    expect(response.status).toBe(200);
    expect(response.body?.data).toEqual(
      expect.objectContaining({
        id: lead.id,
        organizationId: primaryOrganizationId,
      }),
    );
  });

  test.each([
    {
      method: 'POST' as const,
      path: '/api/v1/crm/leads',
      body: {
        title: 'Forbidden Lead Creation',
      },
    },
    {
      method: 'PATCH' as const,
      path: `/api/v1/crm/leads/${randomUUID()}`,
      body: {
        title: 'Forbidden Lead Update',
      },
    },
    {
      method: 'DELETE' as const,
      path: `/api/v1/crm/leads/${randomUUID()}`,
      body: undefined,
    },
  ])(
    'rejects employee write operation $method $path',
    async ({ method, path, body }) => {
      const response = await sendRequest(
        method,
        path,
        primaryEmployee,
        body,
      );

      expect(response.status).toBe(403);
    },
  );

  test('allows a manager to create a lead with a valid same-tenant assignee', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/leads',
      primaryManager,
      {
        title: 'Manager Created Lead',
        assignedTo: primaryEmployee.id,
        score: 75,
      },
    );

    expect(response.status).toBe(201);

    const created = response.body?.data as Lead;

    expect(created).toEqual(
      expect.objectContaining({
        title: 'Manager Created Lead',
        organizationId: primaryOrganizationId,
        assignedTo: primaryEmployee.id,
        score: 75,
      }),
    );

    const persisted = await reloadLead(created.id);

    expect(persisted.organizationId).toBe(
      primaryOrganizationId,
    );
    expect(persisted.assignedTo).toBe(
      primaryEmployee.id,
    );
  });
});

describe('lead request validation and mass-assignment protection', () => {
  test('rejects organizationId injection during creation', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/leads',
      primaryAdmin,
      {
        title: 'Injected Organization Lead',
        organizationId: otherOrganizationId,
      },
    );

    expect(response.status).toBe(400);

    const persisted = await prisma.lead.findFirst({
      where: {
        title: 'Injected Organization Lead',
      },
    });

    expect(persisted).toBeNull();
  });

  test('rejects unknown update fields before valid changes are persisted', async () => {
    const lead = await createLead(
      primaryOrganizationId,
      'Original Lead',
      {
        assignedTo: primaryEmployee.id,
      },
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/leads/${lead.id}`,
      primaryAdmin,
      {
        title: 'Attacker Modified Lead',
        deletedAt: new Date().toISOString(),
      },
    );

    expect(response.status).toBe(400);

    const persisted = await reloadLead(lead.id);

    expect(persisted.title).toBe(lead.title);
    expect(persisted.deletedAt).toBeNull();
  });

  test('rejects an invalid lead UUID', async () => {
    const response = await sendRequest(
      'GET',
      '/api/v1/crm/leads/not-a-uuid',
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });

  test('rejects an empty update body', async () => {
    const lead = await createLead(
      primaryOrganizationId,
      'Empty Update Lead',
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/leads/${lead.id}`,
      primaryAdmin,
      {},
    );

    expect(response.status).toBe(400);
  });
});

describe('lead assignee tenant validation', () => {
  test('rejects another tenant user as the assignee during creation', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/leads',
      primaryAdmin,
      {
        title: 'Cross Tenant Assignee Lead',
        assignedTo: otherTenantEmployee.id,
      },
    );

    expect(response.status).toBe(400);

    const persisted = await prisma.lead.findFirst({
      where: {
        title: 'Cross Tenant Assignee Lead',
      },
    });

    expect(persisted).toBeNull();
  });

  test.each([
    [
      'inactive',
      () => inactivePrimaryUser,
    ],
    [
      'deleted',
      () => deletedPrimaryUser,
    ],
  ])(
    'rejects a %s same-tenant user as the assignee',
    async (_label, resolveAssignee) => {
      const assignee = resolveAssignee();

      const response = await sendRequest(
        'POST',
        '/api/v1/crm/leads',
        primaryAdmin,
        {
          title: `Invalid Assignee Lead ${randomUUID()}`,
          assignedTo: assignee.id,
        },
      );

      expect(response.status).toBe(400);
    },
  );

  test('rejects reassignment to another tenant user without changing the lead', async () => {
    const lead = await createLead(
      primaryOrganizationId,
      'Assignee Reassignment Lead',
      {
        assignedTo: primaryEmployee.id,
      },
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/leads/${lead.id}`,
      primaryAdmin,
      {
        assignedTo: otherTenantEmployee.id,
      },
    );

    expect(response.status).toBe(400);

    const persisted = await reloadLead(lead.id);

    expect(persisted.assignedTo).toBe(
      primaryEmployee.id,
    );
  });
});

describe('lead tenant isolation', () => {
  test('does not expose another tenant lead by ID', async () => {
    const otherTenantLead = await createLead(
      otherOrganizationId,
      'Other Tenant Lead',
      {
        assignedTo: otherTenantEmployee.id,
      },
    );

    const response = await sendRequest(
      'GET',
      `/api/v1/crm/leads/${otherTenantLead.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);
  });

  test('does not update another tenant lead', async () => {
    const otherTenantLead = await createLead(
      otherOrganizationId,
      'Protected Other Tenant Lead',
      {
        assignedTo: otherTenantEmployee.id,
      },
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/leads/${otherTenantLead.id}`,
      primaryAdmin,
      {
        title: 'Attacker Controlled Lead',
      },
    );

    expect(response.status).toBe(404);

    const persisted = await reloadLead(
      otherTenantLead.id,
    );

    expect(persisted.title).toBe(
      otherTenantLead.title,
    );
    expect(persisted.organizationId).toBe(
      otherOrganizationId,
    );
  });

  test('does not delete another tenant lead', async () => {
    const otherTenantLead = await createLead(
      otherOrganizationId,
      'Protected Delete Lead',
      {
        assignedTo: otherTenantEmployee.id,
      },
    );

    const response = await sendRequest(
      'DELETE',
      `/api/v1/crm/leads/${otherTenantLead.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);

    const persisted = await reloadLead(
      otherTenantLead.id,
    );

    expect(persisted.deletedAt).toBeNull();
  });

  test('lists only active leads from the authenticated tenant', async () => {
    const visibleLead = await createLead(
      primaryOrganizationId,
      'Visible Primary Lead',
      {
        assignedTo: primaryEmployee.id,
      },
    );

    await createLead(
      primaryOrganizationId,
      'Deleted Primary Lead',
      {
        assignedTo: primaryEmployee.id,
        deletedAt: new Date(),
      },
    );

    const otherTenantLead = await createLead(
      otherOrganizationId,
      'Invisible Other Tenant Lead',
      {
        assignedTo: otherTenantEmployee.id,
      },
    );

    const response = await sendRequest(
      'GET',
      '/api/v1/crm/leads?page=1&limit=100',
      primaryEmployee,
    );

    expect(response.status).toBe(200);

    const data = response.body?.data as Lead[];
    const returnedIds = data.map((lead) => lead.id);

    expect(returnedIds).toContain(visibleLead.id);
    expect(returnedIds).not.toContain(
      otherTenantLead.id,
    );

    expect(data).toHaveLength(1);
    expect(response.body?.total).toBe(1);
  });
});

describe('lead soft deletion', () => {
  test('soft deletes a same-tenant lead', async () => {
    const lead = await createLead(
      primaryOrganizationId,
      'Same Tenant Delete Lead',
      {
        assignedTo: primaryEmployee.id,
      },
    );

    const response = await sendRequest(
      'DELETE',
      `/api/v1/crm/leads/${lead.id}`,
      primaryManager,
    );

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();

    const persisted = await reloadLead(lead.id);

    expect(persisted.deletedAt).toBeInstanceOf(Date);
  });

  test('returns not found when deleting an already deleted lead', async () => {
    const lead = await createLead(
      primaryOrganizationId,
      'Already Deleted Lead',
      {
        assignedTo: primaryEmployee.id,
        deletedAt: new Date(),
      },
    );

    const response = await sendRequest(
      'DELETE',
      `/api/v1/crm/leads/${lead.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);
  });
});
