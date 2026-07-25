type WorkerEventHandler = (...args: any[]) => void;

interface MockWorker {
  name: string;
  handlers: Record<string, WorkerEventHandler>;
  on: jest.Mock;
  close: jest.Mock;
}

const mockWorkers: MockWorker[] = [];
const mockRecordQueueJobCompleted = jest.fn();
const mockRecordQueueJobFailed = jest.fn();

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation((name: string) => {
    const handlers: Record<string, WorkerEventHandler> = {};

    const worker: MockWorker = {
      name,
      handlers,
      on: jest.fn(),
      close: jest.fn(),
    };

    worker.on.mockImplementation(
      (event: string, handler: WorkerEventHandler) => {
        handlers[event] = handler;
        return worker;
      },
    );

    mockWorkers.push(worker);
    return worker;
  }),
}));

jest.mock('../../../core/redis/redis.client', () => ({
  getRedisClient: jest.fn(() => ({})),
}));

jest.mock('../../../core/metrics/queueMetrics', () => ({
  recordQueueJobCompleted: mockRecordQueueJobCompleted,
  recordQueueJobFailed: mockRecordQueueJobFailed,
}));

jest.mock('../queues', () => ({
  QUEUE_NAMES: {
    EMAIL: 'emailQueue',
    NOTIFICATIONS: 'notificationsQueue',
    ANALYTICS: 'analyticsQueue',
    AI: 'aiQueue',
  },
}));

jest.mock('../processors/email.processor', () => ({
  emailProcessor: jest.fn(),
}));

jest.mock('../processors/notification.processor', () => ({
  notificationProcessor: jest.fn(),
}));

jest.mock('../processors/analytics.processor', () => ({
  analyticsProcessor: jest.fn(),
}));

jest.mock('../processors/ai.processor', () => ({
  aiProcessor: jest.fn(),
}));

import { startWorkers } from '../workers';

describe('job workers metrics', () => {
  beforeEach(() => {
    mockWorkers.length = 0;
    mockRecordQueueJobCompleted.mockClear();
    mockRecordQueueJobFailed.mockClear();

    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('records completed and failed jobs using the worker queue name', () => {
    startWorkers();

    expect(mockWorkers).toHaveLength(4);

    const emailWorker = mockWorkers.find(
      worker => worker.name === 'emailQueue',
    );

    expect(emailWorker).toBeDefined();

    emailWorker!.handlers.completed({
      id: 'job-1',
      name: 'send-email',
    });

    emailWorker!.handlers.failed(
      {
        id: 'job-2',
        name: 'send-email',
      },
      new Error('delivery failed'),
    );

    expect(mockRecordQueueJobCompleted).toHaveBeenCalledWith(
      'emailQueue',
    );

    expect(mockRecordQueueJobFailed).toHaveBeenCalledWith(
      'emailQueue',
    );
  });
});
