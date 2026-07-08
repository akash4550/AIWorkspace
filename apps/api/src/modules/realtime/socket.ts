import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthSocket extends Socket {
  user?: {
    id: string;
    organizationId: string;
    role: string;
  };
}

let io: Server;

export const initializeSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Adjust for production
      methods: ['GET', 'POST']
    }
  });

  // Authentication Middleware
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, config.jwtSecret) as any;
      socket.user = {
        id: decoded.id,
        organizationId: decoded.organizationId,
        role: decoded.role
      };
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user?.id})`);

    // 1. Enforce Tenant Isolation: Join the Organization Room
    const orgRoom = `org_${socket.user?.organizationId}`;
    socket.join(orgRoom);
    
    // 2. Personal Room for direct notifications
    const userRoom = `user_${socket.user?.id}`;
    socket.join(userRoom);

    // 3. Presence: Broadcast user online
    socket.to(orgRoom).emit('presence.status', {
      userId: socket.user?.id,
      status: 'online',
      timestamp: new Date()
    });

    socket.on('disconnect', () => {
      // Broadcast user offline
      socket.to(orgRoom).emit('presence.status', {
        userId: socket.user?.id,
        status: 'offline',
        timestamp: new Date()
      });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};
