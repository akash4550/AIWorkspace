import winston from 'winston';
import { env } from '../../config/env';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

// Custom format for local development
const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
  })
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp(),
    json()
  ),
  defaultMeta: { service: 'aiworkspace-api' },
  transports: [
    // In production, we only log to stdout in JSON format for Datadog/CloudWatch to ingest
    new winston.transports.Console({
      format: env.NODE_ENV === 'production' ? json() : consoleFormat
    })
  ]
});
