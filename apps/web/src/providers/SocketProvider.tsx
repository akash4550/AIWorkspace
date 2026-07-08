import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRealtimeStore } from '../stores/useRealtimeStore';
import { useQueryClient } from '@tanstack/react-query';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { setConnected, addNotification, updatePresence } = useRealtimeStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    // In a real app, this token would come from auth store/context
    const token = localStorage.getItem('aiworkspace_token');
    
    // For demo purposes, we only connect if we simulate having a token
    // Our mock login doesn't set a real JWT yet, so we'll mock the socket url or skip connection
    // Let's connect to the local server
    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:4000', {
      auth: { token: token || 'mock_token' },
      autoConnect: true,
      // For demo, since we don't have a real JWT yet in this mock phase, it will fail auth
      // So in a real implementation we wait for auth to succeed before connecting.
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('Connected to realtime server');
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from realtime server');
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
    };
  }, [setConnected, addNotification, updatePresence, queryClient]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
