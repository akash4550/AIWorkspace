import { Job } from 'bullmq';
import { BaseJobData } from '../services/job.service';

/**
 * Processor for handling background notifications (e.g. In-app, push).
 */
export const notificationProcessor = async (job: Job<BaseJobData>) => {
  const { organizationId, userId, message, link } = job.data;

  if (!organizationId) {
    throw new Error('Tenant context missing');
  }

  // Example placeholder for triggering push notification or persisting to DB via service
  await new Promise(resolve => setTimeout(resolve, 200));

  console.log(`[NotificationWorker] Processed notification for user ${userId} in org ${organizationId}`);
  
  return { success: true };
};
