'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export type FamilyMember = {
  name: string;
  type: 'adulto' | 'crianca';
  confirmed: boolean;
};

const revalidateAll = () => {
  revalidatePath('/admin/convidados');
  revalidatePath('/admin/dashboard');
};

/** Calcula adultsCount e childrenCount a partir dos membros confirmados */
function countFromMembers(members: FamilyMember[], status: string) {
  if (members.length === 0) return { adultsCount: 0, childrenCount: 0 };
  const confirmed = status === 'confirmado' ? members.filter(m => m.confirmed) : members;
  return {
    adultsCount:   confirmed.filter(m => m.type === 'adulto').length,
    childrenCount: confirmed.filter(m => m.type === 'crianca').length,
  };
}

export async function createGuest(data: {
  name: string;
  phone?: string;
  status: string;
  origin: string;
  notes?: string;
  familyMembers?: FamilyMember[];
  adultsCount?: number;
  childrenCount?: number;
}) {
  try {
    if (!data.name.trim()) return { success: false, error: 'O nome é obrigatório.' };

    const event = await db.event.findFirst();
    if (!event) return { success: false, error: 'Configure os dados do evento primeiro.' };

    const members = data.familyMembers ?? [];
    const counts = members.length > 0
      ? countFromMembers(members, data.status)
      : {
          adultsCount:   data.status === 'confirmado' ? (data.adultsCount ?? 1) : 0,
          childrenCount: data.status === 'confirmado' ? (data.childrenCount ?? 0) : 0,
        };

    await db.guest.create({
      data: {
        name:          data.name.trim(),
        phone:         data.phone?.trim() || '',
        status:        data.status || 'pendente',
        origin:        data.origin || 'manual',
        notes:         data.notes?.trim() || '',
        familyMembers: members.length > 0 ? JSON.stringify(members) : null,
        adultsCount:   counts.adultsCount,
        childrenCount: counts.childrenCount,
        respondedAt:   data.status !== 'pendente' ? new Date() : null,
        eventId:       event.id,
      },
    });

    revalidateAll();
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
    status: string;
    notes?: string;
    familyMembers?: FamilyMember[];
    adultsCount?: number;
    childrenCount?: number;
  }
) {
  try {
    if (!data.name.trim()) return { success: false, error: 'O nome é obrigatório.' };

    const original = await db.guest.findUnique({ where: { id } });
    if (!original) return { success: false, error: 'Convidado não encontrado.' };

    const members = data.familyMembers ?? [];
    const counts = members.length > 0
      ? countFromMembers(members, data.status)
      : {
          adultsCount:   data.status === 'confirmado' ? (data.adultsCount ?? 1) : 0,
          childrenCount: data.status === 'confirmado' ? (data.childrenCount ?? 0) : 0,
        };

    let respondedAt = original.respondedAt;
    if (data.status !== 'pendente' && original.status === 'pendente') respondedAt = new Date();
    if (data.status === 'pendente') respondedAt = null;

    await db.guest.update({
      where: { id },
      data: {
        name:          data.name.trim(),
        phone:         data.phone?.trim() || '',
        status:        data.status,
        notes:         data.notes?.trim() || '',
        familyMembers: members.length > 0 ? JSON.stringify(members) : null,
        adultsCount:   counts.adultsCount,
        childrenCount: counts.childrenCount,
        respondedAt,
      },
    });

    revalidateAll();
    return { success: true };
  } catch (error) {
    console.error('Erro ao editar convidado:', error);
    return { success: false, error: 'Erro ao editar convidado.' };
  }
}

export async function deleteGuest(id: string) {
  try {
    await db.guest.delete({ where: { id } });
    revalidateAll();
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar convidado:', error);
    return { success: false, error: 'Erro ao deletar convidado.' };
  }
}
