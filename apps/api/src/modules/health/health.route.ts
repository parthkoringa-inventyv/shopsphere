import { Router } from 'express';
import { checkDatabaseConnection } from '../../config/database.js';
import { checkRedisConnection } from '../../config/redis.js';
import { env } from '../../config/env.js';

const healthRouter = Router();

healthRouter.get('/live', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
    },
    meta: null,
  });
});

healthRouter.get('/ready', async (req, res) => {
  const databaseCheck = checkDatabaseConnection();
  const redisCheck = env.REDIS_ENABLED ? checkRedisConnection() : Promise.resolve();

  const [databaseResult, redisResult] = await Promise.allSettled([databaseCheck, redisCheck]);

  const unavailableDependencies: string[] = [];

  if (databaseResult.status === 'rejected') {
    unavailableDependencies.push('postgres');

    req.log.error({ err: databaseResult.reason }, 'PostgreSQL readiness check failed');
  }

  if (env.REDIS_ENABLED && redisResult.status === 'rejected') {
    unavailableDependencies.push('redis');

    req.log.error({ err: redisResult.reason }, 'Redis readiness check failed');
  }

  if (unavailableDependencies.length > 0) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'One or more required dependencies are unavailable.',
        details: null,
        requestId: String(req.id),
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      status: 'ready',
    },
    meta: null,
  });
});

export { healthRouter };
