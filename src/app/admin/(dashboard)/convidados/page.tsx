import React from 'react';
import { db } from '@/lib/db';
import GuestListClient from './GuestListClient';

// Painel mostra dados ao vivo (RSVP, pagamentos): sem isso o Next gera a página no build
// e serve uma versão em cache, e confirmações novas demoram a aparecer.
export const dynamic = 'force-dynamic';

export default async function ConvidadosPage() {
  let guests = [] as Awaited<ReturnType<typeof db.guest.findMany>>;
  try {
    guests = await db.guest.findMany({ orderBy: { name: 'asc' } });
  } catch (err: unknown) {
    console.error('[Convidados] DB error:', err instanceof Error ? err.message : String(err));
  }

  return <GuestListClient initialGuests={guests} />;
}
