import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRealtimeStore } from '../stores/useRealtimeStore';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthProvider';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { setConnected, addNotification, updatePresence } = useRealtimeStore();
  const queryClient = useQueryClient();
  const { status, accessToken } = useAuth();

  useEffect(() => {
    if (status !== 'authenticated' || !accessToken) {
      setSocket(null);
      setConnected(false);
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL?.trim() || undefined;
    const socketInstance = io(socketUrl, {
      path: import.meta.env.VITE_SOCKET_PATH || '/socket.io',
      auth: { token: accessToken },
      autoConnect: true,
      reconnection: false,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    socketInstance.on('connect_error', () => {
      setConnected(false);
    });

    // --- Domain Events ---
    
    socketInstance.on('presence.status', (payload) => {
      updatePresence(payload);
    });

    socketInstance.on('notification.new', (payload) => {
      addNotification({
        id: Math.random().toString(36).substr(2, 9),
        ...payload,
        read: false
      });
    });

    socketInstance.on('task.created', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    socketInstance.on('task.updated', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    socketInstance.on('task.assigned', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    return () => {
      socketInstance.disconnect();
      setConnected(false);
    };
  }, [accessToken, status, setConnected, addNotification, updatePresence, queryClient]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
