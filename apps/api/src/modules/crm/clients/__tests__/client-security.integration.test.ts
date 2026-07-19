import { randomUUID } from 'node:crypto';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';

import {
  Client,
  ClientStatus,
  Role,
  User,
} from '@prisma/client';

import app from '../../../../app';
import { prisma } from '../../../../config/prisma';
import { getRedisClient } from '../../../../core/redis/redis.client';
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
      password: 'client-security-test-password-hash',
      role,
      emailVerified: true,
      isActive: overrides.isActive ?? true,
      deletedAt: overrides.deletedAt,
    },
  });
};

const createClient = async (
  organizationId: string,
  ownerId: string,
  name: string,
  overrides: Partial<{
    status: ClientStatus;
    deletedAt: Date;
  }> = {},
): Promise<Client> => {
  return prisma.client.create({
    data: {
      organizationId,
      ownerId,
      name: `${name}-${randomUUID()}`,
      status: overrides.status ?? ClientStatus.ACTIVE,
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
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const responseText = await response.text();

  return {
    status: response.status,
    body: responseText
      ? JSON.parse(responseText) as JsonResponse
      : null,
  };
};

const reloadClient = async (id: string): Promise<Client> => {
  return prisma.client.findUniqueOrThrow({
    where: { id },
  });
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
  /*
   * Delete dependent CRM records first if these tables are used by another
   * test in the same database.
   */
  await prisma.cRMActivity.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.client.deleteMany();

  await prisma.activityLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const primaryOrganization = await prisma.organization.create({
    data: {
      name: 'Client Security Primary Organization',
      slug: `client-security-primary-${randomUUID()}`,
    },
  });

  const otherOrganization = await prisma.organization.create({
    data: {
      name: 'Client Security Other Organization',
      slug: `client-security-other-${randomUUID()}`,
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
      { isActive: false },
    ),
    createUser(
      primaryOrganizationId,
      Role.EMPLOYEE,
      'DeletedPrimaryEmployee',
      { deletedAt: new Date() },
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
  await prisma.cRMActivity.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.client.deleteMany();

  await prisma.activityLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

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

  await Promise.all(allQueues.map((queue) => queue.close()));
  await getRedisClient().quit();
  await prisma.$disconnect();
});

describe('client route authentication and RBAC', () => {
  test('rejects unauthenticated client requests', async () => {
    const response = await sendRequest(
      'GET',
      '/api/v1/crm/clients',
    );

    expect(response.status).toBe(401);
  });

  test('allows an employee to read clients', async () => {
    const client = await createClient(
      primaryOrganizationId,
      primaryAdmin.id,
      'Readable Client',
    );

    const response = await sendRequest(
      'GET',
      `/api/v1/crm/clients/${client.id}`,
      primaryEmployee,
    );

    expect(response.status).toBe(200);
    expect(response.body?.data).toEqual(
      expect.objectContaining({
        id: client.id,
        organizationId: primaryOrganizationId,
      }),
    );
  });

  test.each([
    {
      method: 'POST' as const,
      path: '/api/v1/crm/clients',
      body: { name: 'Forbidden Create' },
    },
    {
      method: 'PATCH' as const,
      path: `/api/v1/crm/clients/${randomUUID()}`,
      body: { name: 'Forbidden Update' },
    },
    {
      method: 'DELETE' as const,
      path: `/api/v1/crm/clients/${randomUUID()}`,
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

  test('allows a manager to create a client', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/clients',
      primaryManager,
      {
        name: 'Manager Created Client',
      },
    );

    expect(response.status).toBe(201);

    const created = response.body?.data as Client;

    expect(created).toEqual(
      expect.objectContaining({
        name: 'Manager Created Client',
        organizationId: primaryOrganizationId,
        ownerId: primaryManager.id,
      }),
    );

    const persisted = await reloadClient(created.id);

    expect(persisted.organizationId).toBe(primaryOrganizationId);
    expect(persisted.ownerId).toBe(primaryManager.id);
  });
});

describe('client request validation and mass-assignment protection', () => {
  test('rejects organizationId injection during creation', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/clients',
      primaryAdmin,
      {
        name: 'Injected Organization Client',
        organizationId: otherOrganizationId,
      },
    );

    expect(response.status).toBe(400);

    const persisted = await prisma.client.findFirst({
      where: {
        name: 'Injected Organization Client',
      },
    });

    expect(persisted).toBeNull();
  });

  test('rejects an unknown update field before valid changes are persisted', async () => {
    const client = await createClient(
      primaryOrganizationId,
      primaryAdmin.id,
      'Original Client',
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/clients/${client.id}`,
      primaryAdmin,
      {
        name: 'Changed Client Name',
        deletedAt: new Date().toISOString(),
      },
    );

    expect(response.status).toBe(400);

    const persisted = await reloadClient(client.id);

    expect(persisted.name).toBe(client.name);
    expect(persisted.deletedAt).toBeNull();
  });

  test('rejects an invalid client UUID', async () => {
    const response = await sendRequest(
      'GET',
      '/api/v1/crm/clients/not-a-uuid',
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });

  test('rejects an empty update body', async () => {
    const client = await createClient(
      primaryOrganizationId,
      primaryAdmin.id,
      'Empty Update Client',
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/clients/${client.id}`,
      primaryAdmin,
      {},
    );

    expect(response.status).toBe(400);
  });
});

describe('client owner tenant validation', () => {
  test('rejects another tenant user as the owner during creation', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/clients',
      primaryAdmin,
      {
        name: 'Cross Tenant Owner Client',
        ownerId: otherTenantEmployee.id,
      },
    );

    expect(response.status).toBe(400);

    const persisted = await prisma.client.findFirst({
      where: {
        name: 'Cross Tenant Owner Client',
      },
    });

    expect(persisted).toBeNull();
  });

  test.each([
    ['inactive', () => inactivePrimaryUser],
    ['deleted', () => deletedPrimaryUser],
  ])(
    'rejects a %s same-tenant user as the owner',
    async (_label, resolveOwner) => {
      const owner = resolveOwner();

      const response = await sendRequest(
        'POST',
        '/api/v1/crm/clients',
        primaryAdmin,
        {
          name: `Invalid Owner Client ${randomUUID()}`,
          ownerId: owner.id,
        },
      );

      expect(response.status).toBe(400);
    },
  );

  test('rejects reassignment to another tenant user without changing the client', async () => {
    const client = await createClient(
      primaryOrganizationId,
      primaryAdmin.id,
      'Owner Reassignment Client',
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/clients/${client.id}`,
      primaryAdmin,
      {
        ownerId: otherTenantEmployee.id,
      },
    );

    expect(response.status).toBe(400);

    const persisted = await reloadClient(client.id);

    expect(persisted.ownerId).toBe(primaryAdmin.id);
  });
});

describe('client tenant isolation', () => {
  test('does not expose another tenant client by ID', async () => {
    const otherTenantClient = await createClient(
      otherOrganizationId,
      otherTenantAdmin.id,
      'Other Tenant Client',
    );

    const response = await sendRequest(
      'GET',
      `/api/v1/crm/clients/${otherTenantClient.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);
  });

  test('does not update another tenant client', async () => {
    const otherTenantClient = await createClient(
      otherOrganizationId,
      otherTenantAdmin.id,
      'Protected Other Tenant Client',
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/clients/${otherTenantClient.id}`,
      primaryAdmin,
      {
        name: 'Attacker Controlled Name',
      },
    );

    expect(response.status).toBe(404);

    const persisted = await reloadClient(otherTenantClient.id);

    expect(persisted.name).toBe(otherTenantClient.name);
    expect(persisted.organizationId).toBe(otherOrganizationId);
  });

  test('does not delete another tenant client', async () => {
    const otherTenantClient = await createClient(
      otherOrganizationId,
      otherTenantAdmin.id,
      'Protected Delete Client',
    );

    const response = await sendRequest(
      'DELETE',
      `/api/v1/crm/clients/${otherTenantClient.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);

    const persisted = await reloadClient(otherTenantClient.id);

    expect(persisted.deletedAt).toBeNull();
  });

  test('lists only active clients from the authenticated tenant', async () => {
    const visibleClient = await createClient(
      primaryOrganizationId,
      primaryAdmin.id,
      'Visible Primary Client',
    );

    await createClient(
      primaryOrganizationId,
      primaryAdmin.id,
      'Deleted Primary Client',
      {
        deletedAt: new Date(),
      },
    );

    const otherTenantClient = await createClient(
      otherOrganizationId,
      otherTenantAdmin.id,
      'Invisible Other Tenant Client',
    );

    const response = await sendRequest(
      'GET',
      '/api/v1/crm/clients?page=1&limit=100',
      primaryEmployee,
    );

    expect(response.status).toBe(200);

    const data = response.body?.data as Client[];

    expect(data.map((client) => client.id)).toContain(visibleClient.id);
    expect(data.map((client) => client.id)).not.toContain(
      otherTenantClient.id,
    );

    expect(data).toHaveLength(1);
    expect(response.body?.total).toBe(1);
  });
});

describe('client soft deletion', () => {
  test('soft deletes a same-tenant client', async () => {
    const client = await createClient(
      primaryOrganizationId,
      primaryAdmin.id,
      'Same Tenant Delete Client',
    );

    const response = await sendRequest(
      'DELETE',
      `/api/v1/crm/clients/${client.id}`,
      primaryManager,
    );

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();

    const persisted = await reloadClient(client.id);

    expect(persisted.deletedAt).toBeInstanceOf(Date);
  });

  test('returns not found when deleting an already deleted client', async () => {
    const client = await createClient(
      primaryOrganizationId,
      primaryAdmin.id,
      'Already Deleted Client',
      {
        deletedAt: new Date(),
      },
    );

    const response = await sendRequest(
      'DELETE',
      `/api/v1/crm/clients/${client.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);
  });
});