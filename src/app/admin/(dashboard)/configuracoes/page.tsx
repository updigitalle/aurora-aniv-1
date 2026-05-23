import React from 'react';
import { db } from '@/lib/db';
import ConfigFormClient from './ConfigFormClient';

export const revalidate = 0;

export default async function ConfiguracoesPage() {
  const event = await db.event.findFirst();

  if (!event) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-200">
        Nenhum evento encontrado no banco de dados. Por favor, execute o seed do banco de dados.
      </div>
    );
  }

  return <ConfigFormClient event={event} />;
}
