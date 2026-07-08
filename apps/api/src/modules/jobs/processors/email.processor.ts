import { Job } from 'bullmq';
import { EmailJobData } from '../services/job.service';

/**
 * Processor for handling background email sending.
 * Strictly adheres to modular boundaries by receiving context in the job payload.
 */
export const emailProcessor = async (job: Job<EmailJobData>) => {
  const { organizationId, to, subject, template, context } = job.data;
  
  if (!organizationId) {
    throw new Error('Tenant context (organizationId) missing in job payload');
  }

  // Placeholder for actual email sending logic (e.g. SendGrid, AWS SES)
  // E.g., await EmailProvider.send(to, subject, template, context);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log(`[EmailWorker] Sent email to ${to} for organization ${organizationId}`);
  
  return { success: true, deliveredTo: to };
};
