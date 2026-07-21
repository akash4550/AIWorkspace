import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type {
  AuthPayload,
  AuthSession,
  LoginCredentials,
} from '../../features/auth/auth.types';
import {
  currentSessionRequest,
  loginRequest,
  logoutRequest,
  refreshSessionRequest,
  registerAuthCoordinator,
} from '../../lib/api';
import { useRealtimeStore } from '../../stores/useRealtimeStore';
import { AuthProvider, useAuth } from '../AuthProvider';

vi.mock('../../lib/api', () => ({
  currentSessionRequest: vi.fn(),
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
  refreshSessionRequest: vi.fn(),
  registerAuthCoordinator: vi.fn(),
}));

const firstSession: AuthSession = {
  user: {
    id: 'user-1',
    organizationId: 'organization-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    role: 'MANAGER',
    avatar: null,
    emailVerified: true,
    lastLogin: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  organization: {
    id: 'organization-1',
    name: 'First Workspace',
    slug: 'first-workspace',
    logo: null,
  },
};

const secondSession: AuthSession = {
  user: {
    ...firstSession.user,
    id: 'user-2',
    organizationId: 'organization-2',
    email: 'grace@example.com',
    role: 'EMPLOYEE',
  },
  organization: {
    id: 'organization-2',
    name: 'Second Workspace',
    slug: 'second-workspace',
    logo: null,
  },
};

const authPayload = (
  accessToken: string,
  session: AuthSession = firstSession,
): AuthPayload => ({
  ...session,
  accessToken,
});

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const AuthProbe = () => {
  const auth = useAuth();
  const credentials: LoginCredentials = {
    organizationId: ' 00000000-0000-4000-8000-000000000002 ',
    email: ' Grace@Example.COM ',
    password: 'password123',
  };

  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="token">{auth.accessToken ?? 'none'}</span>
      <span data-testid="role">{auth.user?.role ?? 'none'}</span>
      <span data-testid="organization">{auth.organization?.id ?? 'none'}</span>
      <button type="button" onClick={() => void auth.login(credentials)}>
        Log in
      </button>
      <button type="button" onClick={() => void auth.logout()}>
        Log out
      </button>
    </div>
  );
};

const renderProvider = (strict = false) => {
  const queryClient = createQueryClient();
  const tree = (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    </QueryClientProvider>
  );

  render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  return queryClient;
};

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(registerAuthCoordinator).mockReturnValue(vi.fn());
  useRealtimeStore.getState().reset();
});

describe('AuthProvider', () => {
  test('starts initializing and restores one authoritative session under StrictMode', async () => {
    const refresh = deferred<AuthPayload>();
    vi.mocked(refreshSessionRequest).mockReturnValue(refresh.promise);
    vi.mocked(currentSessionRequest).mockResolvedValue(firstSession);

    renderProvider(true);

    expect(screen.getByTestId('status')).toHaveTextContent('initializing');
    expect(screen.getByTestId('token')).toHaveTextContent('none');

    await act(async () => {
      refresh.resolve(authPayload('startup-access-token'));
      await refresh.promise;
    });

    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    expect(screen.getByTestId('token')).toHaveTextContent('startup-access-token');
    expect(screen.getByTestId('role')).toHaveTextContent('MANAGER');
    expect(screen.getByTestId('organization')).toHaveTextContent('organization-1');
    expect(refreshSessionRequest).toHaveBeenCalledTimes(1);
    expect(currentSessionRequest).toHaveBeenCalledWith('startup-access-token');
    expect(window.localStorage).toHaveLength(0);
    expect(window.sessionStorage).toHaveLength(0);
  });

  test('becomes unauthenticated after failed startup and removes only obsolete auth storage', async () => {
    window.localStorage.setItem('mock_admin_id', 'legacy-user');
    window.localStorage.setItem('aiworkspace-ui-storage', '{"theme":"dark"}');
    window.sessionStorage.setItem('aiworkspace_token', 'legacy-token');
    vi.mocked(refreshSessionRequest).mockRejectedValue(new Error('No session'));

    renderProvider();

    expect(await screen.findByText('unauthenticated')).toBeInTheDocument();
    expect(window.localStorage.getItem('mock_admin_id')).toBeNull();
    expect(window.sessionStorage.getItem('aiworkspace_token')).toBeNull();
    expect(window.localStorage.getItem('aiworkspace-ui-storage')).toBe(
      '{"theme":"dark"}',
    );
    expect(currentSessionRequest).not.toHaveBeenCalled();
  });

  test('normalizes login, trusts /me identity, and clears prior tenant state', async () => {
    const user = userEvent.setup();
    vi.mocked(refreshSessionRequest).mockResolvedValue(
      authPayload('first-access-token'),
    );
    vi.mocked(currentSessionRequest)
      .mockResolvedValueOnce(firstSession)
      .mockResolvedValueOnce(secondSession);
    vi.mocked(loginRequest).mockResolvedValue(
      authPayload('second-access-token', firstSession),
    );
    const queryClient = renderProvider();
    expect(await screen.findByText('authenticated')).toBeInTheDocument();

    queryClient.setQueryData(['tenant-record'], { organizationId: 'organization-1' });
    useRealtimeStore.getState().addNotification({
      id: 'notification-1',
      title: 'Tenant event',
      message: 'Sensitive tenant data',
      read: false,
      createdAt: new Date(),
    });

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await screen.findByText('second-access-token');
    expect(loginRequest).toHaveBeenCalledWith({
      organizationId: ' 00000000-0000-4000-8000-000000000002 ',
      email: 'grace@example.com',
      password: 'password123',
    });
    expect(currentSessionRequest).toHaveBeenLastCalledWith('second-access-token');
    expect(screen.getByTestId('role')).toHaveTextContent('EMPLOYEE');
    expect(screen.getByTestId('organization')).toHaveTextContent('organization-2');
    expect(queryClient.getQueryData(['tenant-record'])).toBeUndefined();
    expect(useRealtimeStore.getState().notifications).toHaveLength(0);
    expect(window.localStorage).toHaveLength(0);
    expect(window.sessionStorage).toHaveLength(0);
  });

  test('logs out from the provider boundary and clears tenant state', async () => {
    const user = userEvent.setup();
    vi.mocked(refreshSessionRequest).mockResolvedValue(authPayload('access-token'));
    vi.mocked(currentSessionRequest).mockResolvedValue(firstSession);
    vi.mocked(logoutRequest).mockResolvedValue();
    const queryClient = renderProvider();
    expect(await screen.findByText('authenticated')).toBeInTheDocument();

    queryClient.setQueryData(['tenant-record'], { private: true });
    useRealtimeStore.getState().addNotification({
      id: 'notification-1',
      title: 'Tenant event',
      message: 'Sensitive tenant data',
      read: false,
      createdAt: new Date(),
    });

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByText('unauthenticated')).toBeInTheDocument();
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(logoutRequest).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(['tenant-record'])).toBeUndefined();
    expect(useRealtimeStore.getState().notifications).toHaveLength(0);
  });
});
