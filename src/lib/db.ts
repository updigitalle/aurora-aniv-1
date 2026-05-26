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

const client = new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

// Log the full error so we can see what's really failing in Vercel
client.$on('error', (e) => {
  console.error('[Prisma ERROR]', JSON.stringify({
    message: e.message,
    target: e.target,
  }));
});

client.$on('warn', (e) => {
  console.warn('[Prisma WARN]', e.message);
});

export const db = globalForPrisma.prisma ?? client;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
