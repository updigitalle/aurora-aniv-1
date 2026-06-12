'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  TreePine,
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
  Heart
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const menuItems = [
    { name: 'Resumo', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Checklist', href: '/admin/tarefas', icon: CheckSquare },
    { name: 'Convidados', href: '/admin/convidados', icon: Users },
    { name: 'Orçamento', href: '/admin/orcamento', icon: Wallet },
    { name: 'Fornecedores', href: '/admin/fornecedores', icon: Building2 },
    { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
  ];

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
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-princess-rose to-princess-pink-dark text-white shadow-sm'
            : 'text-princess-text/70 hover:bg-princess-pink-light hover:text-princess-rose'
        }`}
      >
        <Icon size={20} />
        {item.name}
      </Link>
    );
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAF9F6] text-princess-text font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-princess-pink-light shrink-0">
        {/* Brand / Logo */}
        <div className="p-6 border-b border-princess-pink-light flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-princess-pink-light flex items-center justify-center text-princess-rose">
            <TreePine size={22} />
          </div>
          <div>
            <h1 className="font-serif-display font-bold text-lg text-princess-text leading-tight">1 Ano da Aurora</h1>
            <p className="text-xs text-princess-text/50">Bosque Encantado</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">{navLinks}</nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-princess-pink-light space-y-2">
          <Link
            href="/convite/aurora-1-ano"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-princess-pink-light hover:bg-princess-lilac/30 text-princess-rose font-medium rounded-xl text-sm transition duration-200"
          >
            <ExternalLink size={16} />
            Ver Convite Público
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-red-100 hover:bg-red-50 text-red-500 font-medium rounded-xl text-sm transition duration-200 disabled:opacity-50"
          >
            <LogOut size={16} />
            {loggingOut ? 'Saindo...' : 'Sair do Painel'}
          </button>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-princess-pink-light z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-princess-pink-light flex items-center justify-center text-princess-rose">
            <TreePine size={18} />
          </div>
          <h1 className="font-serif-display font-bold text-md text-princess-text">Aurora 1 Ano</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg border border-princess-pink-light text-princess-rose hover:bg-princess-pink-light transition"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar - Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <aside className="relative flex flex-col w-72 max-w-[80vw] bg-white h-full z-40 animate-in slide-in-from-left duration-200">
            <div className="p-6 border-b border-princess-pink-light flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-princess-pink-light flex items-center justify-center text-princess-rose">
                  <TreePine size={22} />
                </div>
                <div>
                  <h1 className="font-serif-display font-bold text-lg text-princess-text leading-tight">Aurora 1 Ano</h1>
                  <p className="text-xs text-princess-text/50">Painel de Controle</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg border border-princess-pink-light text-princess-rose hover:bg-princess-pink-light transition"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">{navLinks}</nav>

            <div className="p-6 border-t border-princess-pink-light space-y-2 shrink-0">
              <Link
                href="/convite/aurora-1-ano"
                target="_blank"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-princess-pink-light text-princess-rose font-medium rounded-xl text-sm"
              >
                <ExternalLink size={16} />
                Ver Convite
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-red-100 text-red-500 font-medium rounded-xl text-sm"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-x-hidden min-h-0">
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </div>
        <footer className="py-6 px-8 border-t border-princess-pink-light/40 text-center text-xs text-princess-text/40 flex items-center justify-center gap-1 shrink-0 bg-white/40">
          Feito com <Heart size={10} className="text-princess-rose fill-princess-rose" /> para o aniversário de 1 ano da Aurora
        </footer>
      </main>
    </div>
  );
}
