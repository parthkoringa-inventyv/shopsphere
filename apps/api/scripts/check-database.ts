import { checkDatabaseConnection } from '../src/config/database.js';
import { prisma } from '../src/config/prisma.js';

try {
  await checkDatabaseConnection();
  console.log('PostgreSQL connection successful.');
} catch (error: unknown) {
  console.error('PostgreSQL connection failed.');
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
