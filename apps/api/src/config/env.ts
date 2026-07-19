import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_ISSUER: z.string().min(1).default('aiworkspace-api'),
  JWT_ACCESS_AUDIENCE: z.string().min(1).default('aiworkspace-api'),
  JWT_REFRESH_AUDIENCE: z.string().min(1).default('aiworkspace-auth'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z
    .string()
    .regex(/^[1-9]\d*[smhd]$/i, 'Refresh token expiration must be a positive duration')
    .default('7d'),
  FRONTEND_URL: z.string().url().optional(),
  REDIS_URL: z
    .string()
    .url()
    .default('redis://localhost:6379'),
}).superRefine((env, ctx) => {
  if (env.JWT_ACCESS_AUDIENCE === env.JWT_REFRESH_AUDIENCE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_REFRESH_AUDIENCE'],
      message: 'Access and refresh token audiences must be different',
    });
  }

  if (env.NODE_ENV === 'production') {
    if (!env.JWT_ACCESS_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_ACCESS_SECRET'],
        message: 'JWT_ACCESS_SECRET is required in production',
      });
    }

    if (!env.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_REFRESH_SECRET is required in production',
      });
    }

    if (!env.FRONTEND_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FRONTEND_URL'],
        message: 'FRONTEND_URL is required in production',
      });
    }

    if (env.FRONTEND_URL) {
      const frontendUrl = new URL(env.FRONTEND_URL);
      const isLoopback = ['localhost', '127.0.0.1', '::1'].includes(frontendUrl.hostname);
      if (frontendUrl.protocol !== 'https:' && !isLoopback) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['FRONTEND_URL'],
          message: 'FRONTEND_URL must use HTTPS in production',
        });
      }
    }

    if (
      env.JWT_ACCESS_SECRET &&
      env.JWT_REFRESH_SECRET &&
      env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'Access and refresh token secrets must be different',
      });
    }
  }

  if (env.NODE_ENV === 'production' && !env.REDIS_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['REDIS_URL'],
      message: 'REDIS_URL is required in production',
    });
  }

  if (env.FRONTEND_URL) {
    const frontendUrl = new URL(env.FRONTEND_URL);
    if (
      !['http:', 'https:'].includes(frontendUrl.protocol) ||
      frontendUrl.username ||
      frontendUrl.password ||
      frontendUrl.pathname !== '/' ||
      frontendUrl.search ||
      frontendUrl.hash
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FRONTEND_URL'],
        message: 'FRONTEND_URL must be an HTTP(S) origin without credentials, path, query, or hash',
      });
    }
  }
});

export type Env = z.infer<typeof envSchema>;
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed');
console.table(
  parsed.error.issues.map(issue => ({
    Field: issue.path.join('.'),
    Error: issue.message,
  }))
);
  process.exit(1);
}

export const env = Object.freeze({
  ...parsed.data,
  JWT_ACCESS_SECRET: parsed.data.JWT_ACCESS_SECRET
    ?? 'development-access-token-secret-change-me',
  JWT_REFRESH_SECRET: parsed.data.JWT_REFRESH_SECRET
    ?? 'development-refresh-token-secret-change-me',
  FRONTEND_URL: parsed.data.FRONTEND_URL ?? 'http://localhost:5173',
});
