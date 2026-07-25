import { randomUUID } from 'node:crypto';
import { createServer, Server as HttpServer } from 'node:http';
import { AddressInfo } from 'node:net';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { io as createClient, Socket as ClientSocket } from 'socket.io-client';

import { env } from '../../../config/env';
import { prisma } from '../../../config/prisma';
import { logger } from '../../../core/utils/logger';
import { signAccessToken, signRefreshToken } from '../../../core/security/jwt';
import {
  getIO,
  initializeSocket,
  organizationRoom,
  SocketPrincipal,
  userRoom,
} from '../socket';

const AUTHENTICATION_ERROR = 'Authentication error';
let httpServer: HttpServer;
let socketUrl: string;
let organizationId: string;
let userId: string;

const signAccessLikeToken = ({
  subject = userId,
  tokenOrganizationId = organizationId,
  audience = env.JWT_ACCESS_AUDIENCE,
  issuer = env.JWT_ISSUER,
  type = 'access',
  algorithm = 'HS256',
  expiresIn = '15m',
  role,
}: {
  subject?: string;
  tokenOrganizationId?: string;
  audience?: string;
  issuer?: string;
  type?: string;
  algorithm?: 'HS256' | 'HS384';
  expiresIn?: SignOptions['expiresIn'];
  role?: Role;
} = {}): string => jwt.sign(
  {
    type,
    organizationId: tokenOrganizationId,
    jti: randomUUID(),
    ...(role ? { role } : {}),
  },
  env.JWT_ACCESS_SECRET,
  { algorithm, audience, issuer, subject, expiresIn },
);

const connect = (
  token?: string,
  extraAuth: Record<string, unknown> = {},
): Promise<ClientSocket> => new Promise((resolve, reject) => {
  const client = createClient(socketUrl, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    auth: { ...(token === undefined ? {} : { token }), ...extraAuth },
  });
  const timer = setTimeout(() => reject(new Error('Socket connection timed out')), 5_000);
  client.once('connect', () => {
    clearTimeout(timer);
    resolve(client);
  });
  client.once('connect_error', (error) => {
    clearTimeout(timer);
    client.close();
    reject(error);
  });
});

const rejectConnection = async (
  token?: string,
  extraAuth: Record<string, unknown> = {},
): Promise<Error> => {
  try {
    const client = await connect(token, extraAuth);
    client.close();
    throw new Error('Expected the connection to be rejected');
  } catch (error) {
    return error as Error;
  }
};

const serverSocketFor = (client: ClientSocket) => {
  const socket = getIO().sockets.sockets.get(client.id!);
  if (!socket) throw new Error('Server socket was not found');
  return socket;
};

beforeAll(async () => {
  httpServer = createServer();
  initializeSocket(httpServer);
  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  socketUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
});

beforeEach(async () => {
  getIO().disconnectSockets(true);
  await prisma.refreshToken.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const organization = await prisma.organization.create({
    data: {
      name: 'Realtime Authentication Organization',
      slug: `realtime-auth-${randomUUID()}`,
    },
  });
  organizationId = organization.id;
  const user = await prisma.user.create({
    data: {
      organizationId,
      firstName: 'Realtime',
      lastName: 'User',
      email: `realtime-${randomUUID()}@example.com`,
      password: 'not-used-by-socket-tests',
      role: Role.ADMIN,
    },
  });
  userId = user.id;
});

afterAll(async () => {
  getIO().disconnectSockets(true);
  await new Promise<void>((resolve) => getIO().close(() => resolve()));
  await prisma.refreshToken.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.$disconnect();
});

describe('canonical Socket.IO authentication', () => {
  test('rejects a connection without a token with a stable generic error', async () => {
    await expect(rejectConnection()).resolves.toMatchObject({ message: AUTHENTICATION_ERROR });
  });

  test('establishes a connection with a valid canonical access token', async () => {
    const client = await connect(signAccessToken({ userId, organizationId }));
    expect(client.connected).toBe(true);
    client.close();
  });

  test('rejects a correctly signed refresh token', async () => {
    const error = await rejectConnection(signRefreshToken({ userId, organizationId }));
    expect(error.message).toBe(AUTHENTICATION_ERROR);
  });

  test.each([
    ['wrong audience', () => signAccessLikeToken({ audience: 'wrong-audience' })],
    ['wrong issuer', () => signAccessLikeToken({ issuer: 'wrong-issuer' })],
    ['wrong type', () => signAccessLikeToken({ type: 'refresh' })],
    ['unexpected algorithm', () => signAccessLikeToken({ algorithm: 'HS384' })],
    ['expired token', () => signAccessLikeToken({ expiresIn: '-1s' })],
  ])('rejects a token with %s', async (_label, createToken) => {
    expect((await rejectConnection(createToken())).message).toBe(AUTHENTICATION_ERROR);
  });

  test('rejects a token for a nonexistent user', async () => {
    expect((await rejectConnection(signAccessLikeToken({ subject: randomUUID() }))).message)
      .toBe(AUTHENTICATION_ERROR);
  });

  test.each([
    ['inactive', { isActive: false }],
    ['soft-deleted', { deletedAt: new Date() }],
  ])('rejects an %s user', async (_label, data) => {
    await prisma.user.update({ where: { id: userId }, data });
    expect((await rejectConnection(signAccessLikeToken())).message).toBe(AUTHENTICATION_ERROR);
  });

  test('rejects a token for a nonexistent organization', async () => {
    expect((await rejectConnection(signAccessLikeToken({ tokenOrganizationId: randomUUID() }))).message)
      .toBe(AUTHENTICATION_ERROR);
  });

  test.each([
    ['inactive', { isActive: false }],
    ['soft-deleted', { deletedAt: new Date() }],
  ])('rejects an %s organization', async (_label, data) => {
    await prisma.organization.update({ where: { id: organizationId }, data });
    expect((await rejectConnection(signAccessLikeToken())).message).toBe(AUTHENTICATION_ERROR);
  });

  test('rejects a token organization that differs from authoritative membership', async () => {
    const other = await prisma.organization.create({
      data: { name: 'Other Organization', slug: `other-${randomUUID()}` },
    });
    expect((await rejectConnection(signAccessLikeToken({ tokenOrganizationId: other.id }))).message)
      .toBe(AUTHENTICATION_ERROR);
  });

  test('loads role from PostgreSQL and attaches only the safe principal', async () => {
    await prisma.user.update({ where: { id: userId }, data: { role: Role.MANAGER } });
    const client = await connect(signAccessLikeToken({ role: Role.SUPER_ADMIN }));
    const principal = serverSocketFor(client).data.principal as SocketPrincipal;
    expect(principal).toMatchObject({ userId, organizationId, role: Role.MANAGER });
    expect(Object.keys(principal).sort()).toEqual([
      'accessTokenExpiresAt', 'organizationId', 'role', 'tokenId', 'userId',
    ]);
    client.close();
  });

  test('joins only the socket, authoritative user, and authoritative organization rooms', async () => {
    const client = await connect(
      signAccessLikeToken(),
      { organizationId: randomUUID(), room: 'organization:attacker-selected' },
    );
    expect([...serverSocketFor(client).rooms].sort()).toEqual([
      client.id,
      organizationRoom(organizationId),
      userRoom(userId),
    ].sort());
    client.close();
  });

  test('client-supplied tenant identity cannot override socket.data', async () => {
    const attackerOrganizationId = randomUUID();
    const client = await connect(signAccessLikeToken(), { organizationId: attackerOrganizationId });
    const socket = serverSocketFor(client);
    expect(socket.data.principal?.organizationId).toBe(organizationId);
    expect(socket.rooms.has(organizationRoom(attackerOrganizationId))).toBe(false);
    client.close();
  });

  test('disconnects the authenticated connection when its access token expires', async () => {
    const client = await connect(signAccessLikeToken({ expiresIn: '2s' }));
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Socket outlived access token')), 4_000);
      client.once('disconnect', () => {
        clearTimeout(timer);
        resolve();
      });
    });
    expect(client.connected).toBe(false);
  });

  test('does not expose or log raw access tokens on authentication failure', async () => {
    const rawToken = 'raw-access-token-must-not-appear';
    const warning = jest.spyOn(logger, 'warn');
    const error = await rejectConnection(rawToken);
    expect(JSON.stringify(error)).not.toContain(rawToken);
    expect(JSON.stringify(warning.mock.calls)).not.toContain(rawToken);
    warning.mockRestore();
  });
});
