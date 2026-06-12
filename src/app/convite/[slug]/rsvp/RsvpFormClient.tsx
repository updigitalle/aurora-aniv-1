'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, CheckCircle2, Users, Search, AlertCircle, Sparkles,
  Heart, User, Baby, X, Loader2,
} from 'lucide-react';

type Member = { name: string; type: 'adulto' | 'crianca' | 'bebe'; confirmed: boolean };
type GuestResult = { id: string; name: string; status: string; members: Member[] };

interface RsvpFormClientProps {
  slug: string;
  babyName: string;
}

const TYPE_LABEL: Record<Member['type'], string> = {
  adulto: 'Adulto', crianca: 'Criança', bebe: 'Bebê',
};

export default function RsvpFormClient({ slug, babyName }: RsvpFormClientProps) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<GuestResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Família selecionada (popup)
  const [selected, setSelected] = useState<GuestResult | null>(null);
  const [checks, setChecks]     = useState<Record<number, boolean>>({});
  const [phone, setPhone]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Tela final
  const [done, setDone] = useState<null | 'confirmado' | 'nao_vai'>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Busca com debounce ──────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) { setResults([]); setSearched(false); return; }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/rsvp?slug=${encodeURIComponent(slug)}&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
        setSearched(true);
      }
    }, 350);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, slug]);

  // ─── Abrir popup da família ──────────────────────────────────────────────
  const openFamily = (g: GuestResult) => {
    setSelected(g);
    // Por padrão, marca todos como presentes
    const initial: Record<number, boolean> = {};
    g.members.forEach((_, i) => { initial[i] = true; });
    setChecks(initial);
    setPhone('');
    setError('');
  };

  const toggle = (i: number) => setChecks(prev => ({ ...prev, [i]: !prev[i] }));

  // ─── Enviar confirmação ──────────────────────────────────────────────────
  const submit = async (status: 'confirmado' | 'nao_vai') => {
    if (!selected) return;
    setError('');
    setLoading(true);
    try {
      const members = selected.members.map((m, i) => ({ ...m, confirmed: !!checks[i] }));
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId: selected.id, status, members, phone: phone.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDone(status);
        setSelected(null);
      } else {
        setError(data.error || 'Erro ao enviar sua confirmação.');
      }
    } catch {
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const confirmingMembers = selected?.members ?? [];
  const anyChecked = Object.values(checks).some(Boolean);

  // ─── Tela de sucesso ─────────────────────────────────────────────────────
  if (done) {
    const confirmado = done === 'confirmado';
    return (
      <div className="w-full max-w-xs bg-white/96 border-2 border-princess-rose/20 z-10"
        style={{ borderRadius: '28px', boxShadow: '0 20px 60px -10px rgba(230,138,156,0.22)' }}>
        <div className="p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center animate-float border-2 ${
              confirmado ? 'bg-emerald-50 border-emerald-200' : 'bg-princess-pink-light border-princess-rose/20'
            }`}>
              {confirmado ? <CheckCircle2 size={32} className="text-emerald-500" /> : <Heart size={32} className="text-princess-rose" />}
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="font-script text-4xl text-princess-rose">
              {confirmado ? 'Confirmado!' : 'Resposta Enviada!'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-princess-rose/15" />
            <Sparkles size={12} className="text-princess-gold/50" />
            <div className="h-px flex-1 bg-princess-rose/15" />
          </div>
          <p className="font-serif-display italic text-sm text-princess-text/70 leading-relaxed">
            {confirmado
              ? <>Que alegria! Mal podemos esperar para celebrar o 1º aninho da <strong>Princesa {babyName}</strong> com você! 🎉👑</>
              : <>Agradecemos sua resposta. A presença da <strong>Princesa {babyName}</strong> seguirá iluminando nosso reino! 💖</>}
          </p>
          <Link href={`/convite/${slug}`}
            className="inline-flex items-center gap-1.5 w-full justify-center py-3 rounded-2xl text-white text-sm font-bold shadow-md transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #E68A9C, #FF99AA)' }}>
            <ChevronLeft size={15} /> Voltar ao Convite
          </Link>
        </div>
      </div>
    );
  }

  // ─── Tela de busca ───────────────────────────────────────────────────────
  return (
    <>
      <div className="w-full max-w-xs bg-white/96 border-2 border-princess-rose/20 z-10 relative"
        style={{ borderRadius: '28px', boxShadow: '0 20px 60px -10px rgba(230,138,156,0.22)' }}>
        <div className="absolute inset-[5px] border border-princess-rose/08 rounded-[24px] pointer-events-none" />

        <div className="p-6 space-y-5">
          <Link href={`/convite/${slug}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-princess-rose/70 hover:text-princess-rose transition-colors">
            <ChevronLeft size={13} /> Voltar para o convite
          </Link>

          <div className="text-center space-y-1.5">
            <span className="text-2xl animate-bow inline-block select-none">🎀</span>
            <h1 className="font-script text-4xl text-princess-rose leading-none">Confirmação</h1>
            <p className="text-[11px] font-bold tracking-[0.3em] text-princess-text/40 uppercase">de presença</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-princess-rose/15" />
            <Heart size={10} className="text-princess-rose/40 fill-princess-rose/25" />
            <div className="h-px flex-1 bg-princess-rose/15" />
          </div>

          <p className="text-center text-xs text-princess-text/60 leading-relaxed">
            Digite seu nome para encontrar seu convite e confirmar.
          </p>

          {/* Busca */}
          <div className="relative">
            {searching
              ? <Loader2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-princess-rose/60 animate-spin" />
              : <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-princess-rose/50" />}
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              placeholder="Ex: Maria, Família Silva..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/25 text-sm placeholder:text-princess-text/30"
            />
          </div>

          {/* Resultados */}
          <div className="space-y-2 min-h-[40px]">
            {query.trim().length >= 2 && results.map(g => {
              const respondeu = g.status === 'confirmado' || g.status === 'nao_vai';
              return (
                <button key={g.id} onClick={() => openFamily(g)}
                  className="w-full text-left px-3.5 py-2.5 bg-[#FAF9F6] hover:bg-princess-pink-light/30 border border-princess-rose/15 rounded-xl transition flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <Users size={14} className="text-princess-rose shrink-0" />
                    <span className="text-sm font-semibold text-princess-text truncate">{g.name}</span>
                  </span>
                  {respondeu
                    ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        g.status === 'confirmado' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                      }`}>{g.status === 'confirmado' ? 'Confirmado' : 'Não vai'}</span>
                    : <ChevronLeft size={14} className="rotate-180 text-princess-rose/50 shrink-0" />}
                </button>
              );
            })}

            {searched && !searching && query.trim().length >= 2 && results.length === 0 && (
              <div className="text-center py-3 px-2">
                <p className="text-xs text-princess-text/55 leading-relaxed">
                  Não encontramos seu nome na lista. Confira a grafia ou fale com os anfitriões. 💌
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── POPUP da família ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !loading && setSelected(null)} />
          <div className="relative z-10 w-full max-w-xs bg-white rounded-[28px] border-2 border-princess-rose/20 max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 20px 60px -10px rgba(230,138,156,0.3)' }}>
            <div className="p-6 space-y-4">
              <button onClick={() => !loading && setSelected(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-princess-rose hover:bg-princess-pink-light/30 transition">
                <X size={16} />
              </button>

              <div className="text-center space-y-1 pt-1">
                <span className="text-xl select-none">👑</span>
                <h2 className="font-script text-3xl text-princess-rose leading-tight">{selected.name}</h2>
                {confirmingMembers.length > 0 && (
                  <p className="text-[11px] text-princess-text/50">
                    Marque quem vai comparecer
                  </p>
                )}
              </div>

              {/* Membros */}
              {confirmingMembers.length > 0 ? (
                <div className="space-y-2">
                  {confirmingMembers.map((m, i) => (
                    <button key={i} type="button" onClick={() => toggle(i)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition text-left ${
                        checks[i]
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-[#FAF9F6] border-princess-rose/15'
                      }`}>
                      <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                        checks[i] ? 'bg-emerald-500 border-emerald-500' : 'border-princess-rose/30 bg-white'
                      }`}>
                        {checks[i] && <CheckCircle2 size={13} className="text-white" />}
                      </span>
                      {m.type === 'adulto' ? <User size={14} className="text-princess-rose/70 shrink-0" /> : <Baby size={14} className="text-princess-rose/70 shrink-0" />}
                      <span className="text-sm font-medium text-princess-text truncate flex-1">{m.name}</span>
                      <span className="text-[10px] font-semibold text-princess-text/40 shrink-0">
                        {TYPE_LABEL[m.type]}{m.type === 'bebe' ? ' · colo' : ''}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-princess-text/55 leading-relaxed py-1">
                  Confirme a presença da sua família abaixo.
                </p>
              )}

              {/* WhatsApp opcional */}
              <div>
                <label className="block text-[10px] font-bold text-princess-text/55 uppercase tracking-wider mb-1.5">
                  WhatsApp (opcional)
                </label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="Ex: (11) 99999-8888"
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/25 text-sm placeholder:text-princess-text/30" />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  <AlertCircle size={13} className="shrink-0" /> {error}
                </div>
              )}

              {/* Botões */}
              <div className="space-y-2 pt-1">
                <button onClick={() => submit('confirmado')}
                  disabled={loading || (confirmingMembers.length > 0 && !anyChecked)}
                  className="w-full py-3 rounded-2xl text-white font-serif-display font-bold text-sm shadow-md transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #E68A9C, #FF99AA)' }}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Confirmar presença
                </button>
                <button onClick={() => submit('nao_vai')} disabled={loading}
                  className="w-full py-2.5 rounded-2xl text-princess-text/60 bg-[#FAF9F6] border border-princess-rose/15 font-medium text-sm transition hover:bg-princess-pink-light/20 disabled:opacity-40">
                  Não poderei ir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
