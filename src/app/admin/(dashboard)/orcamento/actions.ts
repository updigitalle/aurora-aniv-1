'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function deleteExpense(id: string) {
  try {
    await db.expense.delete({
      where: { id },
    });
    revalidatePath('/admin/orcamento');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar despesa:', error);
    return { success: false, error: 'Erro ao deletar despesa.' };
  }
}

export async function createExpense(data: {
  description: string;
  category: string;
  plannedValue: number;
  actualValue: number;
  paid: boolean;
  vendorId?: string;
}) {
  try {
    if (!data.description.trim()) {
      return { success: false, error: 'A descrição da despesa é obrigatória.' };
    }

    await db.expense.create({
      data: {
        description: data.description.trim(),
        category: data.category || 'Geral',
        plannedValue: Math.max(0, Number(data.plannedValue) || 0),
        actualValue: Math.max(0, Number(data.actualValue) || 0),
        paid: data.paid || false,
        vendorId: data.vendorId || null,
      },
    });

    revalidatePath('/admin/orcamento');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar despesa:', error);
    return { success: false, error: 'Erro ao criar despesa.' };
  }
}

export async function updateExpense(
  id: string,
  data: {
    description: string;
    category: string;
    plannedValue: number;
    actualValue: number;
    paid: boolean;
    vendorId?: string;
  }
) {
  try {
    if (!data.description.trim()) {
      return { success: false, error: 'A descrição da despesa é obrigatória.' };
    }

    await db.expense.update({
      where: { id },
      data: {
        description: data.description.trim(),
        category: data.category || 'Geral',
        plannedValue: Math.max(0, Number(data.plannedValue) || 0),
        actualValue: Math.max(0, Number(data.actualValue) || 0),
        paid: data.paid,
        vendorId: data.vendorId || null,
      },
    });

    revalidatePath('/admin/orcamento');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar despesa:', error);
    return { success: false, error: 'Erro ao atualizar despesa.' };
  }
}
