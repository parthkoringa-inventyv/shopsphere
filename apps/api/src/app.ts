import express, { type Express } from 'express';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import helmet from 'helmet';
import cors from 'cors';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { healthRouter } from './modules/health/health.route.js';
import { notFoundHandler } from './common/middleware/not-found.middleware.js';
import { errorHandler } from './common/middleware/error.middleware.js';

export function createApp(): Express {
  const app = express();

  // Hide Express technology information.
  app.disable('x-powered-by');

  app.use(
    pinoHttp({
      logger,
      genReqId: (_req, res) => {
        const requestId = randomUUID();
        res.setHeader('X-Request-Id', requestId);
        return requestId;
      },
    }),
  );

  // Add security-related HTTP headers.
  app.use(helmet());

  // Allow requests from the configured frontend origin.
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
    }),
  );

  // Parse incoming JSON request bodies.
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/v1/health', healthRouter);

  // hanle unknown routes
  app.use(notFoundHandler);

  // handle errors
  app.use(errorHandler);

  return app;
}
