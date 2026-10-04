'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Wallet,
  Building2,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';

const menuItems = [
  { name: 'Resumo', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Checklist', href: '/admin/tarefas', icon: CheckSquare },
  { name: 'Convidados', href: '/admin/convidados', icon: Users },
  { name: 'Orçamento', href: '/admin/orcamento', icon: Wallet },
  { name: 'Fornecedores', href: '/admin/fornecedores', icon: Building2 },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
];

function Brand({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const img = size === 'lg' ? 52 : 40;
  return (
    <div className="flex items-center gap-3 min-w-0">
      <Image
        src="/convite/brasao.webp"
        alt=""
        width={img}
        height={img}
        unoptimized
        className="shrink-0 drop-shadow-sm"
      />
      <div className="min-w-0">
        <p className="font-serif-display text-princess-text leading-tight text-lg whitespace-nowrap">
          1 Aninho da Aurora
        </p>
        <p className="text-xs text-forest-sage-dark">Painel do bosque encantado</p>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Esc fecha o menu do celular
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair do painel?')) {
      setLoggingOut(true);
      try {
        await fetch('/api/admin/logout', { method: 'POST' });
        router.push('/admin');
        router.refresh();
      } catch (err) {
        console.error('Erro ao sair:', err);
      } finally {
        setLoggingOut(false);
      }
    }
  };

  const navLinks = menuItems.map((item) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-3 min-h-11 px-4 rounded-full font-semibold text-[0.95rem] transition-colors duration-200 ${
          isActive
            ? 'bg-princess-rose text-white shadow-sm'
            : 'text-princess-text/75 hover:bg-princess-pink-light hover:text-princess-text'
        }`}
      >
        <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
        {item.name}
      </Link>
    );
  });

  const footerActions = (
    <>
      <Link
        href="/convite/aurora-1-ano"
        target="_blank"
        onClick={() => setMobileMenuOpen(false)}
        className="flex items-center justify-center gap-2 w-full min-h-11 px-4 border border-princess-rose/40 text-princess-rose hover:bg-princess-pink-light font-semibold rounded-full text-sm transition-colors"
      >
        <ExternalLink size={16} />
        Ver convite público
      </Link>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="flex items-center justify-center gap-2 w-full min-h-11 px-4 text-princess-gold hover:bg-princess-gold-light font-semibold rounded-full text-sm transition-colors disabled:opacity-50"
      >
        <LogOut size={16} />
        {loggingOut ? 'Saindo...' : 'Sair do painel'}
      </button>
    </>
  );

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row gingham-soft text-princess-text font-sans">
      {/* Menu lateral: desktop */}
      <aside className="hidden lg:flex flex-col w-68 shrink-0 sticky top-0 h-dvh bg-[#fbfaf6]/95 border-r border-princess-pink">
        <div className="px-6 pt-7 pb-6">
          <Brand />
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto" aria-label="Navegação do painel">{navLinks}</nav>
        <div className="p-4 space-y-1.5 border-t border-princess-pink">{footerActions}</div>
      </aside>

      {/* Cabeçalho: celular e tablet */}
      <header className="lg:hidden flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-[#fbfaf6]/95 backdrop-blur border-b border-princess-pink z-20 sticky top-0">
        <Brand size="sm" />
        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={mobileMenuOpen}
          className="grid place-items-center w-11 h-11 rounded-full border border-princess-pink text-princess-text hover:bg-princess-pink-light transition-colors"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Menu: celular e tablet */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex" role="dialog" aria-modal="true" aria-label="Menu do painel">
          <div className="fixed inset-0 bg-princess-text/35 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative flex flex-col w-80 max-w-[85vw] bg-[#fbfaf6] h-full z-40 shadow-2xl painel-drawer">
            <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
              <Brand />
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fechar menu"
                className="grid place-items-center w-11 h-11 shrink-0 rounded-full text-princess-text hover:bg-princess-pink-light transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto" aria-label="Navegação do painel">{navLinks}</nav>
            <div className="p-4 space-y-1.5 border-t border-princess-pink shrink-0">{footerActions}</div>
          </aside>
        </div>
      )}

      {/* Conteúdo */}
      <main className="flex-1 flex flex-col min-w-0">
        <div key={pathname} className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9 max-w-7xl w-full mx-auto space-y-6 painel-enter">
          {children}
        </div>
        <footer className="py-6 px-6 text-center text-xs text-forest-sage-dark shrink-0">
          Feito com carinho para o 1º aniversário da Aurora
        </footer>
      </main>
    </div>
  );
}
