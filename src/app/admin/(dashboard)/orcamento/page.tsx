import React from 'react';
import { db } from '@/lib/db';
import BudgetClient from './BudgetClient';

export const revalidate = 0;

export default async function OrcamentoPage() {
  const expenses = await db.expense.findMany({
    include: {
      vendor: {
        include: {
          payments: { orderBy: { paymentDate: 'asc' } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const vendors = await db.vendor.findMany({
    include: {
      payments: true,
    },
    orderBy: { name: 'asc' },
  });

  return <BudgetClient initialExpenses={expenses} vendors={vendors} />;
}
