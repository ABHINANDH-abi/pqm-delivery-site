import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Create a singleton Prisma client instance.
// In development, attach it to `global` to prevent exhausting
// connection limits during hot-reloads (ts-node-dev restarts).

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: env.isDevelopment ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (env.isDevelopment) {
  global.__prisma = prisma;
}
