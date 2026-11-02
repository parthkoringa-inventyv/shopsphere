import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  HOST: z.string().trim().min(1, 'HOST must not be empty'),

  PORT: z.coerce.number().int().min(1).max(65535),

  CORS_ORIGIN: z.url().refine((value) => {
    const url = new URL(value);
    return url.origin === value;
  }, 'CORS_ORIGIN must be an origin without a path'),

  DATABASE_URL: z.url().refine((value) => {
    const url = new URL(value);

    return url.protocol === 'postgresql:' || url.protocol === 'postgres:';
  }, 'DATABASE_URL must be a valid PostgreSQL connection URL'),

  REDIS_HOST: z.string().trim().min(1).default('127.0.0.1'),

  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),

  REDIS_PASSWORD: z.string().min(1, 'REDIS_PASSWORD must not be empty'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment configuration:');

  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join('.')}: ${issue.message}`);
  }

  process.exit(1);
}

export type Environment = z.infer<typeof envSchema>;
export const env: Environment = result.data;
