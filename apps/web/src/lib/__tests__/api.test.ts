import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { api, registerAuthCoordinator } from '../api';

const defaultAdapter = api.defaults.adapter;
let unregisterCoordinator: (() => void) | undefined;

const unauthorized = (
  config: InternalAxiosRequestConfig,
): Promise<never> => {
  const response: AxiosResponse = {
    data: { message: 'Unauthorized' },
    status: 401,
    statusText: 'Unauthorized',
    headers: new AxiosHeaders(),
    config,
  };

  return Promise.reject(
    new AxiosError(
      'Request failed with status code 401',
      AxiosError.ERR_BAD_REQUEST,
      config,
      undefined,
      response,
    ),
  );
};

const success = (
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse> =>
  Promise.resolve({
    data: { url: config.url },
    status: 200,
    statusText: 'OK',
    headers: new AxiosHeaders(),
    config,
  });

const authorizationHeader = (
  config: InternalAxiosRequestConfig,
): string | undefined => {
  const value = AxiosHeaders.from(config.headers).get('Authorization');
  return typeof value === 'string' ? value : undefined;
};

afterEach(() => {
  unregisterCoordinator?.();
  unregisterCoordinator = undefined;
  api.defaults.adapter = defaultAdapter;
});

describe('authenticated API client', () => {
  test('adds the in-memory access token without using browser storage', async () => {
    const adapter = vi.fn(success);
    api.defaults.adapter = adapter;

    unregisterCoordinator = registerAuthCoordinator({
      getAccessToken: () => 'memory-access-token',
      refreshSession: vi.fn(),
      clearSession: vi.fn(),
    });

    await api.get('/protected');

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(authorizationHeader(adapter.mock.calls[0]![0])).toBe(
      'Bearer memory-access-token',
    );
    expect(window.localStorage).toHaveLength(0);
    expect(window.sessionStorage).toHaveLength(0);
  });

  test('coordinates concurrent authentication failures through one refresh and retries each request once', async () => {
    let accessToken = 'expired-access-token';
    let resolveRefresh!: (token: string) => void;
    const refreshResult = new Promise<string>((resolve) => {
      resolveRefresh = resolve;
    });
    const refreshSession = vi.fn(async () => {
      const token = await refreshResult;
      accessToken = token;
      return token;
    });
    const clearSession = vi.fn();
    const attempts = new Map<string, number>();
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      const url = config.url ?? '';
      attempts.set(url, (attempts.get(url) ?? 0) + 1);

      if (authorizationHeader(config) !== 'Bearer refreshed-access-token') {
        return unauthorized(config);
      }

      return success(config);
    });
    api.defaults.adapter = adapter;
    unregisterCoordinator = registerAuthCoordinator({
      getAccessToken: () => accessToken,
      refreshSession,
      clearSession,
    });

    const firstRequest = api.get('/first');
    const secondRequest = api.get('/second');

    await vi.waitFor(() => {
      expect(refreshSession).toHaveBeenCalledTimes(1);
    });
    resolveRefresh('refreshed-access-token');

    await expect(Promise.all([firstRequest, secondRequest])).resolves.toHaveLength(2);
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(attempts.get('/first')).toBe(2);
    expect(attempts.get('/second')).toBe(2);
    expect(clearSession).not.toHaveBeenCalled();
  });

  test('retries a request at most once after a successful refresh', async () => {
    let accessToken = 'expired-access-token';
    const refreshSession = vi.fn(async () => {
      accessToken = 'replacement-access-token';
      return accessToken;
    });
    const adapter = vi.fn(unauthorized);
    api.defaults.adapter = adapter;
    unregisterCoordinator = registerAuthCoordinator({
      getAccessToken: () => accessToken,
      refreshSession,
      clearSession: vi.fn(),
    });

    await expect(api.get('/still-unauthorized')).rejects.toBeInstanceOf(
      AxiosError,
    );

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  test('clears the session when refresh fails', async () => {
    const refreshFailure = new Error('refresh failed');
    const clearSession = vi.fn();
    const refreshSession = vi.fn().mockRejectedValue(refreshFailure);
    const adapter = vi.fn(unauthorized);
    api.defaults.adapter = adapter;
    unregisterCoordinator = registerAuthCoordinator({
      getAccessToken: () => 'expired-access-token',
      refreshSession,
      clearSession,
    });

    await expect(api.get('/protected')).rejects.toBe(refreshFailure);
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(clearSession).toHaveBeenCalledTimes(1);
  });

  test('does not refresh authentication endpoints', async () => {
    const refreshSession = vi.fn();
    const adapter = vi.fn(unauthorized);
    api.defaults.adapter = adapter;
    unregisterCoordinator = registerAuthCoordinator({
      getAccessToken: () => 'access-token',
      refreshSession,
      clearSession: vi.fn(),
    });

    await expect(api.post('/auth/login')).rejects.toBeInstanceOf(AxiosError);
    expect(refreshSession).not.toHaveBeenCalled();
    expect(adapter).toHaveBeenCalledTimes(1);
  });
});
