'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function deleteGuest(id: string) {
  try {
    await db.guest.delete({
      where: { id },
    });
    revalidatePath('/admin/convidados');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar convidado:', error);
    return { success: false, error: 'Erro ao deletar convidado.' };
  }
}

export async function createGuest(data: {
  name: string;
  phone?: string;
  adultsCount: number;
  childrenCount: number;
  status: string;
  origin: string;
  notes?: string;
}) {
  try {
    if (!data.name.trim()) {
      return { success: false, error: 'O nome do convidado é obrigatório.' };
    }

    const event = await db.event.findFirst();
    if (!event) {
      return { success: false, error: 'Configure os dados do evento primeiro.' };
    }

    await db.guest.create({
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || '',
        adultsCount: data.status === 'confirmado' ? Math.max(1, data.adultsCount) : 0,
        childrenCount: data.status === 'confirmado' ? Math.max(0, data.childrenCount) : 0,
        status: data.status || 'pendente',
        origin: data.origin || 'manual',
        notes: data.notes?.trim() || '',
        respondedAt: data.status !== 'pendente' ? new Date() : null,
        eventId: event.id,
      },
    });

    revalidatePath('/admin/convidados');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar convidado:', error);
    return { success: false, error: 'Erro ao criar convidado.' };
  }
}

export async function updateGuest(
  id: string,
  data: {
    name: string;
    phone?: string;
    adultsCount: number;
    childrenCount: number;
    status: string;
    notes?: string;
  }
) {
  try {
    if (!data.name.trim()) {
      return { success: false, error: 'O nome do convidado é obrigatório.' };
    }

    const originalGuest = await db.guest.findUnique({ where: { id } });
    if (!originalGuest) {
      return { success: false, error: 'Convidado não encontrado.' };
    }

    // Se mudou de pendente para confirmado/recusado, ou se atualizou, marca a data de resposta
    let respondedAt = originalGuest.respondedAt;
    if (data.status !== 'pendente' && originalGuest.status === 'pendente') {
      respondedAt = new Date();
    } else if (data.status === 'pendente') {
      respondedAt = null;
    }

    await db.guest.update({
      where: { id },
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || '',
        adultsCount: data.status === 'confirmado' ? Math.max(1, data.adultsCount) : 0,
        childrenCount: data.status === 'confirmado' ? Math.max(0, data.childrenCount) : 0,
        status: data.status,
        notes: data.notes?.trim() || '',
        respondedAt,
      },
    });

    revalidatePath('/admin/convidados');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao editar convidado:', error);
    return { success: false, error: 'Erro ao editar convidado.' };
  }
}
