import { emailQueue, notificationsQueue, analyticsQueue, crmQueue, documentsQueue } from '../queues';

export interface BaseJobData {
  organizationId: string;
  userId?: string; // Who triggered this job, if applicable
  [key: string]: any;
}

export interface EmailJobData extends BaseJobData {
  to: string;
  subject: string;
  template: string;
  context: any;
}

export class JobService {
  /**
   * Enqueues an email job ensuring tenant context is passed
   */
  async enqueueEmail(jobName: string, data: EmailJobData, options = {}) {
    if (!data.organizationId) throw new Error('organizationId is required for multi-tenant isolation');
    return emailQueue.add(jobName, data, options);
  }

  /**
   * Enqueues a notification job
   */
  async enqueueNotification(jobName: string, data: BaseJobData, options = {}) {
    if (!data.organizationId) throw new Error('organizationId is required');
    return notificationsQueue.add(jobName, data, options);
  }

  /**
   * Enqueues a document processing job (e.g., extracting metadata)
   */
  async enqueueDocumentProcessing(jobName: string, data: BaseJobData, options = {}) {
    if (!data.organizationId) throw new Error('organizationId is required');
    return documentsQueue.add(jobName, data, options);
  }
  
  /**
   * Enqueues a background analytics calculation task
   */
  async enqueueAnalyticsTask(jobName: string, data: BaseJobData, options = {}) {
    if (!data.organizationId) throw new Error('organizationId is required');
    return analyticsQueue.add(jobName, data, options);
  }

  /**
   * Enqueues a CRM background action (e.g. Lead follow-up)
   */
  async enqueueCRMAction(jobName: string, data: BaseJobData, options = {}) {
    if (!data.organizationId) throw new Error('organizationId is required');
    return crmQueue.add(jobName, data, options);
  }
}
