import { randomUUID } from 'node:crypto';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';

import {
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

interface JsonResponse {
  success?: boolean;
  data?: unknown;
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
let primaryAssignee: User;
let inactivePrimaryUser: User;
let deletedPrimaryUser: User;
let otherTenantAdmin: User;
let otherTenantAssignee: User;

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
      password: 'task-security-test-password-hash',
      role,
      emailVerified: true,
      isActive: overrides.isActive ?? true,
      deletedAt: overrides.deletedAt,
    },
  });
};

const createProject = async ({
  organizationId,
  ownerId,
  name,
  deletedAt,
}: {
  organizationId: string;
  ownerId: string;
  name: string;
  deletedAt?: Date;
}): Promise<Project> => {
  return prisma.project.create({
    data: {
      organizationId,
      ownerId,
      name,
      key: `TASK-${randomUUID()}`,
      description: `${name} description`,
      deletedAt,
    },
  });
};

const createTask = async ({
  organizationId,
  projectId,
  reporterId,
  title,
  parentTaskId,
  assigneeId,
  deletedAt,
}: {
  organizationId: string;
  projectId: string;
  reporterId: string;
  title: string;
  parentTaskId?: string;
  assigneeId?: string;
  deletedAt?: Date;
}): Promise<Task> => {
  return prisma.task.create({
    data: {
      organizationId,
      projectId,
      reporterId,
      title,
      description: `${title} description`,
      parentTaskId,
      assigneeId,
      position: 1,
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
  method: 'POST' | 'PATCH',
  path: string,
  actor: User,
  body: Record<string, unknown>,
): Promise<TestResponse> => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
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
      : null,
  };
};

const reloadTask = async (id: string): Promise<Task> => {
  return prisma.task.findUniqueOrThrow({
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
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();

  await prisma.activityLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const primaryOrganization =
    await prisma.organization.create({
      data: {
        name: 'Task Security Primary Organization',
        slug: `task-security-primary-${randomUUID()}`,
      },
    });

  const otherOrganization =
    await prisma.organization.create({
      data: {
        name: 'Task Security Other Organization',
        slug: `task-security-other-${randomUUID()}`,
      },
    });

  primaryOrganizationId = primaryOrganization.id;
  otherOrganizationId = otherOrganization.id;

  [
    primaryAdmin,
    primaryAssignee,
    inactivePrimaryUser,
    deletedPrimaryUser,
    otherTenantAdmin,
    otherTenantAssignee,
  ] = await Promise.all([
    createUser(
      primaryOrganizationId,
      Role.ADMIN,
      'PrimaryAdmin',
    ),
    createUser(
      primaryOrganizationId,
      Role.EMPLOYEE,
      'PrimaryAssignee',
    ),
    createUser(
      primaryOrganizationId,
      Role.EMPLOYEE,
      'InactivePrimaryUser',
      { isActive: false },
    ),
    createUser(
      primaryOrganizationId,
      Role.EMPLOYEE,
      'DeletedPrimaryUser',
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
      'OtherTenantAssignee',
    ),
  ]);
});


afterAll(async () => {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();

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

describe('task tenant reference boundaries', () => {
  test(
    'creates a task with valid same-tenant references',
    async () => {
      const project = await createProject({
        organizationId: primaryOrganizationId,
        ownerId: primaryAdmin.id,
        name: 'Primary Project',
      });

      const parentTask = await createTask({
        organizationId: primaryOrganizationId,
        projectId: project.id,
        reporterId: primaryAdmin.id,
        title: 'Primary Parent Task',
      });

      const title = `Valid Task ${randomUUID()}`;

      const response = await sendRequest(
        'POST',
        '/api/v1/tasks',
        primaryAdmin,
        {
          projectId: project.id,
          parentTaskId: parentTask.id,
          assigneeId: primaryAssignee.id,
          title,
        },
      );

      expect(response.status).toBe(201);

      const createdTask =
        await prisma.task.findFirstOrThrow({
          where: {
            organizationId: primaryOrganizationId,
            title,
          },
        });

      expect(createdTask.projectId).toBe(project.id);
      expect(createdTask.parentTaskId).toBe(parentTask.id);
      expect(createdTask.assigneeId).toBe(primaryAssignee.id);
    },
  );

  test(
    'rejects a cross-tenant project without creating a task',
    async () => {
      const otherProject = await createProject({
        organizationId: otherOrganizationId,
        ownerId: otherTenantAdmin.id,
        name: 'Other Tenant Project',
      });

      const title = `Rejected Task ${randomUUID()}`;

      const response = await sendRequest(
        'POST',
        '/api/v1/tasks',
        primaryAdmin,
        {
          projectId: otherProject.id,
          title,
        },
      );

      expect(response.status).toBe(404);
      expect(response.body?.error?.message).toBe(
        'One or more task references were not found',
      );

      const rejectedTask = await prisma.task.findFirst({
        where: {
          title,
        },
      });

      expect(rejectedTask).toBeNull();
    },
  );
    test(
    'rejects a deleted project without creating a task',
    async () => {
      const deletedProject = await createProject({
        organizationId: primaryOrganizationId,
        ownerId: primaryAdmin.id,
        name: 'Deleted Primary Project',
        deletedAt: new Date(),
      });

      const title = `Deleted Project Task ${randomUUID()}`;

      const response = await sendRequest(
        'POST',
        '/api/v1/tasks',
        primaryAdmin,
        {
          projectId: deletedProject.id,
          title,
        },
      );

      expect(response.status).toBe(404);
      expect(response.body?.error?.message).toBe(
        'One or more task references were not found',
      );

      const rejectedTask = await prisma.task.findFirst({
        where: {
          title,
        },
      });

      expect(rejectedTask).toBeNull();
    },
  );
    test(
    'rejects a cross-tenant parent task without creating a task',
    async () => {
      const primaryProject = await createProject({
        organizationId: primaryOrganizationId,
        ownerId: primaryAdmin.id,
        name: 'Primary Parent Project',
      });

      const otherProject = await createProject({
        organizationId: otherOrganizationId,
        ownerId: otherTenantAdmin.id,
        name: 'Other Parent Project',
      });

      const otherParentTask = await createTask({
        organizationId: otherOrganizationId,
        projectId: otherProject.id,
        reporterId: otherTenantAdmin.id,
        title: 'Other Tenant Parent Task',
      });

      const title = `Cross Tenant Parent ${randomUUID()}`;

      const response = await sendRequest(
        'POST',
        '/api/v1/tasks',
        primaryAdmin,
        {
          projectId: primaryProject.id,
          parentTaskId: otherParentTask.id,
          title,
        },
      );

      expect(response.status).toBe(404);
      expect(response.body?.error?.message).toBe(
        'One or more task references were not found',
      );

      const rejectedTask = await prisma.task.findFirst({
        where: {
          title,
        },
      });

      expect(rejectedTask).toBeNull();
    },
  );
    test(
    'rejects a parent task from a different project',
    async () => {
      const selectedProject = await createProject({
        organizationId: primaryOrganizationId,
        ownerId: primaryAdmin.id,
        name: 'Selected Project',
      });

      const parentProject = await createProject({
        organizationId: primaryOrganizationId,
        ownerId: primaryAdmin.id,
        name: 'Parent Project',
      });

      const parentTask = await createTask({
        organizationId: primaryOrganizationId,
        projectId: parentProject.id,
        reporterId: primaryAdmin.id,
        title: 'Different Project Parent Task',
      });

      const title = `Different Project Parent ${randomUUID()}`;

      const response = await sendRequest(
        'POST',
        '/api/v1/tasks',
        primaryAdmin,
        {
          projectId: selectedProject.id,
          parentTaskId: parentTask.id,
          title,
        },
      );

      expect(response.status).toBe(404);
      expect(response.body?.error?.message).toBe(
        'One or more task references were not found',
      );

      const rejectedTask = await prisma.task.findFirst({
        where: {
          title,
        },
      });

      expect(rejectedTask).toBeNull();
    },
  );
    test(
    'rejects a cross-tenant assignee without creating a task',
    async () => {
      const project = await createProject({
        organizationId: primaryOrganizationId,
        ownerId: primaryAdmin.id,
        name: 'Primary Assignee Project',
      });

      const title = `Cross Tenant Assignee ${randomUUID()}`;

      const response = await sendRequest(
        'POST',
        '/api/v1/tasks',
        primaryAdmin,
        {
          projectId: project.id,
          assigneeId: otherTenantAssignee.id,
          title,
        },
      );

      expect(response.status).toBe(404);
      expect(response.body?.error?.message).toBe(
        'One or more task references were not found',
      );

      const rejectedTask = await prisma.task.findFirst({
        where: {
          title,
        },
      });

      expect(rejectedTask).toBeNull();
    },
  );
    test(
    'rejects an inactive assignee without creating a task',
    async () => {
      const project = await createProject({
        organizationId: primaryOrganizationId,
        ownerId: primaryAdmin.id,
        name: 'Inactive Assignee Project',
      });

      const title = `Inactive Assignee ${randomUUID()}`;

      const response = await sendRequest(
        'POST',
        '/api/v1/tasks',
        primaryAdmin,
        {
          projectId: project.id,
          assigneeId: inactivePrimaryUser.id,
          title,
        },
      );

      expect(response.status).toBe(404);
      expect(response.body?.error?.message).toBe(
        'One or more task references were not found',
      );

      const rejectedTask = await prisma.task.findFirst({
        where: {
          title,
        },
      });

      expect(rejectedTask).toBeNull();
    },
  );
    test(
    'rejects a deleted assignee without creating a task',
    async () => {
      const project = await createProject({
        organizationId: primaryOrganizationId,
        ownerId: primaryAdmin.id,
        name: 'Deleted Assignee Project',
      });

      const title = `Deleted Assignee ${randomUUID()}`;

      const response = await sendRequest(
        'POST',
        '/api/v1/tasks',
        primaryAdmin,
        {
          projectId: project.id,
          assigneeId: deletedPrimaryUser.id,
          title,
        },
      );

      expect(response.status).toBe(404);
      expect(response.body?.error?.message).toBe(
        'One or more task references were not found',
      );

      const rejectedTask = await prisma.task.findFirst({
        where: {
          title,
        },
      });

      expect(rejectedTask).toBeNull();
    },
  );
    test(
    'rejects a cross-tenant assignee update without mutation',
    async () => {
      const project = await createProject({
        organizationId: primaryOrganizationId,
        ownerId: primaryAdmin.id,
        name: 'Update Assignee Project',
      });

      const task = await createTask({
        organizationId: primaryOrganizationId,
        projectId: project.id,
        reporterId: primaryAdmin.id,
        assigneeId: primaryAssignee.id,
        title: 'Update Assignee Task',
      });

      const response = await sendRequest(
        'PATCH',
        `/api/v1/tasks/${task.id}`,
        primaryAdmin,
        {
          assigneeId: otherTenantAssignee.id,
        },
      );

      expect(response.status).toBe(404);
      expect(response.body?.error?.message).toBe(
        'One or more task references were not found',
      );

      const unchangedTask = await reloadTask(task.id);

      expect(unchangedTask.assigneeId).toBe(
        primaryAssignee.id,
      );
    },
  );
    test(
    'rejects a cross-tenant assignee on the assign route without mutation',
    async () => {
      const project = await createProject({
        organizationId: primaryOrganizationId,
        ownerId: primaryAdmin.id,
        name: 'Assign Route Project',
      });

      const task = await createTask({
        organizationId: primaryOrganizationId,
        projectId: project.id,
        reporterId: primaryAdmin.id,
        assigneeId: primaryAssignee.id,
        title: 'Assign Route Task',
      });

      const response = await sendRequest(
        'PATCH',
        `/api/v1/tasks/${task.id}/assign`,
        primaryAdmin,
        {
          assigneeId: otherTenantAssignee.id,
        },
      );

      expect(response.status).toBe(404);
      expect(response.body?.error?.message).toBe(
        'One or more task references were not found',
      );

      const unchangedTask = await reloadTask(task.id);

      expect(unchangedTask.assigneeId).toBe(
        primaryAssignee.id,
      );
    },
  );
    test(
    'rejects unknown task fields without creating a task',
    async () => {
      const project = await createProject({
        organizationId: primaryOrganizationId,
        ownerId: primaryAdmin.id,
        name: 'Strict Validation Project',
      });

      const title = `Unknown Field Task ${randomUUID()}`;

      const response = await sendRequest(
        'POST',
        '/api/v1/tasks',
        primaryAdmin,
        {
          projectId: project.id,
          title,
          organizationId: otherOrganizationId,
        },
      );

      expect(response.status).toBe(400);

      const rejectedTask = await prisma.task.findFirst({
        where: {
          title,
        },
      });

      expect(rejectedTask).toBeNull();
    },
  );
    test(
    'rejects malformed assignment input without mutation',
    async () => {
      const project = await createProject({
        organizationId: primaryOrganizationId,
        ownerId: primaryAdmin.id,
        name: 'Malformed Assignment Project',
      });

      const task = await createTask({
        organizationId: primaryOrganizationId,
        projectId: project.id,
        reporterId: primaryAdmin.id,
        assigneeId: primaryAssignee.id,
        title: 'Malformed Assignment Task',
      });

      const response = await sendRequest(
        'PATCH',
        `/api/v1/tasks/${task.id}/assign`,
        primaryAdmin,
        {
          assigneeId: 'not-a-valid-uuid',
        },
      );

      expect(response.status).toBe(400);

      const unchangedTask = await reloadTask(task.id);

      expect(unchangedTask.assigneeId).toBe(
        primaryAssignee.id,
      );
    },
  );
});