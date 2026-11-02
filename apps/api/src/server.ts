import { createServer } from 'node:http';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { startRedisConnection } from './config/redis.js';

const app = createApp();
const server = createServer(app);

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
