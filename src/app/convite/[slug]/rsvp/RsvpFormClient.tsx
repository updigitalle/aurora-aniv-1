'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Crown,
  Heart,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Users,
  Smile,
  Frown,
  Sparkles
} from 'lucide-react';

interface RsvpFormClientProps {
  slug: string;
  babyName: string;
}

export default function RsvpFormClient({ slug, babyName }: RsvpFormClientProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'confirmado' | 'nao_vai' | null>(null);
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [notes, setNotes] = useState('');

  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor, preencha o seu nome.');
      return;
    }

    if (!status) {
      setError('Por favor, selecione se você irá ou não.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          phone: phone.trim(),
          status,
          adultsCount: status === 'confirmado' ? adultsCount : 0,
          childrenCount: status === 'confirmado' ? childrenCount : 0,
          notes: notes.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Ocorreu um erro ao enviar sua confirmação.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão. Por favor, verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-[2rem] p-8 princess-card-shadow border border-princess-pink-dark/20 text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 animate-float">
          <CheckCircle size={36} />
        </div>

        <div className="space-y-2">
          <h2 className="font-serif-display font-bold text-2xl text-princess-text">Resposta Registrada!</h2>
          {status === 'confirmado' ? (
            <p className="text-sm text-princess-text/80 leading-relaxed">
              Obrigado por confirmar! Sua presença foi guardada com carinho. Mal podemos esperar para celebrar o 1º aninho da{' '}
              <strong>Princesa {babyName}</strong> com você! 🎉👑
            </p>
          ) : (
            <p className="text-sm text-princess-text/80 leading-relaxed">
              Agradecemos a sua resposta. Sentiremos muito a sua falta nessa comemoração tão especial do reino da{' '}
              <strong>Princesa {babyName}</strong>. 💖
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-princess-pink-light/35">
          <Link
            href={`/convite/${slug}`}
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-princess-rose to-princess-pink-dark text-white font-semibold rounded-xl shadow-md transition"
          >
            <ChevronLeft size={16} />
            Voltar ao Convite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white/75 backdrop-blur-md rounded-[2.5rem] p-6 md:p-8 princess-card-shadow border border-princess-pink-dark/20 space-y-6">
      {/* Botão Voltar */}
      <Link
        href={`/convite/${slug}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-princess-rose hover:underline"
      >
        <ChevronLeft size={14} />
        Voltar para o convite
      </Link>

      {/* Header */}
      <div className="text-center space-y-2">
        <Crown className="mx-auto text-princess-gold animate-float" size={32} />
        <h1 className="font-serif-display text-2xl font-bold text-princess-text">Confirmação de Presença</h1>
        <p className="text-xs text-princess-text/60">Responda ao formulário abaixo para confirmar sua vinda</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-xs font-bold text-princess-text/70 uppercase tracking-wider mb-1">Seu Nome Completo *</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Digite seu nome ou da sua família..."
            className="w-full px-3.5 py-2.5 bg-white border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
          />
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-xs font-bold text-princess-text/70 uppercase tracking-wider mb-1">WhatsApp / Telefone</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Ex: 11999998888"
            className="w-full px-3.5 py-2.5 bg-white border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
          />
        </div>

        {/* Status Confirmação (Radio customizado) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-princess-text/70 uppercase tracking-wider">Você irá comparecer? *</label>
          <div className="grid grid-cols-2 gap-3">
            {/* Sim */}
            <button
              type="button"
              onClick={() => setStatus('confirmado')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                status === 'confirmado'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                  : 'bg-white border-princess-rose/15 text-princess-text/70 hover:bg-princess-pink-light/20'
              }`}
            >
              <Smile size={20} className={status === 'confirmado' ? 'text-emerald-600' : 'text-princess-rose'} />
              <span className="text-xs font-semibold">Sim, eu vou!</span>
            </button>

            {/* Não */}
            <button
              type="button"
              onClick={() => setStatus('nao_vai')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                status === 'nao_vai'
                  ? 'bg-red-50 border-red-300 text-red-700 shadow-sm'
                  : 'bg-white border-princess-rose/15 text-princess-text/70 hover:bg-princess-pink-light/20'
              }`}
            >
              <Frown size={20} className={status === 'nao_vai' ? 'text-red-500' : 'text-princess-rose'} />
              <span className="text-xs font-semibold">Não poderei ir</span>
            </button>
          </div>
        </div>

        {/* Quantidade Adultos e Crianças (Somente se Confirmado) */}
        {status === 'confirmado' && (
          <div className="bg-princess-pink-light/20 p-4 rounded-2xl border border-princess-pink-light/40 space-y-4 animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-princess-rose uppercase tracking-wider mb-2">
              <Users size={14} /> Quantos serão confirmados?
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Adultos */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/80 mb-1">Adultos</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdultsCount(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-princess-rose/25 text-princess-rose hover:bg-princess-pink-light/40 flex items-center justify-center font-bold text-lg transition"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-sm">{adultsCount}</span>
                  <button
                    type="button"
                    onClick={() => setAdultsCount(prev => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-princess-rose/25 text-princess-rose hover:bg-princess-pink-light/40 flex items-center justify-center font-bold text-lg transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Crianças */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/80 mb-1">Crianças (1-12 anos)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setChildrenCount(prev => Math.max(0, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-princess-rose/25 text-princess-rose hover:bg-princess-pink-light/40 flex items-center justify-center font-bold text-lg transition"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-sm">{childrenCount}</span>
                  <button
                    type="button"
                    onClick={() => setChildrenCount(prev => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-princess-rose/25 text-princess-rose hover:bg-princess-pink-light/40 flex items-center justify-center font-bold text-lg transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Observações */}
        <div>
          <label className="block text-xs font-bold text-princess-text/70 uppercase tracking-wider mb-1">
            Alguma observação?
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ex: Alergias alimentares ou restrições de dieta..."
            rows={2}
            className="w-full px-3.5 py-2.5 bg-white border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-1.5">
            <AlertCircle size={14} /> {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !status}
          className="w-full py-3.5 bg-gradient-to-r from-princess-rose to-princess-pink-dark hover:from-princess-pink-dark hover:to-princess-rose text-white font-serif-display font-bold text-md rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Processando...' : 'Enviar Resposta'}
          <Sparkles size={16} />
        </button>
      </form>
    </div>
  );
}
