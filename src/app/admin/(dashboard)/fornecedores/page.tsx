import React from 'react';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import VendorListClient from './VendorListClient';

// Painel mostra dados ao vivo (RSVP, pagamentos): sem isso o Next gera a página no build
// e serve uma versão em cache, e confirmações novas demoram a aparecer.
export const dynamic = 'force-dynamic';

type VendorFull = Prisma.VendorGetPayload<{
  include: { expenses: true; payments: true };
}>;

export default async function FornecedoresPage() {
  let vendors: VendorFull[] = [];
  try {
    vendors = await db.vendor.findMany({
      include: {
        expenses: true,
        payments: { orderBy: { paymentDate: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err: unknown) {
    console.error('[Fornecedores] DB error:', err instanceof Error ? err.message : String(err));
  }

  return <VendorListClient initialVendors={vendors} />;
}
