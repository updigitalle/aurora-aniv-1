import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Normaliza a connection string para o Supabase.
 *
 * O pooler em modo TRANSAÇÃO (porta 6543) não suporta prepared statements
 * e, em serverless, causa erros intermitentes `Invalid \`prisma...\`` e
 * timeouts de pool (a página fica 15 s tentando pegar conexão).
 *
 * O pooler em modo SESSÃO (porta 5432) suporta tudo que o Prisma precisa
 * e é estável em serverless para 1 usuário. Então, se a DATABASE_URL
 * apontar para 6543, reescrevemos para 5432 e removemos `pgbouncer=true`.
 * A senha continua vindo da variável de ambiente — nada é hardcoded aqui.
 */
function normalizeUrl(raw: string): string {
  if (!raw) return raw;

  let url = raw;

  // Pooler de transação (6543) → pooler de sessão (5432)
  if (url.includes('pooler.supabase.com:6543')) {
    url = url.replace('pooler.supabase.com:6543', 'pooler.supabase.com:5432');
    // pgbouncer=true só faz sentido no modo transação; remove no modo sessão
    url = url.replace(/([?&])pgbouncer=true&?/i, (_m, sep) => (sep === '?' ? '?' : '&'));
    url = url.replace(/[?&]$/,'');
  }

  // connection_limit=1 por instância serverless (modo sessão segura a conexão)
  if (!url.includes('connection_limit')) {
    url += (url.includes('?') ? '&' : '?') + 'connection_limit=1';
  }
  // Falha rápido em vez de pendurar
  if (!url.includes('connect_timeout')) {
    url += '&connect_timeout=10';
  }
  if (!url.includes('pool_timeout')) {
    url += '&pool_timeout=10';
  }

  return url;
}

if (!process.env.DATABASE_URL) {
  console.error('[DB] ❌ DATABASE_URL is not set! Prisma will fail to connect.');
} else {
  const masked = normalizeUrl(process.env.DATABASE_URL).replace(/:([^@]+)@/, ':***@');
  console.log('[DB] ✅ DATABASE_URL (normalizada):', masked);
}

function buildClient() {
  const url = normalizeUrl(process.env.DATABASE_URL ?? '');

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

// Cache em globalThis — reaproveita a conexão entre requests na mesma
// instância serverless (o cold-start só paga uma vez).
export const db = globalThis.__prisma ?? buildClient();
globalThis.__prisma = db;
