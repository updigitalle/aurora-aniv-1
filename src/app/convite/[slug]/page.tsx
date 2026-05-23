import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import Countdown from './Countdown';
import { MapPin, Map, CheckCircle2, Gift } from 'lucide-react';
import { Metadata } from 'next';

interface InvitePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug } });
  return {
    title: event ? `Convite · 1 Ano da ${event.babyName} 👑` : 'Convite Não Encontrado',
    description: event?.description || 'Você foi convidado para um aniversário especial!',
  };
}

export default async function PublicInvitePage({ params }: InvitePageProps) {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug } });
  if (!event) notFound();

  const day   = new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const weekday = new Date(event.date).toLocaleDateString('pt-BR', { weekday: 'long' });
  const hour  = new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <main className="min-h-screen gingham-bg flex flex-col items-center justify-start px-4 pt-8 pb-10 relative overflow-hidden">

      {/* Floating decorative stars */}
      <span className="absolute top-10 left-6 text-xl text-princess-rose/30 animate-star-1 select-none pointer-events-none">✦</span>
      <span className="absolute top-20 right-8 text-lg text-princess-gold/40 animate-star-2 select-none pointer-events-none">★</span>
      <span className="absolute bottom-24 left-10 text-xl text-princess-rose/25 animate-star-3 select-none pointer-events-none">✦</span>
      <span className="absolute bottom-16 right-6 text-base text-princess-gold/35 animate-star-1 select-none pointer-events-none" style={{ animationDelay: '1s' }}>★</span>
      <span className="absolute top-1/2 left-4 text-sm text-princess-rose/20 animate-star-2 select-none pointer-events-none">✦</span>

      {/* ─── Arch Card ─── */}
      <div
        className="relative w-full max-w-xs bg-white/96 border-2 border-princess-rose/20 z-10"
        style={{ borderRadius: '160px 160px 28px 28px', boxShadow: '0 20px 60px -10px rgba(230,138,156,0.22), 0 4px 16px rgba(230,138,156,0.1)' }}
      >
        {/* Inner arch highlight ring */}
        <div
          className="absolute inset-[5px] border border-princess-rose/10 pointer-events-none"
          style={{ borderRadius: '155px 155px 24px 24px' }}
        />

        <div className="pt-10 pb-8 px-6 space-y-5 text-center">

          {/* ── Crest / Brasão ── */}
          <div className="flex flex-col items-center gap-0">
            {/* Bow */}
            <span className="text-2xl animate-bow select-none" aria-hidden>🎀</span>

            {/* Shield */}
            <div
              className="relative flex flex-col items-center justify-start pt-3 px-3 pb-5 w-24 h-[5.5rem] border border-princess-rose/25 bg-white shadow-sm"
              style={{ borderRadius: '50% 50% 40% 40% / 28% 28% 55% 55%' }}
            >
              {/* Princess row at bottom of shield */}
              <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-0.5 text-sm select-none">
                <span>👸</span><span>🧚‍♀️</span><span>🌸</span>
              </div>

              {/* A monogram */}
              <span className="font-script text-4xl text-princess-rose leading-none z-10 mt-0.5">A</span>

              {/* Ribbon */}
              <div className="absolute bottom-[22px] left-0 right-0 bg-princess-rose/15 py-px">
                <span className="text-[8px] text-princess-rose font-bold tracking-wide">1 ano da Aurora</span>
              </div>
            </div>
          </div>

          {/* ── Tagline ── */}
          <div className="space-y-0.5 -mt-1">
            <p className="font-serif-display italic text-[13px] text-princess-text/65">O reino está em festa...</p>
            <p className="font-serif-display italic text-[13px] text-princess-text/65">venha comemorar conosco!</p>
          </div>

          {/* ── Baby Name ── */}
          <h1 className="font-script text-[5.5rem] text-princess-rose leading-none animate-name-shimmer -my-1">
            {event.babyName}
          </h1>

          {/* ── 1 ANINHO ── */}
          <p className="text-[11px] font-bold tracking-[0.4em] text-princess-text/55 uppercase">
            1 Aninho
          </p>

          {/* ── Divider ── */}
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-10 bg-princess-rose/20" />
            <span className="text-princess-rose/35 text-xs">✦</span>
            <div className="h-px w-10 bg-princess-rose/20" />
          </div>

          {/* ── Date | Local | Time grid ── */}
          <div className="border border-princess-rose/20 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-princess-rose/15">
              {/* Date */}
              <div className="py-3 px-1 flex flex-col items-center gap-0.5">
                <p className="font-serif-display text-base font-bold text-princess-text leading-none">{day}</p>
                <p className="text-[9px] font-bold tracking-wide text-princess-rose uppercase capitalize">{weekday}</p>
              </div>

              {/* Location */}
              <div className="py-3 px-2 flex flex-col items-center justify-center gap-1">
                <MapPin size={13} className="text-princess-rose/50" />
                <p className="text-[9px] text-princess-text/60 leading-tight text-center font-medium">
                  {event.locationName}
                </p>
              </div>

              {/* Time */}
              <div className="py-3 px-1 flex flex-col items-center gap-0.5">
                <p className="font-serif-display text-base font-bold text-princess-text leading-none">{hour}</p>
                <p className="text-[9px] font-bold tracking-wide text-princess-rose/70 uppercase">Horas</p>
              </div>
            </div>
          </div>

          {/* ── Map link ── */}
          {event.locationMapUrl && (
            <a
              href={event.locationMapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] text-princess-rose/70 hover:text-princess-rose font-semibold transition-colors"
            >
              <Map size={12} />
              Ver no Google Maps
            </a>
          )}

          {/* ── Countdown ── */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold tracking-[0.25em] text-princess-text/35 uppercase">
              Contagem Regressiva
            </p>
            <Countdown targetDate={event.date} />
          </div>

          {/* ── Divider ── */}
          <div className="h-px bg-princess-rose/12" />

          {/* ── Action Buttons ── */}
          <div className={`flex items-start justify-center gap-10 pt-1 ${!event.giftSuggestions ? '' : ''}`}>

            {/* Confirmar Presença */}
            <Link
              href={`/convite/${slug}/rsvp`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-[52px] h-[52px] rounded-full bg-princess-rose/10 border-2 border-princess-rose/30 flex items-center justify-center group-hover:bg-princess-rose group-hover:border-princess-rose group-hover:scale-110 transition-all duration-200 shadow-sm">
                <CheckCircle2 size={22} className="text-princess-rose group-hover:text-white transition-colors" />
              </div>
              <span className="font-serif-display text-[11px] text-princess-text/65 text-center leading-snug max-w-[56px]">
                Confirma<br />presença
              </span>
            </Link>

            {/* Sugestões de Presentes — só aparece se configurado */}
            {event.giftSuggestions && (
              <Link
                href={`/convite/${slug}/presentes`}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-[52px] h-[52px] rounded-full bg-princess-gold-light/50 border-2 border-princess-gold/35 flex items-center justify-center group-hover:bg-princess-gold group-hover:border-princess-gold group-hover:scale-110 transition-all duration-200 shadow-sm">
                  <Gift size={22} className="text-princess-gold-dark group-hover:text-white transition-colors" />
                </div>
                <span className="font-serif-display text-[11px] text-princess-text/65 text-center leading-snug max-w-[56px]">
                  Sugestões<br />de presentes
                </span>
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="mt-7 text-center text-[10px] text-princess-rose/35 font-serif-display italic relative z-10">
        🏰 No reino da Aurora, a felicidade é o nosso final feliz.
      </footer>
    </main>
  );
}
