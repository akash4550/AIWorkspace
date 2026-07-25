import { randomUUID } from 'node:crypto';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';

import {
  ActivityType,
  EntityType,
  Role,
  User,
} from '@prisma/client';

import app from '../../../app';
import { prisma } from '../../../config/prisma';
import { closeRedisClient, getRedisClient } from '../../../core/redis/redis.client';
import { signAccessToken } from '../../../core/security/jwt';
import { allQueues } from '../../jobs/queues';
import { UserRepository } from '../user.repository';

interface JsonResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: {
    message: string;
  };
}

interface TestResponse {
  status: number;
  body: JsonResponse;
}

const ORIGINAL_PASSWORD = 'original-test-password-hash';

let server: Server;
let baseUrl: string;
let primaryOrganizationId: string;
let otherOrganizationId: string;
let superAdmin: User;
let administrator: User;
let manager: User;
let employee: User;
let protectedSuperAdmin: User;
let otherTenantEmployee: User;

const createUser = (
  organizationId: string,
  role: Role,
  label: string,
): Promise<User> => prisma.user.create({
  data: {
    organizationId,
    firstName: label,
    lastName: 'User',
    email: `${label.toLowerCase()}-${randomUUID()}@example.com`,
    password: ORIGINAL_PASSWORD,
    role,
    emailVerified: true,
  },
});

const tokenFor = (user: User): string => signAccessToken({
  userId: user.id,
  organizationId: user.organizationId,
});

const request = async (
  path: string,
  actor: User,
  body: Record<string, unknown>,
): Promise<TestResponse> => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${tokenFor(actor)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const responseText = await response.text();

  return {
    status: response.status,
    body: responseText
      ? JSON.parse(responseText) as JsonResponse
      : { success: response.ok },
  };
};

const deleteRequest = async (
  path: string,
  actor: User,
): Promise<TestResponse> => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${tokenFor(actor)}`,
    },
  });
  const responseText = await response.text();

  return {
    status: response.status,
    body: responseText
      ? JSON.parse(responseText) as JsonResponse
      : { success: response.ok },
  };
};

const reloadUser = (id: string): Promise<User> => prisma.user.findUniqueOrThrow({
  where: { id },
});

beforeAll(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

beforeEach(async () => {
  await prisma.activityLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const primaryOrganization = await prisma.organization.create({
    data: {
      name: 'User Security Primary Organization',
      slug: `user-security-primary-${randomUUID()}`,
    },
  });
  const otherOrganization = await prisma.organization.create({
    data: {
      name: 'User Security Other Organization',
      slug: `user-security-other-${randomUUID()}`,
    },
  });

  primaryOrganizationId = primaryOrganization.id;
  otherOrganizationId = otherOrganization.id;

  [
    superAdmin,
    administrator,
    manager,
    employee,
    protectedSuperAdmin,
    otherTenantEmployee,
  ] = await Promise.all([
    createUser(primaryOrganizationId, Role.SUPER_ADMIN, 'PrimarySuperAdmin'),
    createUser(primaryOrganizationId, Role.ADMIN, 'PrimaryAdmin'),
    createUser(primaryOrganizationId, Role.MANAGER, 'PrimaryManager'),
    createUser(primaryOrganizationId, Role.EMPLOYEE, 'PrimaryEmployee'),
    createUser(primaryOrganizationId, Role.SUPER_ADMIN, 'ProtectedSuperAdmin'),
    createUser(otherOrganizationId, Role.EMPLOYEE, 'OtherTenantEmployee'),
  ]);
});

afterAll(async () => {
  await prisma.activityLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  });
  await Promise.all(allQueues.map((queue) => queue.close()));
  await closeRedisClient();
  await prisma.$disconnect();
});

describe('user update command security', () => {
  test('rejects unknown profile fields before any permitted field is persisted', async () => {
    const response = await request(
      `/api/v1/users/${employee.id}`,
      administrator,
      {
        firstName: 'Changed',
        displayName: 'Injected Name',
      },
    );

    expect(response.status).toBe(400);
    expect((await reloadUser(employee.id)).firstName).toBe(employee.firstName);
  });

  test('does not allow organizationId to transfer a user', async () => {
    const response = await request(
      `/api/v1/users/${employee.id}`,
      administrator,
      {
        firstName: 'Changed',
        organizationId: otherOrganizationId,
      },
    );
    const persisted = await reloadUser(employee.id);

    expect(response.status).toBe(400);
    expect(persisted.organizationId).toBe(primaryOrganizationId);
    expect(persisted.firstName).toBe(employee.firstName);
  });

  test.each(['password', 'passwordHash'])(
    'rejects injected %s values without changing the stored password',
    async (field) => {
      const response = await request(
        `/api/v1/users/${employee.id}`,
        administrator,
        {
          firstName: 'Changed',
          [field]: 'attacker-controlled-pre-hashed-value',
        },
      );
      const persisted = await reloadUser(employee.id);

      expect(response.status).toBe(400);
      expect(persisted.password).toBe(ORIGINAL_PASSWORD);
      expect(persisted.firstName).toBe(employee.firstName);
    },
  );

  test('rejects deletedAt injection without changing deletion state', async () => {
    const response = await request(
      `/api/v1/users/${employee.id}`,
      administrator,
      {
        firstName: 'Changed',
        deletedAt: new Date().toISOString(),
      },
    );
    const persisted = await reloadUser(employee.id);

    expect(response.status).toBe(400);
    expect(persisted.deletedAt).toBeNull();
    expect(persisted.firstName).toBe(employee.firstName);
  });

  test('rejects Prisma organization and refresh-token relation objects', async () => {
    const refreshToken = await prisma.refreshToken.create({
      data: {
        tokenHash: `user-security-${randomUUID()}`,
        userId: employee.id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    const response = await request(
      `/api/v1/users/${employee.id}`,
      administrator,
      {
        firstName: 'Changed',
        organization: { connect: { id: otherOrganizationId } },
        refreshTokens: { deleteMany: {} },
      },
    );
    const persisted = await reloadUser(employee.id);

    expect(response.status).toBe(400);
    expect(persisted.organizationId).toBe(primaryOrganizationId);
    expect(persisted.firstName).toBe(employee.firstName);
    await expect(prisma.refreshToken.findUniqueOrThrow({
      where: { id: refreshToken.id },
    })).resolves.toMatchObject({ userId: employee.id });
  });

  test('allows a user to update only the supported self-profile fields', async () => {
    const response = await request('/api/v1/users/me', employee, {
      firstName: 'Updated',
      lastName: 'Profile',
      avatar: 'https://cdn.example.com/avatar.png',
    });
    const persisted = await reloadUser(employee.id);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: employee.id,
      firstName: 'Updated',
      lastName: 'Profile',
      avatar: 'https://cdn.example.com/avatar.png',
      organizationId: primaryOrganizationId,
      role: Role.EMPLOYEE,
    });
    expect(persisted).toMatchObject({
      firstName: 'Updated',
      lastName: 'Profile',
      avatar: 'https://cdn.example.com/avatar.png',
      organizationId: primaryOrganizationId,
      role: Role.EMPLOYEE,
    });
  });

  test('rejects role data from self-profile updates and forbids explicit self-role changes', async () => {
    const profileResponse = await request('/api/v1/users/me', employee, {
      firstName: 'Changed',
      role: Role.ADMIN,
    });
    const roleResponse = await request(
      `/api/v1/users/${administrator.id}/role`,
      administrator,
      { role: Role.SUPER_ADMIN },
    );

    expect(profileResponse.status).toBe(400);
    expect(roleResponse.status).toBe(403);
    expect((await reloadUser(employee.id)).role).toBe(Role.EMPLOYEE);
    expect((await reloadUser(employee.id)).firstName).toBe(employee.firstName);
    expect((await reloadUser(administrator.id)).role).toBe(Role.ADMIN);
  });

  test('forbids administrative self-deactivation and self-deletion', async () => {
    const statusResponse = await request(
      `/api/v1/users/${administrator.id}/status`,
      administrator,
      { isActive: false },
    );
    const deleteResponse = await deleteRequest(
      `/api/v1/users/${administrator.id}`,
      administrator,
    );
    const persisted = await reloadUser(administrator.id);

    expect(statusResponse.status).toBe(403);
    expect(deleteResponse.status).toBe(403);
    expect(persisted.isActive).toBe(true);
    expect(persisted.deletedAt).toBeNull();
  });

  test('allows an administrator to update a permitted field for a same-tenant user', async () => {
    const response = await request(
      `/api/v1/users/${employee.id}`,
      administrator,
      { firstName: 'Administrative' },
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: employee.id,
      firstName: 'Administrative',
      organizationId: primaryOrganizationId,
    });
    expect((await reloadUser(employee.id)).firstName).toBe('Administrative');
  });

  test('returns a safe rejection for an administrator targeting another tenant', async () => {
    const profileResponse = await request(
      `/api/v1/users/${otherTenantEmployee.id}`,
      administrator,
      { firstName: 'CrossTenantChange' },
    );
    const statusResponse = await request(
      `/api/v1/users/${otherTenantEmployee.id}/status`,
      administrator,
      { isActive: false },
    );
    const deleteResponse = await deleteRequest(
      `/api/v1/users/${otherTenantEmployee.id}`,
      administrator,
    );
    const persisted = await reloadUser(otherTenantEmployee.id);

    for (const response of [profileResponse, statusResponse, deleteResponse]) {
      expect(response.status).toBe(404);
      expect(response.body.error?.message).toMatch(/not found/i);
    }
    expect(persisted.firstName).toBe(otherTenantEmployee.firstName);
    expect(persisted.isActive).toBe(true);
    expect(persisted.deletedAt).toBeNull();
  });

  test('prevents an administrator from assigning SUPER_ADMIN', async () => {
    const response = await request(
      `/api/v1/users/${employee.id}/role`,
      administrator,
      { role: Role.SUPER_ADMIN },
    );

    expect(response.status).toBe(403);
    expect((await reloadUser(employee.id)).role).toBe(Role.EMPLOYEE);
    expect(await prisma.activityLog.count()).toBe(0);
  });

  test('prevents an administrator from modifying a SUPER_ADMIN', async () => {
    const profileResponse = await request(
      `/api/v1/users/${protectedSuperAdmin.id}`,
      administrator,
      { firstName: 'ForbiddenChange' },
    );
    const statusResponse = await request(
      `/api/v1/users/${protectedSuperAdmin.id}/status`,
      administrator,
      { isActive: false },
    );
    const roleResponse = await request(
      `/api/v1/users/${protectedSuperAdmin.id}/role`,
      administrator,
      { role: Role.EMPLOYEE },
    );
    const deleteResponse = await deleteRequest(
      `/api/v1/users/${protectedSuperAdmin.id}`,
      administrator,
    );
    const persisted = await reloadUser(protectedSuperAdmin.id);

    expect(profileResponse.status).toBe(403);
    expect(statusResponse.status).toBe(403);
    expect(roleResponse.status).toBe(403);
    expect(deleteResponse.status).toBe(403);
    expect(persisted.firstName).toBe(protectedSuperAdmin.firstName);
    expect(persisted.isActive).toBe(true);
    expect(persisted.role).toBe(Role.SUPER_ADMIN);
    expect(persisted.deletedAt).toBeNull();
  });

  test('prevents an administrator from reactivating a SUPER_ADMIN', async () => {
    await prisma.user.update({
      where: { id: protectedSuperAdmin.id },
      data: { isActive: false },
    });

    const response = await request(
      `/api/v1/users/${protectedSuperAdmin.id}/status`,
      administrator,
      { isActive: true },
    );

    expect(response.status).toBe(403);
    expect((await reloadUser(protectedSuperAdmin.id)).isActive).toBe(false);
  });

  test('allows a higher-authority actor to change role and records the audit details', async () => {
    const response = await request(
      `/api/v1/users/${employee.id}/role`,
      superAdmin,
      { role: Role.ADMIN },
    );
    const auditLog = await prisma.activityLog.findFirstOrThrow({
      where: {
        organizationId: primaryOrganizationId,
        userId: superAdmin.id,
        entityType: EntityType.USER,
        entityId: employee.id,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: employee.id,
      role: Role.ADMIN,
      organizationId: primaryOrganizationId,
    });
    expect((await reloadUser(employee.id)).role).toBe(Role.ADMIN);
    expect(auditLog).toMatchObject({
      organizationId: primaryOrganizationId,
      userId: superAdmin.id,
      type: ActivityType.UPDATE,
      entityType: EntityType.USER,
      entityId: employee.id,
      metadata: {
        previousRole: Role.EMPLOYEE,
        newRole: Role.ADMIN,
      },
    });
  });

  test('rejects invalid role values without mutating or auditing the target', async () => {
    const response = await request(
      `/api/v1/users/${employee.id}/role`,
      superAdmin,
      { role: 'OWNER' },
    );

    expect(response.status).toBe(400);
    expect((await reloadUser(employee.id)).role).toBe(Role.EMPLOYEE);
    expect(await prisma.activityLog.count()).toBe(0);
  });

  test('rechecks current target role and deletion state authoritatively', async () => {
    await prisma.user.update({
      where: { id: employee.id },
      data: { role: Role.SUPER_ADMIN },
    });
    await prisma.user.update({
      where: { id: manager.id },
      data: { deletedAt: new Date() },
    });

    const promotedTargetResponse = await request(
      `/api/v1/users/${employee.id}`,
      administrator,
      { firstName: 'ForbiddenChange' },
    );
    const deletedTargetResponse = await request(
      `/api/v1/users/${manager.id}`,
      administrator,
      { firstName: 'DeletedChange' },
    );

    expect(promotedTargetResponse.status).toBe(403);
    expect(deletedTargetResponse.status).toBe(404);
    expect((await reloadUser(employee.id)).firstName).toBe(employee.firstName);
    expect((await reloadUser(manager.id)).firstName).toBe(manager.firstName);
  });

  test('enforces the tenant boundary in the repository mutation predicate', async () => {
    const repository = new UserRepository();

    await expect(repository.updateProfile({
      id: otherTenantEmployee.id,
      organizationId: primaryOrganizationId,
      expectedRole: Role.EMPLOYEE,
    }, {
      firstName: 'RepositoryCrossTenantChange',
    })).rejects.toMatchObject({ code: 'P2025' });

    expect((await reloadUser(otherTenantEmployee.id)).firstName)
      .toBe(otherTenantEmployee.firstName);
  });

  test('returns only the safe user representation after mutation', async () => {
    const sensitiveRefreshToken = `sensitive-refresh-token-${randomUUID()}`;
    await prisma.refreshToken.create({
      data: {
        tokenHash: sensitiveRefreshToken,
        userId: employee.id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    const response = await request(
      `/api/v1/users/${employee.id}`,
      administrator,
      { lastName: 'SafeResponse' },
    );
    const data = response.body.data ?? {};
    const serialized = JSON.stringify(response.body);

    expect(response.status).toBe(200);
    expect(Object.keys(data).sort()).toEqual([
      'avatar',
      'createdAt',
      'email',
      'emailVerified',
      'firstName',
      'id',
      'isActive',
      'lastName',
      'organizationId',
      'role',
      'updatedAt',
    ]);
    expect(serialized).not.toContain(ORIGINAL_PASSWORD);
    expect(serialized).not.toContain(sensitiveRefreshToken);
    expect(data).not.toHaveProperty('password');
    expect(data).not.toHaveProperty('refreshTokens');
    expect(data).not.toHaveProperty('failedLoginAttempts');
    expect(data).not.toHaveProperty('lockedUntil');
    expect(data).not.toHaveProperty('passwordChangedAt');
    expect(data).not.toHaveProperty('deletedAt');
  });
});
