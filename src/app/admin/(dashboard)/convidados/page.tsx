import React from 'react';
import { db } from '@/lib/db';
import GuestListClient from './GuestListClient';

export const revalidate = 0;

export default async function ConvidadosPage() {
  const guests = await db.guest.findMany({
    orderBy: { name: 'asc' },
  });

  return <GuestListClient initialGuests={guests} />;
}
