import { randomUUID } from 'node:crypto';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';

import {
  Client,
  Contact,
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
let otherTenantAdmin: User;

let primaryClient: Client;
let otherTenantClient: Client;

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
      password: 'contact-security-test-password-hash',
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

const createContact = async (
  organizationId: string,
  clientId: string,
  firstName: string,
  overrides: Partial<{
    lastName: string;
    email: string;
    deletedAt: Date;
  }> = {},
): Promise<Contact> => {
  return prisma.contact.create({
    data: {
      organizationId,
      clientId,
      firstName,
      lastName: overrides.lastName ?? 'Contact',
      email: overrides.email,
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

const reloadContact = async (
  id: string,
): Promise<Contact> => {
  return prisma.contact.findUniqueOrThrow({
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
        name: 'Contact Security Primary Organization',
        slug: `contact-security-primary-${randomUUID()}`,
      },
    });

  const otherOrganization =
    await prisma.organization.create({
      data: {
        name: 'Contact Security Other Organization',
        slug: `contact-security-other-${randomUUID()}`,
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

describe('contact route authentication and RBAC', () => {
  test('rejects unauthenticated contact requests', async () => {
    const response = await sendRequest(
      'GET',
      '/api/v1/crm/contacts',
    );

    expect(response.status).toBe(401);
  });

  test('allows an employee to read contacts', async () => {
    const contact = await createContact(
      primaryOrganizationId,
      primaryClient.id,
      'Readable',
    );

    const response = await sendRequest(
      'GET',
      `/api/v1/crm/contacts/${contact.id}`,
      primaryEmployee,
    );

    expect(response.status).toBe(200);
    expect(response.body?.data).toEqual(
      expect.objectContaining({
        id: contact.id,
        organizationId: primaryOrganizationId,
        clientId: primaryClient.id,
      }),
    );
  });

  test.each([
    {
      method: 'POST' as const,
      path: '/api/v1/crm/contacts',
      body: {
        clientId: randomUUID(),
        firstName: 'Forbidden',
        lastName: 'Creation',
      },
    },
    {
      method: 'PATCH' as const,
      path: `/api/v1/crm/contacts/${randomUUID()}`,
      body: {
        firstName: 'Forbidden',
      },
    },
    {
      method: 'DELETE' as const,
      path: `/api/v1/crm/contacts/${randomUUID()}`,
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

  test('allows a manager to create a contact for a same-tenant client', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/contacts',
      primaryManager,
      {
        clientId: primaryClient.id,
        firstName: 'Manager',
        lastName: 'Created',
        email: 'manager.created@example.com',
      },
    );

    expect(response.status).toBe(201);

    const created = response.body?.data as Contact;

    expect(created).toEqual(
      expect.objectContaining({
        organizationId: primaryOrganizationId,
        clientId: primaryClient.id,
        firstName: 'Manager',
        lastName: 'Created',
        email: 'manager.created@example.com',
      }),
    );

    const persisted = await reloadContact(created.id);

    expect(persisted.organizationId).toBe(
      primaryOrganizationId,
    );
    expect(persisted.clientId).toBe(primaryClient.id);
  });
});

describe('contact request validation and mass-assignment protection', () => {
  test('rejects organizationId injection during creation', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/contacts',
      primaryAdmin,
      {
        clientId: primaryClient.id,
        firstName: 'Injected',
        lastName: 'Organization',
        organizationId: otherOrganizationId,
      },
    );

    expect(response.status).toBe(400);

    const persisted = await prisma.contact.findFirst({
      where: {
        firstName: 'Injected',
        lastName: 'Organization',
      },
    });

    expect(persisted).toBeNull();
  });

  test('rejects protected update fields without persisting valid changes', async () => {
    const contact = await createContact(
      primaryOrganizationId,
      primaryClient.id,
      'Original',
      {
        lastName: 'Contact',
      },
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/contacts/${contact.id}`,
      primaryAdmin,
      {
        firstName: 'AttackerModified',
        deletedAt: new Date().toISOString(),
      },
    );

    expect(response.status).toBe(400);

    const persisted = await reloadContact(contact.id);

    expect(persisted.firstName).toBe('Original');
    expect(persisted.deletedAt).toBeNull();
  });

  test('rejects attempts to change the parent client', async () => {
    const contact = await createContact(
      primaryOrganizationId,
      primaryClient.id,
      'Parent',
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/contacts/${contact.id}`,
      primaryAdmin,
      {
        clientId: otherTenantClient.id,
      },
    );

    expect(response.status).toBe(400);

    const persisted = await reloadContact(contact.id);

    expect(persisted.clientId).toBe(primaryClient.id);
  });

  test('rejects an invalid contact UUID', async () => {
    const response = await sendRequest(
      'GET',
      '/api/v1/crm/contacts/not-a-uuid',
      primaryAdmin,
    );

    expect(response.status).toBe(400);
  });

  test('rejects an empty update body', async () => {
    const contact = await createContact(
      primaryOrganizationId,
      primaryClient.id,
      'EmptyUpdate',
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/contacts/${contact.id}`,
      primaryAdmin,
      {},
    );

    expect(response.status).toBe(400);
  });
});

describe('contact client tenant validation', () => {
  test('rejects another tenant client during creation', async () => {
    const response = await sendRequest(
      'POST',
      '/api/v1/crm/contacts',
      primaryAdmin,
      {
        clientId: otherTenantClient.id,
        firstName: 'CrossTenant',
        lastName: 'Client',
      },
    );

    expect(response.status).toBe(400);

    const persisted = await prisma.contact.findFirst({
      where: {
        firstName: 'CrossTenant',
        lastName: 'Client',
      },
    });

    expect(persisted).toBeNull();
  });

  test('rejects a deleted same-tenant client during creation', async () => {
    const deletedClient = await createClient(
      primaryOrganizationId,
      primaryAdmin.id,
      'Deleted Client',
      new Date(),
    );

    const response = await sendRequest(
      'POST',
      '/api/v1/crm/contacts',
      primaryAdmin,
      {
        clientId: deletedClient.id,
        firstName: 'DeletedParent',
        lastName: 'Contact',
      },
    );

    expect(response.status).toBe(400);

    const persisted = await prisma.contact.findFirst({
      where: {
        firstName: 'DeletedParent',
        lastName: 'Contact',
      },
    });

    expect(persisted).toBeNull();
  });
});

describe('contact tenant isolation', () => {
  test('does not expose another tenant contact by ID', async () => {
    const otherContact = await createContact(
      otherOrganizationId,
      otherTenantClient.id,
      'OtherTenant',
    );

    const response = await sendRequest(
      'GET',
      `/api/v1/crm/contacts/${otherContact.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);
  });

  test('does not update another tenant contact', async () => {
    const otherContact = await createContact(
      otherOrganizationId,
      otherTenantClient.id,
      'Protected',
    );

    const response = await sendRequest(
      'PATCH',
      `/api/v1/crm/contacts/${otherContact.id}`,
      primaryAdmin,
      {
        firstName: 'AttackerControlled',
      },
    );

    expect(response.status).toBe(404);

    const persisted = await reloadContact(otherContact.id);

    expect(persisted.firstName).toBe('Protected');
    expect(persisted.organizationId).toBe(
      otherOrganizationId,
    );
  });

  test('does not delete another tenant contact', async () => {
    const otherContact = await createContact(
      otherOrganizationId,
      otherTenantClient.id,
      'ProtectedDelete',
    );

    const response = await sendRequest(
      'DELETE',
      `/api/v1/crm/contacts/${otherContact.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);

    const persisted = await reloadContact(otherContact.id);

    expect(persisted.deletedAt).toBeNull();
  });

  test('lists only active contacts from the authenticated tenant', async () => {
    const visibleContact = await createContact(
      primaryOrganizationId,
      primaryClient.id,
      'Visible',
    );

    await createContact(
      primaryOrganizationId,
      primaryClient.id,
      'Deleted',
      {
        deletedAt: new Date(),
      },
    );

    const otherContact = await createContact(
      otherOrganizationId,
      otherTenantClient.id,
      'Invisible',
    );

    const response = await sendRequest(
      'GET',
      '/api/v1/crm/contacts?page=1&limit=100',
      primaryEmployee,
    );

    expect(response.status).toBe(200);

    const data = response.body?.data as Contact[];
    const ids = data.map((contact) => contact.id);

    expect(ids).toContain(visibleContact.id);
    expect(ids).not.toContain(otherContact.id);
    expect(data).toHaveLength(1);
    expect(response.body?.total).toBe(1);
  });
});

describe('contact soft deletion', () => {
  test('soft deletes a same-tenant contact', async () => {
    const contact = await createContact(
      primaryOrganizationId,
      primaryClient.id,
      'SameTenantDelete',
    );

    const response = await sendRequest(
      'DELETE',
      `/api/v1/crm/contacts/${contact.id}`,
      primaryManager,
    );

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();

    const persisted = await reloadContact(contact.id);

    expect(persisted.deletedAt).toBeInstanceOf(Date);
  });

  test('returns not found when deleting an already deleted contact', async () => {
    const contact = await createContact(
      primaryOrganizationId,
      primaryClient.id,
      'AlreadyDeleted',
      {
        deletedAt: new Date(),
      },
    );

    const response = await sendRequest(
      'DELETE',
      `/api/v1/crm/contacts/${contact.id}`,
      primaryAdmin,
    );

    expect(response.status).toBe(404);
  });
});