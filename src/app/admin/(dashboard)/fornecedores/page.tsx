import React from 'react';
import { db } from '@/lib/db';
import VendorListClient from './VendorListClient';

export const revalidate = 0;

export default async function FornecedoresPage() {
  const vendors = await db.vendor.findMany({
    include: {
      expenses: true,
      payments: { orderBy: { paymentDate: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <VendorListClient initialVendors={vendors} />;
}
