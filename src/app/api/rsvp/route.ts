import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Member = { name: string; type: 'adulto' | 'crianca' | 'bebe'; confirmed: boolean };

const parseMembers = (raw: string | null): Member[] => {
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
};

// ─── Busca de convidados pré-cadastrados (somente quem está na lista) ──────────
// GET /api/rsvp?slug=<slug>&q=<termo>
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || '';
    const q = (searchParams.get('q') || '').trim();

    if (!slug) return NextResponse.json({ error: 'Evento inválido.' }, { status: 400 });
    if (q.length < 2) return NextResponse.json({ results: [] });

    const event = await db.event.findUnique({ where: { slug } });
    if (!event) return NextResponse.json({ error: 'Evento não encontrado.' }, { status: 404 });

    // Busca pelo nome da família OU pelo nome de um membro (guardado no JSON).
    const guests = await db.guest.findMany({
      where: {
        eventId: event.id,
        OR: [
          { name:          { contains: q, mode: 'insensitive' } },
          { familyMembers: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
      take: 20,
    });

    const results = guests.map(g => ({
      id: g.id,
      name: g.name,
      status: g.status,
      members: parseMembers(g.familyMembers as string | null),
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Erro na busca de RSVP:', error);
    return NextResponse.json({ error: 'Erro ao buscar. Tente novamente.' }, { status: 500 });
  }
}

// ─── Confirmação de presença (somente convidados já cadastrados) ───────────────
// POST /api/rsvp  { guestId, status, members?, phone? }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guestId, status, members, phone } = body as {
      guestId?: string;
      status?: string;
      members?: Member[];
      phone?: string;
    };

    if (!guestId) {
      return NextResponse.json(
        { error: 'Convidado não identificado. Busque seu nome na lista.' },
        { status: 400 }
      );
    }
    if (status !== 'confirmado' && status !== 'nao_vai') {
      return NextResponse.json({ error: 'Confirmação inválida.' }, { status: 400 });
    }

    const guest = await db.guest.findUnique({ where: { id: guestId } });
    if (!guest) {
      return NextResponse.json(
        { error: 'Não encontramos seu cadastro. Fale com os anfitriões.' },
        { status: 404 }
      );
    }

    // Membros originais (fonte da verdade — não confiamos só no que vem do cliente)
    const original = parseMembers(guest.familyMembers as string | null);

    // Marca confirmados conforme a escolha; nenhum membro novo pode ser criado aqui.
    const confirmSet = new Set(
      (members ?? []).filter(m => m.confirmed).map(m => `${m.type}::${m.name}`)
    );
    const updatedMembers: Member[] = original.map(m => ({
      ...m,
      confirmed: status === 'confirmado' ? confirmSet.has(`${m.type}::${m.name}`) : false,
    }));

    // Contagem: bebês NÃO ocupam vaga.
    const counts = status === 'confirmado'
      ? {
          adultsCount:   updatedMembers.filter(m => m.confirmed && m.type === 'adulto').length,
          childrenCount: updatedMembers.filter(m => m.confirmed && m.type === 'crianca').length,
        }
      : { adultsCount: 0, childrenCount: 0 };

    // Se não há membros cadastrados (família "avulsa"), confirma a família inteira.
    const adultsCount = original.length === 0 && status === 'confirmado'
      ? Math.max(1, guest.adultsCount || 1)
      : counts.adultsCount;
    const childrenCount = original.length === 0 ? guest.childrenCount : counts.childrenCount;

    const updated = await db.guest.update({
      where: { id: guestId },
      data: {
        status,
        origin: 'rsvp_online',
        phone: phone?.trim() ? phone.trim() : guest.phone,
        familyMembers: original.length > 0 ? JSON.stringify(updatedMembers) : guest.familyMembers,
        adultsCount: status === 'confirmado' ? adultsCount : 0,
        childrenCount: status === 'confirmado' ? childrenCount : 0,
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, guest: { id: updated.id, name: updated.name, status: updated.status } });
  } catch (error) {
    console.error('Erro no processamento do RSVP:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar sua presença. Tente novamente.' },
      { status: 500 }
    );
  }
}
