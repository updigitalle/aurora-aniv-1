import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

if (!process.env.DATABASE_URL) {
  console.error('[DB] ❌ DATABASE_URL is not set! Prisma will fail to connect.');
} else {
  const masked = process.env.DATABASE_URL.replace(/:([^@]+)@/, ':***@');
  console.log('[DB] ✅ DATABASE_URL found:', masked);
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
