import { createClient } from 'redis';

import { env } from './env.js';
import { logger } from './logger.js';

export const redis = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  password: env.REDIS_PASSWORD,
});

// Handle connection errors through our shared application logger.
redis.on('error', (error: Error) => {
  logger.error({ err: error }, 'Redis client error');
});

let connectionStarted = false;

export function startRedisConnection(): void {
  if (connectionStarted || redis.isOpen) {
    return;
  }

  connectionStarted = true;

  void redis.connect().catch((error: unknown) => {
    connectionStarted = false;

    logger.error({ err: error }, 'Redis initial connection failed');
  });
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error('Redis readiness check timed out'));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export async function checkRedisConnection(): Promise<void> {
  if (!redis.isReady) {
    throw new Error('Redis client is not ready');
  }

  const ping = redis
    .withCommandOptions({
      timeout: 3_000,
    })
    .ping();

  await withTimeout(ping, 4_000);
}
