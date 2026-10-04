'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Check, Heart, AlertCircle, Loader2, User, Baby, Plus, X } from 'lucide-react';
import { isValidChildAge, MAX_CHILD_AGE } from '@/lib/guests';

type PersonType = 'adulto' | 'crianca';
type Person = { key: number; name: string; type: PersonType; age: string };

interface RsvpFormClientProps {
  slug: string;
  babyName: string;
  deadline: string | null;
}

const MAX_PEOPLE = 15;

const newPerson = (key: number): Person => ({ key, name: '', type: 'adulto', age: '' });

export default function RsvpFormClient({ slug, babyName, deadline }: RsvpFormClientProps) {
  // Chave estável por linha: a primeira é fixa para o HTML do servidor bater com o do navegador
  const nextKey = useRef(1);
  const [people, setPeople]   = useState<Person[]>([newPerson(0)]);
  const [phone, setPhone]     = useState('');
  const [website, setWebsite] = useState(''); // campo invisível contra robôs
  const [loading, setLoading] = useState<null | 'confirmado' | 'nao_vai'>(null);
  const [error, setError]     = useState('');

  // Tela final
  const [done, setDone] = useState<null | 'confirmado' | 'nao_vai'>(null);

  const update = (key: number, patch: Partial<Person>) =>
    setPeople(prev => prev.map(p => (p.key === key ? { ...p, ...patch } : p)));
  const remove = (key: number) => setPeople(prev => prev.filter(p => p.key !== key));
  const add = () => {
    if (people.length >= MAX_PEOPLE) return;
    const key = nextKey.current++;
    setPeople(prev => [...prev, newPerson(key)]);
    // Leva o cursor direto para o nome da nova pessoa
    requestAnimationFrame(() => document.getElementById(`rsvp-name-${key}`)?.focus());
  };

  const filled = people.filter(p => p.name.trim());
  // Toda criança precisa de idade válida (até 5 anos não entra no buffet)
  const ageOk = (p: Person) => p.age !== '' && isValidChildAge(Number(p.age));
  const missingAge = filled.some(p => p.type === 'crianca' && !ageOk(p));

  // ─── Enviar ──────────────────────────────────────────────────────────────
  const submit = async (status: 'confirmado' | 'nao_vai') => {
    setError('');
    if (filled.length === 0) {
      setError(status === 'confirmado' ? 'Informe o nome de quem vai.' : 'Informe seu nome.');
      return;
    }
    setLoading(status);
    try {
      const members = filled.map(p => ({
        name: p.name.trim(),
        type: p.type,
        ...(p.type === 'crianca' && { age: p.age === '' ? null : Number(p.age) }),
      }));
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, status, members, phone: phone.trim(), website }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDone(status);
      } else {
        setError(data.error || 'Erro ao enviar sua confirmação.');
      }
    } catch {
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(null);
    }
  };

  const restart = () => {
    setPeople([newPerson(nextKey.current++)]);
    setPhone('');
    setError('');
    setDone(null);
  };

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
              ? `Que alegria! O bosque encantado espera por vocês para celebrar o 1º aniversário da ${babyName}.`
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
          <button type="button" onClick={restart} className="rsvp-btn rsvp-btn-ghost convite-in" style={{ '--d': '800ms' } as React.CSSProperties}>
            Enviar outra confirmação
          </button>
        </section>
      </>
    );
  }

  // ─── Formulário ──────────────────────────────────────────────────────────
  return (
    <>
      {backLink}

      <section className="rsvp-main">
        <h1 className="convite-text rsvp-title convite-in" style={{ '--d': '250ms' } as React.CSSProperties}>
          Confirme sua presença
        </h1>
        <p className="convite-text rsvp-lead convite-in" style={{ '--d': '400ms' } as React.CSSProperties}>
          {deadline ? `Favor confirmar até o dia ${deadline}` : 'Conte para nós quem vai celebrar com a gente'}
        </p>

        <div className="rsvp-garland convite-in" style={{ '--d': '500ms' } as React.CSSProperties} aria-hidden>
          <Image src="/convite/guirlanda.webp" alt="" width={615} height={105} unoptimized />
        </div>

        <form
          className="rsvp-search convite-in"
          style={{ '--d': '650ms' } as React.CSSProperties}
          onSubmit={e => { e.preventDefault(); submit('confirmado'); }}
          noValidate
        >
          <p className="rsvp-label rsvp-intro">Adicione você e cada pessoa que vai com você.</p>

          <ul className="rsvp-people" aria-label="Pessoas que vão">
            {people.map((p, i) => {
              const ageInvalid = p.type === 'crianca' && p.age !== '' && !ageOk(p);
              return (
                <li key={p.key} className="rsvp-person">
                  <div className="rsvp-person-head">
                    <label htmlFor={`rsvp-name-${p.key}`} className="rsvp-label">
                      {i === 0 ? 'Seu nome' : `Pessoa ${i + 1}`}
                    </label>
                    {people.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(p.key)}
                        className="rsvp-person-remove"
                        aria-label={`Remover ${p.name.trim() || `pessoa ${i + 1}`}`}
                      >
                        <X size={16} aria-hidden />
                      </button>
                    )}
                  </div>
                  <input
                    id={`rsvp-name-${p.key}`}
                    type="text"
                    value={p.name}
                    onChange={e => update(p.key, { name: e.target.value })}
                    autoComplete={i === 0 ? 'name' : 'off'}
                    autoCapitalize="words"
                    maxLength={80}
                    placeholder="Nome e sobrenome"
                    className="rsvp-input rsvp-input-plain"
                  />

                  <div className="rsvp-type" role="radiogroup" aria-label={`${p.name.trim() || `Pessoa ${i + 1}`} é adulto ou criança?`}>
                    {(['adulto', 'crianca'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={p.type === t}
                        onClick={() => update(p.key, { type: t })}
                        className={`rsvp-type-opt ${p.type === t ? 'is-on' : ''}`}
                      >
                        {t === 'adulto' ? <User size={16} aria-hidden /> : <Baby size={16} aria-hidden />}
                        {t === 'adulto' ? 'Adulto' : 'Criança'}
                      </button>
                    ))}
                  </div>

                  {p.type === 'crianca' && (
                    <div className="rsvp-age">
                      <label htmlFor={`rsvp-age-${p.key}`}>Idade da criança</label>
                      <input
                        id={`rsvp-age-${p.key}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={MAX_CHILD_AGE}
                        required
                        value={p.age}
                        onChange={e => update(p.key, { age: e.target.value })}
                        aria-invalid={ageInvalid}
                        className="rsvp-input rsvp-input-plain"
                      />
                      <span>anos</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {people.length < MAX_PEOPLE && (
            <button type="button" onClick={add} className="rsvp-add">
              <Plus size={18} aria-hidden /> Adicionar pessoa
            </button>
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

          {/* Armadilha para robôs: escondida de pessoas e leitores de tela */}
          <input
            type="text"
            name="website"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="rsvp-honeypot"
          />

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
              type="submit"
              disabled={!!loading || filled.length === 0 || missingAge}
              className="rsvp-btn rsvp-btn-primary"
            >
              {loading === 'confirmado'
                ? <Loader2 size={18} className="rsvp-spin" aria-hidden />
                : <Check size={18} strokeWidth={2.6} aria-hidden />}
              Confirmar presença
            </button>
            <button
              type="button"
              onClick={() => submit('nao_vai')}
              disabled={!!loading || filled.length === 0}
              className="rsvp-btn rsvp-btn-ghost"
            >
              {loading === 'nao_vai' && <Loader2 size={18} className="rsvp-spin" aria-hidden />}
              Não poderei ir
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
