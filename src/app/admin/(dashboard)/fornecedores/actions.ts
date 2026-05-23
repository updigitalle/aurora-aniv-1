'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface VendorData {
  name: string;
  service: string;
  phone?: string;
  email?: string;
  status: string;
  agreedValue: number;
  depositValue?: number;
  paymentMethod: string;
  paymentDates?: string; // JSON string de datas
  notes?: string;
}

// ─── Vendor CRUD ──────────────────────────────────────────────────────────────

export async function createVendor(data: VendorData) {
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
        depositValue: Math.max(0, Number(data.depositValue) || 0),
        paymentMethod: data.paymentMethod || 'pix_unico',
        paymentDates: data.paymentDates || null,
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

export async function updateVendor(id: string, data: VendorData) {
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
        depositValue: Math.max(0, Number(data.depositValue) || 0),
        paymentMethod: data.paymentMethod || 'pix_unico',
        paymentDates: data.paymentDates || null,
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

export async function deleteVendor(id: string) {
  try {
    await db.vendor.delete({ where: { id } });
    revalidatePath('/admin/fornecedores');
    revalidatePath('/admin/orcamento');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar fornecedor:', error);
    return { success: false, error: 'Erro ao deletar fornecedor.' };
  }
}

// ─── Pagamentos ───────────────────────────────────────────────────────────────

export async function createPayment(data: {
  vendorId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string; // ISO string
  notes?: string;
}) {
  try {
    if (!data.vendorId || !data.amount || !data.paymentDate) {
      return { success: false, error: 'Dados de pagamento incompletos.' };
    }

    const vendor = await db.vendor.findUnique({ where: { id: data.vendorId } });
    if (!vendor) return { success: false, error: 'Fornecedor não encontrado.' };

    await db.payment.create({
      data: {
        vendorId: data.vendorId,
        amount: Math.max(0, Number(data.amount)),
        paymentMethod: data.paymentMethod,
        paymentDate: new Date(data.paymentDate),
        notes: data.notes?.trim() || '',
      },
    });

    // Calcular total pago após este pagamento
    const allPayments = await db.payment.findMany({ where: { vendorId: data.vendorId } });
    const totalPaid = allPayments.reduce((s, p) => s + p.amount, 0);

    // Atualizar status do vendor automaticamente se quitado
    if (totalPaid >= vendor.agreedValue) {
      await db.vendor.update({ where: { id: data.vendorId }, data: { status: 'pago' } });
    } else if (vendor.status === 'a_cotar') {
      await db.vendor.update({ where: { id: data.vendorId }, data: { status: 'contratado' } });
    }

    revalidatePath('/admin/fornecedores');
    revalidatePath('/admin/orcamento');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    return { success: false, error: 'Erro ao registrar pagamento.' };
  }
}

export async function deletePayment(id: string) {
  try {
    const payment = await db.payment.findUnique({ where: { id } });
    if (!payment) return { success: false, error: 'Pagamento não encontrado.' };

    await db.payment.delete({ where: { id } });

    // Recalcular status após exclusão
    const vendor = await db.vendor.findUnique({ where: { id: payment.vendorId } });
    if (vendor) {
      const remaining = await db.payment.findMany({ where: { vendorId: vendor.id } });
      const totalPaid = remaining.reduce((s, p) => s + p.amount, 0);
      const newStatus = totalPaid >= vendor.agreedValue ? 'pago' : totalPaid > 0 ? 'contratado' : vendor.status;
      await db.vendor.update({ where: { id: vendor.id }, data: { status: newStatus } });
    }

    revalidatePath('/admin/fornecedores');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir pagamento:', error);
    return { success: false, error: 'Erro ao excluir pagamento.' };
  }
}

// ─── Gerar despesa no Orçamento ───────────────────────────────────────────────

export async function createExpenseFromVendor(vendorId: string) {
  try {
    const vendor = await db.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) return { success: false, error: 'Fornecedor não encontrado.' };

    const existingExpense = await db.expense.findFirst({ where: { vendorId } });
    if (existingExpense) return { success: false, error: 'Este fornecedor já possui uma despesa no orçamento.' };

    let category = 'Geral';
    const s = vendor.service.toLowerCase();
    if (s.includes('buffet') || s.includes('bolo') || s.includes('doce') || s.includes('comida')) category = 'Comida';
    else if (s.includes('decora') || s.includes('balao') || s.includes('flores')) category = 'Decoração';
    else if (s.includes('foto') || s.includes('filme') || s.includes('musica') || s.includes('dj')) category = 'Serviços';
    else if (s.includes('salao') || s.includes('espaco') || s.includes('sitio')) category = 'Espaço';
    else if (s.includes('convite') || s.includes('papel')) category = 'Convites';
    else if (s.includes('roupa') || s.includes('vestido')) category = 'Vestuário';

    await db.expense.create({
      data: {
        description: `${vendor.service} — ${vendor.name}`,
        category,
        plannedValue: vendor.agreedValue,
        actualValue: vendor.status === 'pago' ? vendor.agreedValue : 0,
        paid: vendor.status === 'pago',
        vendorId: vendor.id,
      },
    });

    revalidatePath('/admin/fornecedores');
    revalidatePath('/admin/orcamento');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao gerar despesa:', error);
    return { success: false, error: 'Erro ao gerar despesa.' };
  }
}
