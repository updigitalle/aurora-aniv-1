'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function deleteVendor(id: string) {
  try {
    await db.vendor.delete({
      where: { id },
    });
    revalidatePath('/admin/fornecedores');
    revalidatePath('/admin/orcamento');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar fornecedor:', error);
    return { success: false, error: 'Erro ao deletar fornecedor.' };
  }
}

export async function createVendor(data: {
  name: string;
  service: string;
  phone?: string;
  email?: string;
  status: string;
  agreedValue: number;
  notes?: string;
}) {
  try {
    if (!data.name.trim() || !data.service.trim()) {
      return { success: false, error: 'Nome e serviço são obrigatórios.' };
    }

    await db.vendor.create({
      data: {
        name: data.name.trim(),
        service: data.service.trim(),
        phone: data.phone?.trim() || '',
        email: data.email?.trim() || '',
        status: data.status || 'a_cotar',
        agreedValue: Math.max(0, Number(data.agreedValue) || 0),
        notes: data.notes?.trim() || '',
      },
    });

    revalidatePath('/admin/fornecedores');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    return { success: false, error: 'Erro ao criar fornecedor.' };
  }
}

export async function updateVendor(
  id: string,
  data: {
    name: string;
    service: string;
    phone?: string;
    email?: string;
    status: string;
    agreedValue: number;
    notes?: string;
  }
) {
  try {
    if (!data.name.trim() || !data.service.trim()) {
      return { success: false, error: 'Nome e serviço são obrigatórios.' };
    }

    await db.vendor.update({
      where: { id },
      data: {
        name: data.name.trim(),
        service: data.service.trim(),
        phone: data.phone?.trim() || '',
        email: data.email?.trim() || '',
        status: data.status,
        agreedValue: Math.max(0, Number(data.agreedValue) || 0),
        notes: data.notes?.trim() || '',
      },
    });

    revalidatePath('/admin/fornecedores');
    revalidatePath('/admin/orcamento');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao editar fornecedor:', error);
    return { success: false, error: 'Erro ao editar fornecedor.' };
  }
}

export async function createExpenseFromVendor(vendorId: string) {
  try {
    const vendor = await db.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return { success: false, error: 'Fornecedor não encontrado.' };
    }

    // Verificar se já existe uma despesa associada a este fornecedor
    const existingExpense = await db.expense.findFirst({
      where: { vendorId },
    });

    if (existingExpense) {
      return { success: false, error: 'Este fornecedor já possui uma despesa associada no orçamento.' };
    }

    // Definir categoria padrão baseada no serviço
    let category = 'Geral';
    const serviceLower = vendor.service.toLowerCase();
    if (serviceLower.includes('comida') || serviceLower.includes('buffet') || serviceLower.includes('bolo') || serviceLower.includes('doce')) {
      category = 'Comida';
    } else if (serviceLower.includes('decora') || serviceLower.includes('balao') || serviceLower.includes('flores')) {
      category = 'Decoração';
    } else if (serviceLower.includes('foto') || serviceLower.includes('filme') || serviceLower.includes('musica') || serviceLower.includes('som') || serviceLower.includes('dj')) {
      category = 'Serviços';
    } else if (serviceLower.includes('salao') || serviceLower.includes('espaco') || serviceLower.includes('sitio') || serviceLower.includes('chacara')) {
      category = 'Espaço';
    } else if (serviceLower.includes('convite') || serviceLower.includes('papel')) {
      category = 'Convites';
    } else if (serviceLower.includes('roupa') || serviceLower.includes('vestido') || serviceLower.includes('terno')) {
      category = 'Vestuário';
    }

    await db.expense.create({
      data: {
        description: `${vendor.service} - ${vendor.name}`,
        category,
        plannedValue: vendor.agreedValue,
        actualValue: vendor.status === 'contratado' || vendor.status === 'pago' ? vendor.agreedValue : 0,
        paid: vendor.status === 'pago',
        vendorId: vendor.id,
      },
    });

    revalidatePath('/admin/fornecedores');
    revalidatePath('/admin/orcamento');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao gerar despesa a partir do fornecedor:', error);
    return { success: false, error: 'Erro ao gerar despesa.' };
  }
}
