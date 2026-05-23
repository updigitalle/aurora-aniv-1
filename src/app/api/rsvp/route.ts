import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // Implementar um rate limit simples por cookies para evitar spam no SQLite
    const ipHeader = request.headers.get('x-forwarded-for') || '';
    
    const body = await request.json();
    const { slug, name, phone, adultsCount, childrenCount, status, notes } = body;

    // Validações básicas de campos
    if (!slug || !name || !status) {
      return NextResponse.json(
        { error: 'Os campos Nome e Confirmação são obrigatórios.' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: 'Por favor, insira um nome válido.' },
        { status: 400 }
      );
    }

    if (status !== 'confirmado' && status !== 'nao_vai') {
      return NextResponse.json(
        { error: 'Status de confirmação inválido.' },
        { status: 400 }
      );
    }

    const parsedAdults = status === 'confirmado' ? Math.max(1, parseInt(adultsCount) || 1) : 0;
    const parsedChildren = status === 'confirmado' ? Math.max(0, parseInt(childrenCount) || 0) : 0;

    // Localizar o evento pelo slug
    const event = await db.event.findUnique({
      where: { slug },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado.' },
        { status: 404 }
      );
    }

    // Verificar se convidado com o mesmo nome já existe neste evento (evita duplicações)
    const existingGuest = await db.guest.findFirst({
      where: {
        eventId: event.id,
        name: {
          equals: trimmedName,
        },
      },
    });

    let result;
    if (existingGuest) {
      // Atualizar o RSVP existente
      result = await db.guest.update({
        where: { id: existingGuest.id },
        data: {
          phone: phone ? phone.trim() : existingGuest.phone,
          adultsCount: parsedAdults,
          childrenCount: parsedChildren,
          status,
          notes: notes ? notes.trim() : existingGuest.notes,
          respondedAt: new Date(),
        },
      });
    } else {
      // Criar nova confirmação
      result = await db.guest.create({
        data: {
          name: trimmedName,
          phone: phone ? phone.trim() : '',
          adultsCount: parsedAdults,
          childrenCount: parsedChildren,
          status,
          origin: 'rsvp_online',
          notes: notes ? notes.trim() : '',
          respondedAt: new Date(),
          eventId: event.id,
        },
      });
    }

    return NextResponse.json({ success: true, guest: result });
  } catch (error) {
    console.error('Erro no processamento do RSVP:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar sua presença. Por favor, tente novamente.' },
      { status: 500 }
    );
  }
}
