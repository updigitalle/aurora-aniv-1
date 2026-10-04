import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

import { type FamilyMember, isValidChildAge, countsFromMembers, familyNameFromMembers } from '@/lib/guests';

// Limites para o formulário público (o link é aberto, qualquer um com ele pode enviar)
const MAX_PEOPLE = 15;
const MAX_NAME = 80;

type SentMember = { name?: unknown; type?: unknown; age?: unknown };

// ─── Confirmação de presença pelo link ─────────────────────────────────────────
// O convidado cadastra quem vai: nome, adulto ou criança e, se criança, a idade.
// POST /api/rsvp  { slug, status, members: [{ name, type, age? }], phone?, website? }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, status, members, phone, website } = body as {
      slug?: string;
      status?: string;
      members?: SentMember[];
      phone?: string;
      website?: string;
    };

    // Campo invisível: só robôs preenchem. Finge sucesso para não dar pista.
    if (website) return NextResponse.json({ success: true });

    if (!slug) return NextResponse.json({ error: 'Evento inválido.' }, { status: 400 });
    if (status !== 'confirmado' && status !== 'nao_vai') {
      return NextResponse.json({ error: 'Confirmação inválida.' }, { status: 400 });
    }

    const event = await db.event.findUnique({ where: { slug } });
    if (!event) return NextResponse.json({ error: 'Evento não encontrado.' }, { status: 404 });

    // Limpa a lista: só adulto ou criança; idade apenas para criança
    const list: FamilyMember[] = (Array.isArray(members) ? members : [])
      .map(m => {
        const name = typeof m?.name === 'string' ? m.name.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME) : '';
        const type = m?.type === 'crianca' ? 'crianca' : 'adulto';
        const age = typeof m?.age === 'number' ? m.age : m?.age === '' || m?.age == null ? null : Number(m.age);
        return {
          name,
          type,
          confirmed: status === 'confirmado',
          ...(type === 'crianca' && { age: isValidChildAge(age) ? age : null }),
        } as FamilyMember;
      })
      .filter(m => m.name);

    if (list.length === 0) {
      return NextResponse.json({ error: 'Informe pelo menos um nome.' }, { status: 400 });
    }
    if (list.length > MAX_PEOPLE) {
      return NextResponse.json(
        { error: `Envie no máximo ${MAX_PEOPLE} pessoas por confirmação.` },
        { status: 400 }
      );
    }

    // Toda criança que vai precisa de idade: até 5 anos não entra no buffet
    if (status === 'confirmado') {
      const semIdade = list.find(m => m.type === 'crianca' && !isValidChildAge(m.age));
      if (semIdade) {
        return NextResponse.json({ error: `Informe a idade de ${semIdade.name}.` }, { status: 400 });
      }
    }

    const counts = countsFromMembers(list, status);

    const guest = await db.guest.create({
      data: {
        name: familyNameFromMembers(list),
        phone: typeof phone === 'string' ? phone.trim().slice(0, 30) : '',
        status,
        origin: 'rsvp_online',
        familyMembers: JSON.stringify(list),
        adultsCount: counts.adultsCount,
        childrenCount: counts.childrenCount,
        respondedAt: new Date(),
        eventId: event.id,
      },
    });

    return NextResponse.json({ success: true, guest: { id: guest.id, name: guest.name, status: guest.status } });
  } catch (error) {
    console.error('Erro no processamento do RSVP:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar sua presença. Tente novamente.' },
      { status: 500 }
    );
  }
}
