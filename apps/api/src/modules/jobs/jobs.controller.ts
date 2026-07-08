import { Request, Response, NextFunction } from 'express';
import { allQueues } from './queues';

export class JobsController {
  
  async getQueueStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const statuses = await Promise.all(
        allQueues.map(async (queue) => {
          const [waiting, active, completed, failed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
          ]);

          return {
            name: queue.name,
            counts: {
              waiting,
              active,
              completed,
              failed,
            },
          };
        })
      );

      res.status(200).json({ data: statuses });
    } catch (error) {
      next(error);
    }
  }

  async retryFailedJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const { queueName } = req.body;
      const targetQueue = allQueues.find(q => q.name === queueName);

      if (!targetQueue) {
        return res.status(404).json({ message: 'Queue not found' });
      }

      const failedJobs = await targetQueue.getFailed();
      let retriedCount = 0;

      for (const job of failedJobs) {
        await job.retry();
        retriedCount++;
      }

      res.status(200).json({ message: `Retried ${retriedCount} jobs`, retriedCount });
    } catch (error) {
      next(error);
    }
  }

  async getFailedJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const { queueName } = req.params;
      const targetQueue = allQueues.find(q => q.name === queueName);

      if (!targetQueue) {
        return res.status(404).json({ message: 'Queue not found' });
      }

      // Limit to last 50 for performance
      const failedJobs = await targetQueue.getFailed(0, 50);
      
      const formattedJobs = failedJobs.map(job => ({
        id: job.id,
        name: job.name,
        data: job.data,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace,
        timestamp: job.timestamp,
      }));

      res.status(200).json({ data: formattedJobs });
    } catch (error) {
      next(error);
    }
  }
}
