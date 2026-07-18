import Redis from 'ioredis';
import { env } from '../../config/env';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(
      env.REDIS_URL ?? 'redis://localhost:6379',
      {
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
        lazyConnect: true,
      }
    );

    redisClient.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis is ready');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
    });
  }

  return redisClient;
};

export const redisConnection = env.REDIS_URL ?? 'redis://localhost:6379';