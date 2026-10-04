'use client';

import React, { useState, useTransition, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { Event } from '@prisma/client';
import { updateEventConfig } from './actions';
import { toDateInputValue } from '@/lib/invite';
import {
  Copy,
  Check,
  CalendarHeart,
  Clock,
  MapPin,
  AlertCircle,
  ExternalLink,
  Link2,
  Loader2,
} from 'lucide-react';

interface ConfigFormClientProps {
  event: Event;
}

const TZ = 'America/Sao_Paulo';
// O Brasil não tem horário de verão desde 2019: o fuso de Brasília é fixo em -03:00.
const TZ_OFFSET = '-03:00';

// "2027-01-30T16:00" no fuso de Brasília, igual no servidor e no navegador (evita erro de hidratação).
const toDateTimeInputValue = (d: Date) =>
  new Date(d).toLocaleString('sv-SE', { timeZone: TZ }).replace(' ', 'T').slice(0, 16);

const subscribeNoop = () => () => {};

const fieldCls =
  'w-full min-h-11 px-3.5 py-2.5 bg-white border border-princess-lilac rounded-xl text-[0.95rem] text-princess-text placeholder:text-princess-text/40 focus:outline-none focus:border-princess-rose focus:ring-4 focus:ring-princess-rose/15 transition';
const labelCls = 'block text-sm font-semibold text-princess-text mb-1.5';
const hintCls = 'text-xs text-princess-text/60 mt-1.5';

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="bg-[#fbfaf6]/90 rounded-3xl p-5 sm:p-6 border border-princess-pink princess-card-shadow space-y-5">
      <div>
        <h2 className="font-serif-display text-xl text-forest-sage">{title}</h2>
        {description && <p className="text-sm text-princess-text/65 mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Toggle({
  id, checked, onChange, label, hint,
}: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label htmlFor={id} className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-white border border-princess-lilac cursor-pointer hover:border-princess-rose/50 transition-colors">
      <span>
        <span className="block text-sm font-semibold text-princess-text">{label}</span>
        <span className="block text-xs text-princess-text/60 mt-0.5">{hint}</span>
      </span>
      <span className="relative shrink-0 mt-0.5">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="block w-11 h-6 rounded-full bg-princess-lilac peer-checked:bg-princess-rose transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-princess-rose/25" />
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export default function ConfigFormClient({ event }: ConfigFormClientProps) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(event.name);
  const [babyName, setBabyName] = useState(event.babyName);
  const [slug, setSlug] = useState(event.slug);
  const [date, setDate] = useState(() => toDateTimeInputValue(event.date));
  const [timeConfirmed, setTimeConfirmed] = useState(event.timeConfirmed);
  const [rsvpDeadline, setRsvpDeadline] = useState(() => toDateInputValue(event.rsvpDeadline));
  const [revealLocationAfterRsvp, setRevealLocationAfterRsvp] = useState(event.revealLocationAfterRsvp);
  const [locationName, setLocationName] = useState(event.locationName);
  const [locationAddress, setLocationAddress] = useState(event.locationAddress);
  const [locationMapUrl, setLocationMapUrl] = useState(event.locationMapUrl || '');
  const [description, setDescription] = useState(event.description || '');
  const [giftSuggestions, setGiftSuggestions] = useState(event.giftSuggestions || '');

  const origin = useSyncExternalStore(subscribeNoop, () => window.location.origin, () => '');
  const inviteLink = `${origin}/convite/${slug}`;

  const handleSlugChange = (val: string) => {
    setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError('');

    if (!name.trim() || !babyName.trim() || !slug.trim() || !date) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    startTransition(async () => {
      const res = await updateEventConfig(event.id, {
        name,
        babyName,
        slug,
        date: new Date(`${date}:00${TZ_OFFSET}`).toISOString(),
        locationName,
        locationAddress,
        locationMapUrl,
        description,
        giftSuggestions,
        // Meio-dia em Brasília: "yyyy-mm-dd" puro vira meia-noite UTC e cairia no dia anterior.
        rsvpDeadline: rsvpDeadline ? new Date(`${rsvpDeadline}T12:00:00${TZ_OFFSET}`).toISOString() : null,
        timeConfirmed,
        revealLocationAfterRsvp,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res.error || 'Erro ao atualizar configurações.');
      }
    });
  };

  // Prévia: mesmos rótulos do convite público
  const previewDate = date ? new Date(`${date}:00${TZ_OFFSET}`) : null;
  const previewDateLabel = previewDate
    ? previewDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: TZ }).replaceAll('/', '.')
    : '--.--.--';
  const previewWeekday = previewDate
    ? previewDate.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: TZ }).replace('-feira', '').toUpperCase()
    : '';
  const previewTime = previewDate && timeConfirmed
    ? previewDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
    : null;
  const previewDeadline = rsvpDeadline ? rsvpDeadline.slice(8, 10) + '.' + rsvpDeadline.slice(5, 7) : null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
      <div className="xl:col-span-7 space-y-6">
        <header>
          <h1 className="font-serif-display text-3xl text-forest-sage">Configurações</h1>
          <p className="text-sm text-princess-text/65 mt-1">Tudo o que aparece no convite público.</p>
        </header>

        {/* Link do convite */}
        <Section title="Link do convite" description="Envie no WhatsApp para os convidados confirmarem presença.">
          <div className="flex flex-col sm:flex-row gap-2">
            <label htmlFor="invite-link" className="sr-only">Link do convite</label>
            <input
              id="invite-link"
              type="text"
              readOnly
              value={inviteLink}
              className={`${fieldCls} flex-1 font-mono text-sm bg-princess-lavender select-all truncate`}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 min-h-11 px-4 bg-princess-rose hover:bg-princess-pink-dark text-white font-semibold rounded-full text-sm transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <a
                href={`/convite/${slug}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir convite em nova aba"
                className="grid place-items-center w-11 h-11 shrink-0 border border-princess-rose/40 text-princess-rose hover:bg-princess-pink-light rounded-full transition-colors"
              >
                <ExternalLink size={17} />
              </a>
            </div>
          </div>
        </Section>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="Evento">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cfg-baby" className={labelCls}>Nome da aniversariante *</label>
                <input id="cfg-baby" type="text" value={babyName} onChange={e => setBabyName(e.target.value)} required className={fieldCls} />
              </div>
              <div>
                <label htmlFor="cfg-slug" className={labelCls}>Endereço do link *</label>
                <div className="relative">
                  <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-olive pointer-events-none" />
                  <input id="cfg-slug" type="text" value={slug} onChange={e => handleSlugChange(e.target.value)} required className={`${fieldCls} pl-10 font-mono text-sm`} />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="cfg-name" className={labelCls}>Título do evento *</label>
              <input id="cfg-name" type="text" value={name} onChange={e => setName(e.target.value)} required className={fieldCls} />
              <p className={hintCls}>Aparece no painel e na aba do navegador.</p>
            </div>
          </Section>

          <Section title="Data e confirmação">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cfg-date" className={labelCls}>Data e hora da festa *</label>
                <input id="cfg-date" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required className={fieldCls} />
              </div>
              <div>
                <label htmlFor="cfg-deadline" className={labelCls}>Prazo para confirmar</label>
                <input id="cfg-deadline" type="date" value={rsvpDeadline} onChange={e => setRsvpDeadline(e.target.value)} className={fieldCls} />
                <p className={hintCls}>Deixe vazio para não mostrar prazo.</p>
              </div>
            </div>
            <Toggle
              id="cfg-time-confirmed"
              checked={timeConfirmed}
              onChange={setTimeConfirmed}
              label="Horário confirmado"
              hint={timeConfirmed ? 'O convite mostra o horário da festa.' : 'O convite mostra “Horário a ser confirmado.”'}
            />
          </Section>

          <Section title="Local">
            <Toggle
              id="cfg-reveal"
              checked={revealLocationAfterRsvp}
              onChange={setRevealLocationAfterRsvp}
              label="Revelar o local só após a confirmação"
              hint={revealLocationAfterRsvp ? 'O convite mostra “Local será enviado após a confirmação!”' : 'O convite mostra o nome do local.'}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cfg-loc" className={labelCls}>Nome do local *</label>
                <input id="cfg-loc" type="text" value={locationName} onChange={e => setLocationName(e.target.value)} required className={fieldCls} />
              </div>
              <div>
                <label htmlFor="cfg-map" className={labelCls}>Link do Google Maps</label>
                <input id="cfg-map" type="url" value={locationMapUrl} onChange={e => setLocationMapUrl(e.target.value)} placeholder="https://maps.google.com/..." className={fieldCls} />
              </div>
            </div>
            <div>
              <label htmlFor="cfg-addr" className={labelCls}>Endereço completo *</label>
              <input id="cfg-addr" type="text" value={locationAddress} onChange={e => setLocationAddress(e.target.value)} required className={fieldCls} />
            </div>
          </Section>

          <Section title="Mensagem e presentes">
            <div>
              <label htmlFor="cfg-desc" className={labelCls}>Mensagem do convite</label>
              <textarea id="cfg-desc" value={description} onChange={e => setDescription(e.target.value)} rows={4} className={`${fieldCls} resize-y leading-relaxed`} />
            </div>
            <div>
              <label htmlFor="cfg-gifts" className={labelCls}>Sugestões de presentes</label>
              <textarea
                id="cfg-gifts"
                value={giftSuggestions}
                onChange={e => setGiftSuggestions(e.target.value)}
                placeholder={'Ex:\nRoupinhas tamanho 12-18 meses\nLivros infantis ilustrados'}
                rows={5}
                className={`${fieldCls} resize-y leading-relaxed`}
              />
              <p className={hintCls}>Aparecem na página de presentes do convite.</p>
            </div>
          </Section>

          {/* Barra de salvar: fixa no rodapé da tela enquanto rola o formulário */}
          <div className="sticky bottom-3 z-10 flex flex-col sm:flex-row sm:items-center justify-end gap-3 p-3 rounded-full bg-[#fbfaf6]/95 backdrop-blur border border-princess-pink princess-card-shadow">
            {error && (
              <p role="alert" className="flex-1 flex items-center gap-2 px-3 text-sm text-[#8a2f22]">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </p>
            )}
            {success && (
              <p role="status" className="flex-1 flex items-center gap-2 px-3 text-sm font-semibold text-forest-sage-dark">
                <Check size={16} className="shrink-0" /> Alterações publicadas no convite
              </p>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 min-h-11 px-6 bg-princess-rose hover:bg-princess-pink-dark active:scale-[0.98] text-white font-semibold rounded-full shadow-sm transition disabled:opacity-50"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {isPending ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>

      {/* Prévia do convite */}
      <aside className="xl:col-span-5 xl:sticky xl:top-8 space-y-3">
        <h2 className="font-serif-display text-xl text-forest-sage">Prévia do convite</h2>
        <div className="gingham-bg rounded-3xl border border-princess-pink princess-card-shadow overflow-hidden px-5 py-7 text-center">
          <div className="max-w-xs mx-auto flex flex-col items-center font-serif-display text-princess-text">
            <p className="text-[0.8rem] leading-snug">
              Era uma vez…<br />um bosque encantado onde morava uma pequena princesa chamada {babyName || 'Aurora'}.
            </p>
            <Image src="/convite/brasao.webp" alt="" width={502} height={502} unoptimized className="w-40 h-auto my-3" />
            <p className="text-base leading-snug text-forest-sage">
              Você está convidado(a) para celebrar<br />O 1º aniversário da {babyName || 'Aurora'}
            </p>
            <ul className="grid grid-cols-3 w-full my-4 text-[0.68rem] leading-tight text-princess-gold" style={{ fontFamily: 'var(--font-convite-detalhe)' }}>
              <li className="flex flex-col items-center gap-1.5 px-1">
                <CalendarHeart size={22} strokeWidth={1.6} className="text-forest-olive" />
                <span>{previewDateLabel}<br />{previewWeekday}</span>
              </li>
              <li className="flex flex-col items-center gap-1.5 px-1 border-l-2 border-forest-olive">
                <Clock size={22} strokeWidth={1.6} className="text-forest-olive" />
                <span>{previewTime ? `Às ${previewTime}` : 'Horário a ser confirmado.'}</span>
              </li>
              <li className="flex flex-col items-center gap-1.5 px-1 border-l-2 border-forest-olive">
                <MapPin size={22} strokeWidth={1.6} className="text-forest-olive" />
                <span>{revealLocationAfterRsvp ? 'Local será enviado após a confirmação!' : locationName || 'Local da festa'}</span>
              </li>
            </ul>
            <Image src="/convite/guirlanda.webp" alt="" width={615} height={105} unoptimized className="w-52 h-auto" />
            <p className="text-sm mt-3">
              {previewDeadline ? `Favor confirmar a presença até o dia ${previewDeadline}` : 'Favor confirmar a presença'}
            </p>
            <span className="grid place-items-center w-9 h-9 mt-2 rounded-full border-[3px] border-princess-rose text-princess-rose" aria-hidden>
              <Check size={16} strokeWidth={2.6} />
            </span>
          </div>
        </div>
        <p className="text-xs text-princess-text/55 text-center">A prévia atualiza enquanto você edita. Salve para publicar.</p>
      </aside>
    </div>
  );
}
