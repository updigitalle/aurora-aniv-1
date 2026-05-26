import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

if (!process.env.DATABASE_URL) {
  console.error('[DB] ❌ DATABASE_URL is not set! Prisma will fail to connect.');
} else {
  const masked = process.env.DATABASE_URL.replace(/:([^@]+)@/, ':***@');
  console.log('[DB] ✅ DATABASE_URL found:', masked);
}

function buildClient() {
  // Ensure connection_limit=1 for serverless / PgBouncer compatibility.
  // This stops Prisma opening a pool of connections from one function instance.
  const rawUrl = process.env.DATABASE_URL ?? '';
  const url = rawUrl.includes('connection_limit')
    ? rawUrl
    : rawUrl.includes('?')
      ? `${rawUrl}&connection_limit=1`
      : `${rawUrl}?connection_limit=1`;

  const client = new PrismaClient({
    datasources: { db: { url } },
    log: [
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

  client.$on('error', (e) => {
    console.error('[Prisma ERROR]', JSON.stringify({ message: e.message, target: e.target }));
  });

  client.$on('warn', (e) => {
    console.warn('[Prisma WARN]', e.message);
  });

  return client;
}

// Always cache in globalThis — prevents multiple clients being created
// across hot-reloads (dev) AND across requests in the same serverless
// function instance (production). Without this, every prod request
// opens a fresh connection to PgBouncer, exhausting the pool.
export const db = globalThis.__prisma ?? buildClient();
globalThis.__prisma = db;
