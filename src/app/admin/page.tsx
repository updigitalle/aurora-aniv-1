'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Heart, Sparkles, Lock } from 'lucide-react';

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
        // Redireciona para o dashboard se logado com sucesso
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Senha incorreta.');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center princess-gradient p-4 relative overflow-hidden">
      {/* Decorative magical elements */}
      <div className="absolute top-10 left-10 text-princess-pink-dark animate-float opacity-30">
        <Crown size={48} />
      </div>
      <div className="absolute bottom-10 right-10 text-princess-gold animate-float opacity-30" style={{ animationDelay: '1.5s' }}>
        <Sparkles size={48} />
      </div>
      <div className="absolute top-1/4 right-1/4 text-princess-rose animate-sparkle-1 opacity-20">
        <Heart size={24} />
      </div>
      <div className="absolute bottom-1/4 left-1/4 text-princess-gold-dark animate-sparkle-2 opacity-25">
        <Sparkles size={20} />
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl p-8 princess-card-shadow gold-border relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-princess-pink-light gold-border text-princess-rose mb-3 animate-float">
            <Crown size={32} className="text-princess-rose" />
          </div>
          <h1 className="font-serif-display text-3xl font-bold text-princess-text">
            Painel da Aurora
          </h1>
          <p className="text-sm text-princess-text/70 mt-2">
            Digite a senha mágica para organizar o reino
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-princess-text/80 mb-2">
              Senha de Acesso
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-princess-rose/60">
                <Lock size={18} />
              </span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha mágica..."
                required
                className="block w-full pl-10 pr-4 py-3 bg-white/50 border border-princess-rose/30 rounded-xl text-princess-text placeholder-princess-text/40 focus:outline-none focus:ring-2 focus:ring-princess-rose/40 focus:border-princess-rose transition duration-200"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-princess-rose to-princess-pink-dark hover:from-princess-pink-dark hover:to-princess-rose text-white font-medium rounded-xl shadow-md hover:shadow-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-princess-rose/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                Entrar no Reino
                <Sparkles size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-princess-text/40 flex items-center justify-center gap-1">
          Feito com <Heart size={10} className="text-princess-rose fill-princess-rose" /> para Aurora
        </div>
      </div>
    </main>
  );
}
