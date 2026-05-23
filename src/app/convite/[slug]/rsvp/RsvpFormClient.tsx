'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Users,
  Smile,
  Frown,
  AlertCircle,
  Sparkles,
  Heart,
} from 'lucide-react';

interface RsvpFormClientProps {
  slug: string;
  babyName: string;
}

export default function RsvpFormClient({ slug, babyName }: RsvpFormClientProps) {
  const [name, setName]               = useState('');
  const [phone, setPhone]             = useState('');
  const [status, setStatus]           = useState<'confirmado' | 'nao_vai' | null>(null);
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [notes, setNotes]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Por favor, preencha o seu nome.'); return; }
    if (!status)       { setError('Por favor, selecione se você irá ou não.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug, name: name.trim(), phone: phone.trim(), status,
          adultsCount: status === 'confirmado' ? adultsCount : 0,
          childrenCount: status === 'confirmado' ? childrenCount : 0,
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) setSuccess(true);
      else setError(data.error || 'Ocorreu um erro ao enviar sua confirmação.');
    } catch {
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (success) {
    return (
      <div
        className="w-full max-w-xs bg-white/96 border-2 border-princess-rose/20 z-10"
        style={{ borderRadius: '28px', boxShadow: '0 20px 60px -10px rgba(230,138,156,0.22)' }}
      >
        <div className="p-8 text-center space-y-5">
          {/* Icon */}
          <div className="flex justify-center">
            {status === 'confirmado' ? (
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center animate-float">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-princess-pink-light border-2 border-princess-rose/20 flex items-center justify-center animate-float">
                <Heart size={32} className="text-princess-rose" />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1">
            <h2 className="font-script text-4xl text-princess-rose">
              {status === 'confirmado' ? 'Confirmado!' : 'Resposta Enviada!'}
            </h2>
            <p className="text-[11px] tracking-[0.3em] font-bold text-princess-text/40 uppercase">
              {status === 'confirmado' ? `${adultsCount + childrenCount} pessoa${adultsCount + childrenCount !== 1 ? 's' : ''} confirmada${adultsCount + childrenCount !== 1 ? 's' : ''}` : 'Sentiremos sua falta'}
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-princess-rose/15" />
            <Sparkles size={12} className="text-princess-gold/50" />
            <div className="h-px flex-1 bg-princess-rose/15" />
          </div>

          {/* Message */}
          <p className="font-serif-display italic text-sm text-princess-text/70 leading-relaxed">
            {status === 'confirmado'
              ? <>Que alegria! Mal podemos esperar para celebrar o 1º aninho da <strong>Princesa {babyName}</strong> com você! 🎉👑</>
              : <>Agradecemos sua resposta. A presença da <strong>Princesa {babyName}</strong> seguirá iluminando nosso reino! 💖</>
            }
          </p>

          {/* Back */}
          <Link
            href={`/convite/${slug}`}
            className="inline-flex items-center gap-1.5 w-full justify-center py-3 rounded-2xl text-white text-sm font-bold shadow-md transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #E68A9C, #FF99AA)' }}
          >
            <ChevronLeft size={15} />
            Voltar ao Convite
          </Link>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div
      className="w-full max-w-xs bg-white/96 border-2 border-princess-rose/20 z-10"
      style={{ borderRadius: '28px', boxShadow: '0 20px 60px -10px rgba(230,138,156,0.22)' }}
    >
      {/* Inner ring */}
      <div className="absolute inset-[5px] border border-princess-rose/08 rounded-[24px] pointer-events-none" />

      <div className="p-6 space-y-5">
        {/* Back */}
        <Link
          href={`/convite/${slug}`}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-princess-rose/70 hover:text-princess-rose transition-colors"
        >
          <ChevronLeft size={13} />
          Voltar para o convite
        </Link>

        {/* Header */}
        <div className="text-center space-y-1.5">
          <span className="text-2xl animate-bow inline-block select-none">🎀</span>
          <h1 className="font-script text-4xl text-princess-rose leading-none">
            Confirmação
          </h1>
          <p className="text-[11px] font-bold tracking-[0.3em] text-princess-text/40 uppercase">
            de presença
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-princess-rose/15" />
          <Heart size={10} className="text-princess-rose/40 fill-princess-rose/25" />
          <div className="h-px flex-1 bg-princess-rose/15" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-[10px] font-bold text-princess-text/55 uppercase tracking-wider mb-1.5">
              Seu Nome / Família *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Família Silva..."
              className="w-full px-3.5 py-2.5 bg-white border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/25 text-sm placeholder:text-princess-text/30"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-[10px] font-bold text-princess-text/55 uppercase tracking-wider mb-1.5">
              WhatsApp / Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Ex: (11) 99999-8888"
              className="w-full px-3.5 py-2.5 bg-white border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/25 text-sm placeholder:text-princess-text/30"
            />
          </div>

          {/* Vai ou Não? */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-princess-text/55 uppercase tracking-wider">
              Você irá comparecer? *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setStatus('confirmado')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all duration-200 ${
                  status === 'confirmado'
                    ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                    : 'bg-white border-princess-rose/15 hover:border-princess-rose/30 hover:bg-princess-pink-light/20'
                }`}
              >
                <Smile size={20} className={status === 'confirmado' ? 'text-emerald-500' : 'text-princess-rose/60'} />
                <span className={`text-xs font-bold ${status === 'confirmado' ? 'text-emerald-700' : 'text-princess-text/60'}`}>
                  Sim, eu vou! 🎉
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('nao_vai')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all duration-200 ${
                  status === 'nao_vai'
                    ? 'bg-red-50 border-red-200 shadow-sm'
                    : 'bg-white border-princess-rose/15 hover:border-princess-rose/30 hover:bg-princess-pink-light/20'
                }`}
              >
                <Frown size={20} className={status === 'nao_vai' ? 'text-red-400' : 'text-princess-rose/60'} />
                <span className={`text-xs font-bold ${status === 'nao_vai' ? 'text-red-600' : 'text-princess-text/60'}`}>
                  Não poderei ir
                </span>
              </button>
            </div>
          </div>

          {/* Quantidade (só se confirmado) */}
          {status === 'confirmado' && (
            <div className="bg-princess-pink-light/25 rounded-2xl border border-princess-rose/15 p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-princess-rose uppercase tracking-wider">
                <Users size={12} />
                Quantos serão?
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Adultos */}
                <div className="text-center">
                  <p className="text-[10px] font-semibold text-princess-text/60 mb-2">Adultos</p>
                  <div className="flex items-center justify-center gap-2">
                    <button type="button" onClick={() => setAdultsCount(p => Math.max(1, p - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-princess-rose/20 text-princess-rose font-bold text-lg flex items-center justify-center hover:bg-princess-pink-light/40 transition">
                      −
                    </button>
                    <span className="w-7 text-center font-bold text-sm">{adultsCount}</span>
                    <button type="button" onClick={() => setAdultsCount(p => p + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-princess-rose/20 text-princess-rose font-bold text-lg flex items-center justify-center hover:bg-princess-pink-light/40 transition">
                      +
                    </button>
                  </div>
                </div>
                {/* Crianças */}
                <div className="text-center">
                  <p className="text-[10px] font-semibold text-princess-text/60 mb-2">Crianças</p>
                  <div className="flex items-center justify-center gap-2">
                    <button type="button" onClick={() => setChildrenCount(p => Math.max(0, p - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-princess-rose/20 text-princess-rose font-bold text-lg flex items-center justify-center hover:bg-princess-pink-light/40 transition">
                      −
                    </button>
                    <span className="w-7 text-center font-bold text-sm">{childrenCount}</span>
                    <button type="button" onClick={() => setChildrenCount(p => p + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-princess-rose/20 text-princess-rose font-bold text-lg flex items-center justify-center hover:bg-princess-pink-light/40 transition">
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Total pill */}
              <div className="text-center">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-princess-rose/10 border border-princess-rose/20 text-[11px] font-bold text-princess-rose">
                  <Users size={10} />
                  {adultsCount + childrenCount} pessoa{adultsCount + childrenCount !== 1 ? 's' : ''} no total
                </span>
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-[10px] font-bold text-princess-text/55 uppercase tracking-wider mb-1.5">
              Alguma observação?
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: restrições alimentares, alergias..."
              rows={2}
              className="w-full px-3.5 py-2.5 bg-white border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/25 text-sm resize-none placeholder:text-princess-text/30"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <AlertCircle size={13} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !status}
            className="w-full py-3.5 rounded-2xl text-white font-serif-display font-bold text-base shadow-md transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #E68A9C, #FF99AA)' }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Enviar Resposta
                <Sparkles size={15} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
