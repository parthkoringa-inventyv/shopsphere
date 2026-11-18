import { existsSync } from 'node:fs';
import process from 'node:process';

import { defineConfig } from 'prisma/config';

// Load the shared environment file when it exists.
// Client generation must also work in a fresh clone without .env.
const envFile = '../../.env';

if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
  },

  datasource: {
    // Database-dependent commands still require a valid DATABASE_URL.
    // prisma generate does not need one.
    url: process.env.DATABASE_URL ?? '',
  },
});
