import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Normaliza a connection string do Supabase para serverless (Vercel).
 *
 * Em serverless o modo correto é o pooler em MODO TRANSAÇÃO (porta 6543)
 * com `pgbouncer=true`. Esse modo multiplexa conexões e suporta centenas de
 * clientes simultâneos — ideal para várias lambdas concorrentes.
 *
 * O modo SESSÃO (porta 5432) segura uma conexão dedicada por cliente e o
 * limite é o pool_size (15). Com o dashboard fazendo queries em paralelo,
 * isso estoura rápido e gera o erro `EMAXCONNSESSION: max clients reached
 * in session mode`. Por isso forçamos o pooler para 6543 + pgbouncer=true.
 *
 * `pgbouncer=true` faz o Prisma desligar prepared statements, que é o que o
 * pooler de transação exige — sem isso dá erro `prepared statement already
 * exists`. A senha continua vindo da env — nada é hardcoded aqui.
 */
function normalizeUrl(raw: string): string {
  if (!raw) return raw;

  let url = raw;

  // Pooler do Supabase: garante MODO TRANSAÇÃO (6543).
  if (url.includes('pooler.supabase.com')) {
    // Sessão (5432) → Transação (6543)
    url = url.replace('pooler.supabase.com:5432', 'pooler.supabase.com:6543');

    // pgbouncer=true é obrigatório no modo transação com Prisma
    if (!/[?&]pgbouncer=true/i.test(url)) {
      url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }
  }

  // 1 conexão por instância serverless (o pooler de transação multiplexa).
  if (!/[?&]connection_limit=/i.test(url)) {
    url += (url.includes('?') ? '&' : '?') + 'connection_limit=1';
  }
  // Falha rápido em vez de pendurar.
  if (!/[?&]connect_timeout=/i.test(url)) {
    url += '&connect_timeout=10';
  }
  if (!/[?&]pool_timeout=/i.test(url)) {
    url += '&pool_timeout=10';
  }

  return url;
}

if (!process.env.DATABASE_URL) {
  console.error('[DB] ❌ DATABASE_URL is not set! Prisma will fail to connect.');
} else {
  const raw = process.env.DATABASE_URL;
  const masked = normalizeUrl(raw).replace(/:([^@]+)@/, ':***@');
  console.log('[DB] ✅ DATABASE_URL (normalizada):', masked);

  // A conexão DIRETA do Supabase (host db.<ref>.supabase.co) só resolve em
  // IPv6. As funções serverless da Vercel são IPv4, então NÃO conseguem
  // alcançar esse host e o Prisma falha com "Can't reach database server".
  // Em produção é obrigatório usar o Connection Pooler (host
  // aws-N-<regiao>.pooler.supabase.com), que é compatível com IPv4.
  if (/db\.[a-z0-9]+\.supabase\.co/i.test(raw)) {
    console.error(
      '[DB] ⚠️ DATABASE_URL usa a conexão DIRETA do Supabase (db.<ref>.supabase.co), ' +
        'que é IPv6-only e NÃO funciona em serverless (Vercel). ' +
        'Use a connection string do Pooler: aws-N-<regiao>.pooler.supabase.com:6543.',
    );
  }
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
