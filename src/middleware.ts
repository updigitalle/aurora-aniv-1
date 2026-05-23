import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptSession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Se for a rota principal de admin (login)
  if (pathname === '/admin') {
    const sessionCookie = request.cookies.get('admin_session')?.value;
    if (sessionCookie) {
      const session = await decryptSession(sessionCookie);
      if (session) {
        // Redireciona para o dashboard se já estiver logado
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // Se for qualquer outra rota sob /admin
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('admin_session')?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    const session = await decryptSession(sessionCookie);
    if (!session) {
      // Cookie inválido ou expirado
      const response = NextResponse.redirect(new URL('/admin', request.url));
      response.cookies.delete('admin_session');
      return response;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
