import { Server as HttpServer } from 'node:http';
import { Role } from '@prisma/client';
import { Server, Socket } from 'socket.io';

import { env } from '../../config/env';
import { logger } from '../../core/utils/logger';
import { verifyAccessToken } from '../../core/security/jwt';
import { authService } from '../auth/auth.service';

const AUTHENTICATION_ERROR = 'Authentication error';
const USER_ROOM_PREFIX = 'user:';
const ORGANIZATION_ROOM_PREFIX = 'organization:';

export interface SocketPrincipal {
  userId: string;
  organizationId: string;
  role: Role;
  accessTokenExpiresAt: number;
  tokenId: string;
}

interface AuthenticatedSocketData {
  principal?: SocketPrincipal;
}

export type AuthSocket = Socket<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  AuthenticatedSocketData
>;

export const userRoom = (userId: string): string => `${USER_ROOM_PREFIX}${userId}`;
export const organizationRoom = (organizationId: string): string =>
  `${ORGANIZATION_ROOM_PREFIX}${organizationId}`;

let io: Server | undefined;

export const initializeSocket = (httpServer: HttpServer): Server => {
  const socketServer = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  io = socketServer;

  socketServer.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string' || token.length === 0) {
        logger.warn('Socket authentication rejected', { category: 'missing_access_token' });
        next(new Error(AUTHENTICATION_ERROR));
        return;
      }

      const claims = verifyAccessToken(token);
      const identity = await authService.loadAuthoritativeIdentity(
        claims.sub,
        claims.organizationId,
      );

      socket.data.principal = {
        userId: identity.id,
        organizationId: identity.organizationId,
        role: identity.role,
        accessTokenExpiresAt: claims.exp,
        tokenId: claims.jti,
      };
      next();
    } catch {
      logger.warn('Socket authentication rejected', { category: 'invalid_access_token' });
      next(new Error(AUTHENTICATION_ERROR));
    }
  });

  socketServer.on('connection', (socket: AuthSocket) => {
    const principal = socket.data.principal;
    if (!principal) {
      socket.disconnect(true);
      return;
    }

    const orgRoom = organizationRoom(principal.organizationId);
    const personalRoom = userRoom(principal.userId);
    void socket.join([orgRoom, personalRoom]);

    logger.info('Socket connected', { socketId: socket.id, userId: principal.userId });

    socket.to(orgRoom).emit('presence.status', {
      userId: principal.userId,
      status: 'online',
      timestamp: new Date(),
    });

    const expiresInMs = Math.max(0, principal.accessTokenExpiresAt * 1000 - Date.now());
    const expirationTimer = setTimeout(() => socket.disconnect(true), expiresInMs);

    socket.once('disconnect', () => {
      clearTimeout(expirationTimer);
      socket.to(orgRoom).emit('presence.status', {
        userId: principal.userId,
        status: 'offline',
        timestamp: new Date(),
      });
    });
  });

  return socketServer;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};
