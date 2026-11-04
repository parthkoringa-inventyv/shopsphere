import { createServer } from 'node:http';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { redis, startRedisConnection } from './config/redis.js';

const app = createApp();
const server = createServer(app);

let isShuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  logger.info({ signal }, 'Graceful shutdown started');

  // Stop accepting new requests and wait for existing requests to finish.
  try {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    logger.info('HTTP server closed');
  } catch (error: unknown) {
    process.exitCode = 1;
    logger.error({ err: error }, 'Failed to close HTTP server');
  }

  // Close external dependencies after HTTP requests have finished.
  const results = await Promise.allSettled([
    redis.isOpen ? redis.close() : Promise.resolve(),
    prisma.$disconnect(),
  ]);

  const dependencyNames = ['Redis', 'Prisma'];

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      process.exitCode = 1;

      logger.error(
        { err: result.reason, dependency: dependencyNames[index] },
        'Failed to close dependency connection',
      );
    }
  });

  logger.info('Graceful shutdown completed');
}

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});

// Start Redis without blocking HTTP server startup.
startRedisConnection();

server.listen(env.PORT, env.HOST, () => {
  logger.info(
    {
      host: env.HOST,
      port: env.PORT,
      environment: env.NODE_ENV,
    },
    'ShopSphere API server started',
  );
});
