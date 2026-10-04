import React from 'react';
import { db } from '@/lib/db';
import ConfigFormClient from './ConfigFormClient';

export const revalidate = 30;

export default async function ConfiguracoesPage() {
  let event = null as Awaited<ReturnType<typeof db.event.findFirst>>;
  try {
    event = await db.event.findFirst();
  } catch (err: unknown) {
    console.error('[Configuracoes] DB error:', err instanceof Error ? err.message : String(err));
  }

  if (!event) {
    return (
      <div className="bg-[#f9ebe8] text-forest-berry p-6 rounded-2xl border border-[#ebc6be]">
        Nenhum evento encontrado. Configure a variável DATABASE_URL e recarregue.
      </div>
    );
  }

  return <ConfigFormClient event={event} />;
}
