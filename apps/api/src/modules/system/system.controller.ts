import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getRedisClient } from '../../core/redis/redis.client';
import { logger } from '../../core/utils/logger';

const prisma = new PrismaClient();

export class SystemController {
  
  /**
   * Liveness Probe: Returns 200 OK immediately if the HTTP server is accepting requests.
   * Kubernetes uses this to know if it should restart the pod.
   */
  checkLiveness(req: Request, res: Response) {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  /**
   * Readiness Probe: Checks if the application is ready to accept traffic.
   * Kubernetes uses this to know if it should send traffic to this pod.
   * We check DB and Redis connectivity here.
   */
  async checkReadiness(req: Request, res: Response) {
    try {
      // Check Postgres
      await prisma.$queryRaw`SELECT 1`;
      
      // Check Redis
      const redis = getRedisClient();
      await redis.ping();

      res.status(200).json({
        status: 'ready',
        database: 'connected',
        redis: 'connected',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error('Readiness check failed', { error: error.message });
      res.status(503).json({
        status: 'unavailable',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}
