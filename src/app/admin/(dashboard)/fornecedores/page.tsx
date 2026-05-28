import React from 'react';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import VendorListClient from './VendorListClient';

export const revalidate = 0;

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
