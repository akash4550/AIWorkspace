import { Queue } from 'bullmq';
import { getRedisClient } from '../../../core/redis/redis.client';

export const QUEUE_NAMES = {
  EMAIL: 'emailQueue',
  NOTIFICATIONS: 'notificationsQueue',
  DOCUMENTS: 'documentsQueue',
  ANALYTICS: 'analyticsQueue',
  CRM: 'crmQueue',
  AI: 'aiQueue',
  MAINTENANCE: 'maintenanceQueue'
};

const defaultJobOptions = {
  removeOnComplete: true,
  removeOnFail: false,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  }
};

const connection = getRedisClient();

export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, { connection, defaultJobOptions });
export const notificationsQueue = new Queue(QUEUE_NAMES.NOTIFICATIONS, { connection, defaultJobOptions });
export const documentsQueue = new Queue(QUEUE_NAMES.DOCUMENTS, { connection, defaultJobOptions });
export const analyticsQueue = new Queue(QUEUE_NAMES.ANALYTICS, { connection, defaultJobOptions });
export const crmQueue = new Queue(QUEUE_NAMES.CRM, { connection, defaultJobOptions });
export const aiQueue = new Queue(QUEUE_NAMES.AI, { connection, defaultJobOptions });
export const maintenanceQueue = new Queue(QUEUE_NAMES.MAINTENANCE, { connection, defaultJobOptions });

export const allQueues = [
  emailQueue,
  notificationsQueue,
  documentsQueue,
  analyticsQueue,
  crmQueue,
  aiQueue,
  maintenanceQueue
];
