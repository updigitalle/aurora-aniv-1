'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateEventConfig(
  id: string,
  data: {
    name: string;
    babyName: string;
    slug: string;
    date: string; // ISO String from form
    locationName: string;
    locationAddress: string;
    locationMapUrl?: string;
    description?: string;
    bgImage?: string;
  }
) {
  try {
    if (!data.name.trim() || !data.babyName.trim() || !data.slug.trim()) {
      return { success: false, error: 'Nome do evento, nome do bebê e link (slug) são obrigatórios.' };
    }

    // Validar slug formato (apenas letras, números, hífen)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(data.slug.trim())) {
      return { success: false, error: 'O link (slug) deve conter apenas letras minúsculas, números e hífens.' };
    }

    // Verificar se o slug já está sendo usado por outro evento
    const existingSlug = await db.event.findFirst({
      where: {
        slug: data.slug.trim(),
        NOT: { id },
      },
    });

    if (existingSlug) {
      return { success: false, error: 'Este link (slug) já está em uso por outro evento. Escolha outro.' };
    }

    await db.event.update({
      where: { id },
      data: {
        name: data.name.trim(),
        babyName: data.babyName.trim(),
        slug: data.slug.trim(),
        date: new Date(data.date),
        locationName: data.locationName.trim(),
        locationAddress: data.locationAddress.trim(),
        locationMapUrl: data.locationMapUrl?.trim() || '',
        description: data.description?.trim() || '',
        bgImage: data.bgImage?.trim() || '',
      },
    });

    revalidatePath('/admin/configuracoes');
    revalidatePath('/admin/dashboard');
    revalidatePath(`/convite/${data.slug.trim()}`);
    revalidatePath(`/convite/${data.slug.trim()}/rsvp`);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar configurações do evento:', error);
    return { success: false, error: 'Erro ao atualizar configurações.' };
  }
}
