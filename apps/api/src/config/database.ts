import { prisma } from './prisma.js';

export async function checkDatabaseConnection(): Promise<void> {
  await prisma.$transaction(
    async (transaction) => {
      // Limit SQL execution time for this transaction only.
      await transaction.$executeRaw`SET LOCAL statement_timeout = '3000ms'`;

      await transaction.$queryRaw`SELECT 1`;
    },
    {
      maxWait: 1_000,
      timeout: 4_000,
    },
  );
}
