'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { type FamilyMember, familyNameFromMembers, isValidChildAge } from '@/lib/guests';

const revalidateAll = () => {
  revalidatePath('/admin/convidados');
  revalidatePath('/admin/dashboard');
};

/** Limpa a lista vinda do formulário e valida: ao menos um membro, idade de criança entre 0 e 17. */
function normalizeMembers(raw: FamilyMember[] | undefined): { members: FamilyMember[]; error?: string } {
  const members = (raw ?? [])
    .map(m => ({
      name: m.name.trim(),
      type: m.type,
      confirmed: !!m.confirmed,
      ...(m.type === 'crianca' && { age: m.age ?? null }),
    }))
    .filter(m => m.name);
  if (members.length === 0) return { members, error: 'Adicione pelo menos um membro da família.' };
  const idadeInvalida = members.find(m => m.type === 'crianca' && m.age != null && !isValidChildAge(m.age));
  if (idadeInvalida) return { members, error: `Idade inválida para ${idadeInvalida.name}.` };
  return { members };
}

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
  name?: string;
  phone?: string;
  status: string;
  origin: string;
  notes?: string;
  familyMembers: FamilyMember[];
}) {
  try {
    const { members, error } = normalizeMembers(data.familyMembers);
    if (error) return { success: false, error };

    const event = await db.event.findFirst();
    if (!event) return { success: false, error: 'Configure os dados do evento primeiro.' };

    const counts = countFromMembers(members, data.status);

    await db.guest.create({
      data: {
        // Nome da família é opcional: sem ele, usa os nomes dos membros
        name:          data.name?.trim() || familyNameFromMembers(members),
        phone:         data.phone?.trim() || '',
        status:        data.status || 'pendente',
        origin:        data.origin || 'manual',
        notes:         data.notes?.trim() || '',
        familyMembers: JSON.stringify(members),
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
    name?: string;
    phone?: string;
    status: string;
    notes?: string;
    familyMembers: FamilyMember[];
  }
) {
  try {
    const { members, error } = normalizeMembers(data.familyMembers);
    if (error) return { success: false, error };

    const original = await db.guest.findUnique({ where: { id } });
    if (!original) return { success: false, error: 'Convidado não encontrado.' };

    const counts = countFromMembers(members, data.status);

    let respondedAt = original.respondedAt;
    if (data.status !== 'pendente' && original.status === 'pendente') respondedAt = new Date();
    if (data.status === 'pendente') respondedAt = null;

    await db.guest.update({
      where: { id },
      data: {
        name:          data.name?.trim() || familyNameFromMembers(members),
        phone:         data.phone?.trim() || '',
        status:        data.status,
        notes:         data.notes?.trim() || '',
        familyMembers: JSON.stringify(members),
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
