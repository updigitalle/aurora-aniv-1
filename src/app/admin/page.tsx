'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Senha incorreta.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh w-full flex items-center justify-center gingham-bg px-4 py-10">
      <div className="w-full max-w-sm flex flex-col items-center painel-enter">
        <Image
          src="/convite/brasao.webp"
          alt="Brasão do bosque encantado da Aurora"
          width={502}
          height={502}
          priority
          unoptimized
          className="w-44 sm:w-52 h-auto drop-shadow-sm"
        />

        <h1 className="font-serif-display text-3xl text-forest-sage mt-4 text-center">Painel da Aurora</h1>
        <p className="text-sm text-princess-text/75 mt-1 text-center">Digite a senha para entrar no bosque</p>

        <form
          onSubmit={handleSubmit}
          className="w-full mt-6 p-6 bg-[#fbfaf6]/90 backdrop-blur-sm border border-princess-pink rounded-3xl princess-card-shadow space-y-5"
        >
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-princess-text mb-2">
              Senha de acesso
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-olive pointer-events-none" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full min-h-12 pl-11 pr-4 bg-white border border-princess-lilac rounded-2xl text-base text-princess-text placeholder:text-princess-text/40 focus:outline-none focus:ring-4 focus:ring-princess-rose/20 focus:border-princess-rose transition"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="flex items-center gap-2 p-3 bg-[#f9ebe8] text-[#8a2f22] rounded-2xl text-sm border border-[#f1d5cf]">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-12 bg-princess-rose hover:bg-princess-pink-dark active:scale-[0.98] text-white font-semibold rounded-full shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-princess-rose/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
