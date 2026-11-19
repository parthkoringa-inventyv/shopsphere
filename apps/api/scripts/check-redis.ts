import { checkRedisConnection, closeRedisConnection, startRedisConnection } from '../src/config/redis.js';
import { env } from '../src/config/env.js';

if (!env.REDIS_ENABLED) {
  console.error('Redis is disabled. Set REDIS_ENABLED=true to run this diagnostic.');
  process.exitCode = 1;
} else {
  try {
    await startRedisConnection();

    await checkRedisConnection();

    console.log('Redis connection successful.');
  } catch (error: unknown) {
    console.error('Redis connection failed.');
    console.error(error);

    process.exitCode = 1;
  } finally {
    await closeRedisConnection();
  }
}

