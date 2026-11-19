import { createClient } from 'redis';

import { env } from './env.js';
import { logger } from './logger.js';

export const redis = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
});

// Handle connection errors through our shared application logger.
redis.on('error', (error: Error) => {
  logger.error({ err: error }, 'Redis client error');
});

let connectionPromise: Promise<void> | undefined;

export function startRedisConnection(): Promise<void> {
  if (redis.isReady || redis.isOpen) {
    return connectionPromise ?? Promise.resolve();
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const pendingConnection: Promise<void> = redis
    .connect()
    .then(() => undefined)
    .catch((error: unknown) => {
      logger.error({ err: error }, 'Redis initial connection failed');
      throw error;
    })
    .finally(() => {
      connectionPromise = undefined;
    });

  connectionPromise = pendingConnection;

  return pendingConnection;
}

export async function closeRedisConnection(): Promise<void> {
  if (!redis.isOpen) {
    return;
  }

  if (redis.isReady) {
    await redis.close();
    return;
  }

  redis.destroy();
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
