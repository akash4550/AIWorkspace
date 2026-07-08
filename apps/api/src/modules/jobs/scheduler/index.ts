import { maintenanceQueue, analyticsQueue } from '../queues';

export const startScheduler = async () => {
  console.log('Registering recurring scheduled jobs...');

  // BullMQ allows repeatable jobs using cron expressions
  
  // 1. Daily midnight cleanup for maintenance tasks
  await maintenanceQueue.add(
    'daily-cleanup',
    { systemTask: true, description: 'Clean up expired refresh tokens and soft-deleted records' },
    { repeat: { pattern: '0 0 * * *' } }
  );

  // 2. Weekly Analytics pre-computation every Sunday at 1 AM
  await analyticsQueue.add(
    'weekly-analytics-refresh',
    { systemTask: true, reportType: 'WEEKLY_SUMMARY' },
    { repeat: { pattern: '0 1 * * 0' } }
  );

  console.log('Scheduled jobs registered successfully.');
};
