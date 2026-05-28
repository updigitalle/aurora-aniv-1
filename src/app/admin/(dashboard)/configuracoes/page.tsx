import React from 'react';
import { db } from '@/lib/db';
import ConfigFormClient from './ConfigFormClient';

export const revalidate = 0;

export default async function ConfiguracoesPage() {
  let event = null as Awaited<ReturnType<typeof db.event.findFirst>>;
  try {
    event = await db.event.findFirst();
  } catch (err: unknown) {
    console.error('[Configuracoes] DB error:', err instanceof Error ? err.message : String(err));
  }

  if (!event) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-200">
        Nenhum evento encontrado. Configure a variável DATABASE_URL e recarregue.
      </div>
    );
  }

  return <ConfigFormClient event={event} />;
}
