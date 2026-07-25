import { Server } from 'node:http';
import { AddressInfo } from 'node:net';

import app from '../../../app';
import { closeRedisClient } from '../../../core/redis/redis.client';
import { logger } from '../../../core/utils/logger';
import { allQueues } from '../../jobs/queues';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('requestObservability middleware', () => {
  let server: Server;
  let baseUrl: string;
  let infoSpy: jest.SpyInstance;

  beforeAll(async () => {
    infoSpy = jest.spyOn(logger, 'info');

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const { port } = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterEach(() => {
    infoSpy.mockClear();
  });

  afterAll(async () => {
    server.closeAllConnections();

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    infoSpy.mockRestore();

    await Promise.all(allQueues.map((queue) => queue.close()));
    await closeRedisClient();
  });

  it('generates a UUID request ID when none is provided', async () => {
    const response = await fetch(`${baseUrl}/api/v1/system/live`);

    expect(response.status).toBe(200);

    const requestId = response.headers.get('x-request-id');

    expect(requestId).toBeTruthy();
    expect(requestId).toMatch(UUID_PATTERN);
  });

  it('propagates a valid request ID', async () => {
    const response = await fetch(`${baseUrl}/api/v1/system/live`, {
      headers: {
        'x-request-id': 'client-request-123',
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toBe(
      'client-request-123',
    );
  });

  it('replaces an invalid request ID with a UUID', async () => {
    const response = await fetch(`${baseUrl}/api/v1/system/live`, {
      headers: {
        'x-request-id': 'unsafe request/id',
      },
    });

    expect(response.status).toBe(200);

    const requestId = response.headers.get('x-request-id');

    expect(requestId).toBeTruthy();
    expect(requestId).not.toBe('unsafe request/id');
    expect(requestId).toMatch(UUID_PATTERN);
  });

  it('includes the request ID in error headers and bodies', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        'x-request-id': 'failed-request-123',
      },
    });

    const body = await response.json() as {
      requestId?: string;
    };

    expect(response.status).toBe(401);
    expect(response.headers.get('x-request-id')).toBe(
      'failed-request-123',
    );
    expect(body.requestId).toBe('failed-request-123');
  });

  it('writes a structured completion log without request secrets', async () => {
    const response = await fetch(`${baseUrl}/api/v1/system/live`, {
      headers: {
        'x-request-id': 'logged-request-123',
        authorization: 'Bearer highly-sensitive-token',
        cookie: 'refreshToken=highly-sensitive-cookie',
      },
    });

    expect(response.status).toBe(200);

    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });

    const completionCall = infoSpy.mock.calls.find(
      ([message]) => message === 'HTTP request completed',
    );

    expect(completionCall).toBeDefined();

    const metadata = completionCall?.[1] as Record<string, unknown>;

    expect(metadata).toMatchObject({
      requestId: 'logged-request-123',
      method: 'GET',
      route: '/api/v1/system/live',
      status: 200,
    });

    expect(metadata.durationMs).toEqual(expect.any(Number));

    const serializedMetadata = JSON.stringify(metadata);

    expect(serializedMetadata).not.toContain(
      'highly-sensitive-token',
    );
    expect(serializedMetadata).not.toContain(
      'highly-sensitive-cookie',
    );
    expect(serializedMetadata).not.toContain('authorization');
    expect(serializedMetadata).not.toContain('cookie');
  });
});