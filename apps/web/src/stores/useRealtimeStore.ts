import { create } from 'zustand';

interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

interface Presence {
  userId: string;
  status: 'online' | 'offline';
  lastSeen?: Date;
}

interface RealtimeState {
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  onlineUsers: Record<string, Presence>;
  
  setConnected: (status: boolean) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  updatePresence: (presence: Presence) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  isConnected: false,
  notifications: [],
  unreadCount: 0,
  onlineUsers: {},

  setConnected: (status) => set({ isConnected: status }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1
  })),

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    unreadCount: Math.max(0, state.unreadCount - 1)
  })),

  updatePresence: (presence) => set((state) => ({
    onlineUsers: {
      ...state.onlineUsers,
      [presence.userId]: presence
    }
  }))
}));
