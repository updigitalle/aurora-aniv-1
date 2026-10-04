'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Check, Heart, Search, AlertCircle, X, Loader2, User, Baby,
} from 'lucide-react';
import { type FamilyMember as Member, MEMBER_TYPE_LABEL as TYPE_LABEL, isValidChildAge, MAX_CHILD_AGE } from '@/lib/guests';

type GuestResult = { id: string; name: string; status: string; members: Member[] };

interface RsvpFormClientProps {
  slug: string;
  babyName: string;
  deadline: string | null;
}

export default function RsvpFormClient({ slug, babyName, deadline }: RsvpFormClientProps) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<GuestResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Família selecionada (popup)
  const [selected, setSelected] = useState<GuestResult | null>(null);
  const [checks, setChecks]     = useState<Record<number, boolean>>({});
  const [ages, setAges]         = useState<Record<number, string>>({});
  const [phone, setPhone]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Tela final
  const [done, setDone] = useState<null | 'confirmado' | 'nao_vai'>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Busca com debounce ──────────────────────────────────────────────────
  // O estado visível da busca muda no próprio onChange; o efeito só agenda a requisição.
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setSearching(false);
    } else {
      setSearching(true);
    }
  };

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;

    // Ignora respostas de buscas antigas que cheguem depois da mais recente
    let cancelled = false;
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/rsvp?slug=${encodeURIComponent(slug)}&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!cancelled) setResults(data.results || []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) {
          setSearching(false);
          setSearched(true);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, slug]);

  // Esc fecha o popup (exceto durante o envio)
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, loading]);

  // ─── Abrir popup da família ──────────────────────────────────────────────
  const openFamily = (g: GuestResult) => {
    setSelected(g);
    // Por padrão, marca todos como presentes
    const initial: Record<number, boolean> = {};
    g.members.forEach((_, i) => { initial[i] = true; });
    setChecks(initial);
    // Idade já cadastrada pelos anfitriões vem preenchida
    const initialAges: Record<number, string> = {};
    g.members.forEach((m, i) => { if (isValidChildAge(m.age)) initialAges[i] = String(m.age); });
    setAges(initialAges);
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
      const members = selected.members.map((m, i) => ({
        ...m,
        confirmed: !!checks[i],
        ...(m.type === 'crianca' && { age: ages[i] ? Number(ages[i]) : null }),
      }));
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

  const members = selected?.members ?? [];
  const anyChecked = Object.values(checks).some(Boolean);
  // Toda criança marcada precisa de idade válida (até 5 anos não entra no buffet)
  const childAgeOk = (i: number) => ages[i] !== undefined && ages[i] !== '' && isValidChildAge(Number(ages[i]));
  const missingAge = members.some((m, i) => m.type === 'crianca' && checks[i] && !childAgeOk(i));
  const showResults = query.trim().length >= 2;

  const backLink = (
    <Link href={`/convite/${slug}`} className="rsvp-back convite-in" style={{ '--d': '150ms' } as React.CSSProperties}>
      <ChevronLeft size={16} aria-hidden /> Voltar para o convite
    </Link>
  );

  // ─── Tela final ──────────────────────────────────────────────────────────
  if (done) {
    const confirmado = done === 'confirmado';
    return (
      <>
        {backLink}
        <section className="rsvp-main rsvp-done" aria-live="polite">
          <span className="rsvp-done-ring convite-in" style={{ '--d': '100ms' } as React.CSSProperties}>
            {confirmado ? <Check strokeWidth={2.4} aria-hidden /> : <Heart strokeWidth={2} aria-hidden />}
          </span>
          <h1 className="convite-text rsvp-title convite-in" style={{ '--d': '250ms' } as React.CSSProperties}>
            {confirmado ? 'Presença confirmada!' : 'Resposta enviada'}
          </h1>
          <p className="convite-text rsvp-lead convite-in" style={{ '--d': '400ms' } as React.CSSProperties}>
            {confirmado
              ? `Que alegria! O bosque encantado espera por você para celebrar o 1º aniversário da ${babyName}.`
              : `Obrigado por avisar. Vamos sentir sua falta no bosque encantado da ${babyName}.`}
          </p>
          {confirmado && (
            <p className="rsvp-note convite-in" style={{ '--d': '550ms' } as React.CSSProperties}>
              Os detalhes da festa serão enviados para você em breve.
            </p>
          )}
          <div className="rsvp-garland convite-in" style={{ '--d': '650ms' } as React.CSSProperties} aria-hidden>
            <Image src="/convite/guirlanda.webp" alt="" width={615} height={105} unoptimized />
          </div>
        </section>
      </>
    );
  }

  // ─── Busca ───────────────────────────────────────────────────────────────
  return (
    <>
      {backLink}

      <section className="rsvp-main">
        <h1 className="convite-text rsvp-title convite-in" style={{ '--d': '250ms' } as React.CSSProperties}>
          Confirme sua presença
        </h1>
        <p className="convite-text rsvp-lead convite-in" style={{ '--d': '400ms' } as React.CSSProperties}>
          {deadline ? `Favor confirmar até o dia ${deadline}` : 'Confirme sua presença pelo nome da família'}
        </p>

        <div className="rsvp-garland convite-in" style={{ '--d': '500ms' } as React.CSSProperties} aria-hidden>
          <Image src="/convite/guirlanda.webp" alt="" width={615} height={105} unoptimized />
        </div>

        <div className="rsvp-search convite-in" style={{ '--d': '650ms' } as React.CSSProperties}>
          <label htmlFor="rsvp-query" className="rsvp-label">Digite seu nome ou o da sua família</label>
          <div className="rsvp-input-wrap">
            {searching
              ? <Loader2 className="rsvp-input-icon rsvp-spin" aria-hidden />
              : <Search className="rsvp-input-icon" aria-hidden />}
            <input
              id="rsvp-query"
              type="search"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              autoComplete="off"
              placeholder="Ex: Maria, Família Silva"
              className="rsvp-input"
            />
          </div>

          <div className="rsvp-results" aria-live="polite">
            {showResults && results.map((g, i) => {
              const respondeu = g.status === 'confirmado' || g.status === 'nao_vai';
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => openFamily(g)}
                  className="rsvp-result"
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <span className="rsvp-result-name">{g.name}</span>
                  {respondeu
                    ? <span className={`rsvp-badge ${g.status === 'confirmado' ? 'is-yes' : 'is-no'}`}>
                        {g.status === 'confirmado' ? 'Confirmado' : 'Não vai'}
                      </span>
                    : <ChevronRight size={18} className="rsvp-result-arrow" aria-hidden />}
                </button>
              );
            })}

            {searched && !searching && showResults && results.length === 0 && (
              <p className="rsvp-empty">
                Não encontramos esse nome na lista. Confira a grafia ou fale com os pais da {babyName}.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Popup da família ── */}
      {selected && (
        <div className="rsvp-dialog-root">
          <div className="rsvp-overlay" onClick={() => !loading && setSelected(null)} />
          <div className="rsvp-dialog" role="dialog" aria-modal="true" aria-labelledby="rsvp-dialog-title">
            <button
              type="button"
              onClick={() => !loading && setSelected(null)}
              className="rsvp-close"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>

            <h2 id="rsvp-dialog-title" className="convite-text rsvp-dialog-title">{selected.name}</h2>
            <p className="rsvp-dialog-sub">
              {members.length > 0 ? 'Marque quem vai comparecer' : 'Confirme a presença da sua família'}
            </p>

            {members.length > 0 && (
              <div className="rsvp-members">
                {members.map((m, i) => (
                  <div key={i} className="rsvp-member-block">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={!!checks[i]}
                      onClick={() => toggle(i)}
                      className={`rsvp-member ${checks[i] ? 'is-on' : ''}`}
                    >
                      <span className="rsvp-check" aria-hidden>{checks[i] && <Check size={14} strokeWidth={3} />}</span>
                      {m.type === 'adulto'
                        ? <User size={16} className="rsvp-member-icon" aria-hidden />
                        : <Baby size={16} className="rsvp-member-icon" aria-hidden />}
                      <span className="rsvp-member-name">{m.name}</span>
                      <span className="rsvp-member-type">{TYPE_LABEL[m.type]}</span>
                    </button>

                    {m.type === 'crianca' && checks[i] && (
                      <div className="rsvp-age">
                        <label htmlFor={`rsvp-age-${i}`}>Idade de {m.name}</label>
                        <input
                          id={`rsvp-age-${i}`}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={MAX_CHILD_AGE}
                          required
                          value={ages[i] ?? ''}
                          onChange={e => setAges(prev => ({ ...prev, [i]: e.target.value }))}
                          aria-invalid={ages[i] !== undefined && ages[i] !== '' && !childAgeOk(i)}
                          className="rsvp-input rsvp-input-plain"
                        />
                        <span>anos</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="rsvp-field">
              <label htmlFor="rsvp-phone" className="rsvp-label">WhatsApp (opcional)</label>
              <input
                id="rsvp-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(11) 99999-8888"
                className="rsvp-input rsvp-input-plain"
              />
              <span className="rsvp-help">Para enviarmos o local e o horário.</span>
            </div>

            {missingAge && (
              <p className="rsvp-help rsvp-age-hint">Informe a idade de cada criança para confirmar.</p>
            )}

            {error && (
              <p className="rsvp-error" role="alert">
                <AlertCircle size={16} aria-hidden /> {error}
              </p>
            )}

            <div className="rsvp-actions">
              <button
                type="button"
                onClick={() => submit('confirmado')}
                disabled={loading || (members.length > 0 && !anyChecked) || missingAge}
                className="rsvp-btn rsvp-btn-primary"
              >
                {loading ? <Loader2 size={18} className="rsvp-spin" aria-hidden /> : <Check size={18} strokeWidth={2.6} aria-hidden />}
                Confirmar presença
              </button>
              <button
                type="button"
                onClick={() => submit('nao_vai')}
                disabled={loading}
                className="rsvp-btn rsvp-btn-ghost"
              >
                Não poderei ir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
