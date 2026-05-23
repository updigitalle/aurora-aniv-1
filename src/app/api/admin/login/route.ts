import { NextResponse } from 'next/server';
import { encryptSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const expectedPassword = process.env.ADMIN_PASSWORD || 'aurora-1-ano';

    if (password !== expectedPassword) {
      return NextResponse.json(
        { error: 'Senha incorreta. Tente novamente.' },
        { status: 401 }
      );
    }

    // Gerar token de sessão
    const sessionToken = await encryptSession({ role: 'admin' });

    const response = NextResponse.json({ success: true });

    // Definir cookie de sessão seguro
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 dia
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
