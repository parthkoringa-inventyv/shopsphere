import { once } from 'node:events';

import { checkRedisConnection } from '../src/config/redis.js';
import { redis, startRedisConnection } from '../src/config/redis.js';

try {
  startRedisConnection();

  // Resolves once connected; rejects on the first connection error.
  await once(redis, 'ready');

  await checkRedisConnection();

  console.log('Redis connection successful.');
} catch (error: unknown) {
  console.error('Redis connection failed.');
  console.error(error);

  process.exitCode = 1;
} finally {
  if (redis.isReady) {
    await redis.quit();
  } else if (redis.isOpen) {
    // Stop any background connection or reconnection attempts.
    redis.destroy();
  }
}
