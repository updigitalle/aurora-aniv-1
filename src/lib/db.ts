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

function addParam(url: string, key: string, value: string) {
  if (url.includes(key)) return url;
  return url.includes('?') ? `${url}&${key}=${value}` : `${url}?${key}=${value}`;
}

function buildClient() {
  let url = process.env.DATABASE_URL ?? '';

  // For serverless (Vercel): small pool, short timeouts so pages fail fast
  // instead of hanging for 15 s waiting for a connection.
  url = addParam(url, 'connection_limit', '3');   // allow a few concurrent queries
  url = addParam(url, 'pool_timeout',    '8');    // fail after 8 s, not 15
  url = addParam(url, 'connect_timeout', '8');    // TCP connect timeout

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

// Always cache in globalThis — reuses the connection pool across requests
// within the same serverless function instance (cold-start only pays once).
export const db = globalThis.__prisma ?? buildClient();
globalThis.__prisma = db;
