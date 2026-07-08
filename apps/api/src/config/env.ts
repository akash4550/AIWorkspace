import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('4000').transform(val => parseInt(val, 10)),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL').default('http://localhost:5173'),
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

let envConfig: EnvConfig;

try {
  envConfig = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:', error.flatten().fieldErrors);
    // In production, we MUST fail fast if environment is misconfigured
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    // In development, we can try to proceed but warn loudly
    console.warn('⚠️ Proceeding with potentially invalid environment because NODE_ENV !== production');
    // We cast this just to allow local dev to boot if strictly necessary, but it's risky
    envConfig = process.env as unknown as EnvConfig; 
  } else {
    throw error;
  }
}

export const env = envConfig;
