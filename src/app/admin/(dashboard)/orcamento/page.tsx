import React from 'react';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import BudgetClient from './BudgetClient';

export const revalidate = 0;

type ExpenseFull = Prisma.ExpenseGetPayload<{
  include: { vendor: { include: { payments: true } } };
}>;
type VendorWithPayments = Prisma.VendorGetPayload<{
  include: { payments: true };
}>;

export default async function OrcamentoPage() {
  let expenses: ExpenseFull[] = [];
  let vendors: VendorWithPayments[] = [];
  try {
    [expenses, vendors] = await Promise.all([
      db.expense.findMany({
        include: { vendor: { include: { payments: { orderBy: { paymentDate: 'asc' } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.vendor.findMany({ include: { payments: true }, orderBy: { name: 'asc' } }),
    ]);
  } catch (err: unknown) {
    console.error('[Orcamento] DB error:', err instanceof Error ? err.message : String(err));
  }

  return <BudgetClient initialExpenses={expenses} vendors={vendors} />;
}
