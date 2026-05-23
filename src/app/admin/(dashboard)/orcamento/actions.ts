'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const revalidateAll = () => {
  revalidatePath('/admin/orcamento');
  revalidatePath('/admin/dashboard');
};

export async function createExpense(data: {
  description: string;
  category: string;
  plannedValue: number;
  vendorId?: string;
}) {
  try {
    if (!data.description.trim()) {
      return { success: false, error: 'A descrição é obrigatória.' };
    }

    // Se tiver fornecedor, busca o valor real dele automaticamente
    let actualValue = 0;
    if (data.vendorId) {
      const vendor = await db.vendor.findUnique({ where: { id: data.vendorId } });
      actualValue = vendor?.agreedValue ?? 0;
    }

    await db.expense.create({
      data: {
        description: data.description.trim(),
        category: data.category || 'Geral',
        plannedValue: Math.max(0, Number(data.plannedValue) || 0),
        actualValue,
        paid: false,
        vendorId: data.vendorId || null,
      },
    });

    revalidateAll();
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
    vendorId?: string;
  }
) {
  try {
    if (!data.description.trim()) {
      return { success: false, error: 'A descrição é obrigatória.' };
    }

    // Valor real sempre vem do fornecedor vinculado
    let actualValue = 0;
    if (data.vendorId) {
      const vendor = await db.vendor.findUnique({ where: { id: data.vendorId } });
      actualValue = vendor?.agreedValue ?? 0;
    }

    await db.expense.update({
      where: { id },
      data: {
        description: data.description.trim(),
        category: data.category || 'Geral',
        plannedValue: Math.max(0, Number(data.plannedValue) || 0),
        actualValue,
        paid: false, // status derivado dos pagamentos do fornecedor
        vendorId: data.vendorId || null,
      },
    });

    revalidateAll();
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar despesa:', error);
    return { success: false, error: 'Erro ao atualizar despesa.' };
  }
}

export async function deleteExpense(id: string) {
  try {
    await db.expense.delete({ where: { id } });
    revalidateAll();
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar despesa:', error);
    return { success: false, error: 'Erro ao deletar despesa.' };
  }
}
