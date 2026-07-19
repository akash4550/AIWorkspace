import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { io, type Socket } from 'socket.io-client';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useRealtimeStore } from '../../stores/useRealtimeStore';
import { useAuth } from '../AuthProvider';
import { SocketProvider } from '../SocketProvider';

vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

vi.mock('../AuthProvider', () => ({
  useAuth: vi.fn(),
}));

const unauthenticated = (): ReturnType<typeof useAuth> => ({
  status: 'unauthenticated',
  accessToken: null,
  user: null,
  organization: null,
  login: vi.fn(),
  logout: vi.fn(),
  clearSession: vi.fn(),
});

const renderSocketProvider = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const tree = () => (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <span>Socket child</span>
      </SocketProvider>
    </QueryClientProvider>
  );
  const result = render(tree());
  return { ...result, rerenderTree: () => result.rerender(tree()) };
};

const createSocket = () => {
  const handlers = new Map<string, () => void>();
  const socket = {
    on: vi.fn((event: string, listener: () => void) => {
      handlers.set(event, listener);
      return socket;
    }),
    disconnect: vi.fn(),
  };

  return {
    handlers,
    socket: socket as unknown as Socket,
    disconnect: socket.disconnect,
  };
};

beforeEach(() => {
  vi.resetAllMocks();
  useRealtimeStore.getState().reset();
  vi.mocked(useAuth).mockReturnValue(unauthenticated());
});

describe('SocketProvider authentication boundary', () => {
  test('does not create a socket while the session is unauthenticated', () => {
    window.localStorage.setItem('aiworkspace_token', 'obsolete-mock-token');

    renderSocketProvider();

    expect(screen.getByText('Socket child')).toBeInTheDocument();
    expect(io).not.toHaveBeenCalled();
    expect(useRealtimeStore.getState().isConnected).toBe(false);
  });

  test('connects once with only the canonical in-memory access token', async () => {
    const { socket } = createSocket();
    vi.mocked(io).mockReturnValue(socket);
    window.localStorage.setItem('aiworkspace_token', 'obsolete-storage-token');
    vi.mocked(useAuth).mockReturnValue({
      ...unauthenticated(),
      status: 'authenticated',
      accessToken: 'memory-access-token',
    });

    renderSocketProvider();

    await waitFor(() => expect(io).toHaveBeenCalledTimes(1));
    expect(io).toHaveBeenCalledWith(undefined, {
      path: '/socket.io',
      auth: { token: 'memory-access-token' },
      autoConnect: true,
      reconnection: false,
    });
  });

  test('disconnects the current socket and clears connection state when the session ends', async () => {
    const { socket, handlers, disconnect } = createSocket();
    vi.mocked(io).mockReturnValue(socket);
    let authState: ReturnType<typeof useAuth> = {
      ...unauthenticated(),
      status: 'authenticated',
      accessToken: 'memory-access-token',
    };
    vi.mocked(useAuth).mockImplementation(() => authState);
    const { rerenderTree } = renderSocketProvider();
    await waitFor(() => expect(io).toHaveBeenCalledTimes(1));

    act(() => {
      handlers.get('connect')?.();
    });
    expect(useRealtimeStore.getState().isConnected).toBe(true);

    authState = unauthenticated();
    rerenderTree();

    await waitFor(() => expect(disconnect).toHaveBeenCalledTimes(1));
    expect(useRealtimeStore.getState().isConnected).toBe(false);
    expect(io).toHaveBeenCalledTimes(1);
  });
});
