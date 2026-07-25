import { PassThrough } from 'node:stream';
import winston from 'winston';

import { logger } from '../logger';

describe('logger redaction', () => {
  it('redacts sensitive metadata before writing logs', async () => {
    const stream = new PassThrough();
    const output: string[] = [];

    stream.on('data', (chunk: Buffer) => {
      output.push(chunk.toString());
    });

    const transport = new winston.transports.Stream({
      stream,
    });

    logger.add(transport);

    try {
      logger.info('Sensitive metadata test', {
        requestId: 'logger-test-123',
        password: 'plain-text-password',
        authorization: 'Bearer secret-access-token',
        nested: {
          refreshToken: 'secret-refresh-token',
          safeField: 'safe-value',
        },
      });

      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });

      const serializedOutput = output.join('');

      expect(serializedOutput).toContain('Sensitive metadata test');
      expect(serializedOutput).toContain('logger-test-123');
      expect(serializedOutput).toContain('safe-value');
      expect(serializedOutput).toContain('[REDACTED]');

      expect(serializedOutput).not.toContain('plain-text-password');
      expect(serializedOutput).not.toContain('secret-access-token');
      expect(serializedOutput).not.toContain('secret-refresh-token');
    } finally {
      logger.remove(transport);
      transport.close?.();
      stream.destroy();
    }
  });
});