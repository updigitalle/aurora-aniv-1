import React from 'react';
import { db } from '@/lib/db';
import GuestListClient from './GuestListClient';

export const revalidate = 30;

export default async function ConvidadosPage() {
  let guests = [] as Awaited<ReturnType<typeof db.guest.findMany>>;
  try {
    guests = await db.guest.findMany({ orderBy: { name: 'asc' } });
  } catch (err: unknown) {
    console.error('[Convidados] DB error:', err instanceof Error ? err.message : String(err));
  }

  return <GuestListClient initialGuests={guests} />;
}
