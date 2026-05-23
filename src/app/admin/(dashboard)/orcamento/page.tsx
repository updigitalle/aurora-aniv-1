import React from 'react';
import { db } from '@/lib/db';
import BudgetClient from './BudgetClient';

export const revalidate = 0;

export default async function OrcamentoPage() {
  const expenses = await db.expense.findMany({
    include: {
      vendor: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const vendors = await db.vendor.findMany({
    orderBy: { name: 'asc' },
  });

  return <BudgetClient initialExpenses={expenses} vendors={vendors} />;
}
