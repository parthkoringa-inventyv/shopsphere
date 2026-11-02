import express, { type Express } from 'express';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from './config/logger.js';
import { healthRouter } from './modules/health/health.route.js';

import { env } from './config/env.js';

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
  return app;
}
