import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import Countdown from './Countdown';
import { MapPin, CheckCircle2, Gift } from 'lucide-react';
import { Metadata } from 'next';
import {
  PinkBow, Butterfly, Tree, Mushroom, Deer, Fox, Squirrel, GrassMound, Leaf,
} from './ForestArt';

interface InvitePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug } });
  return {
    title: event ? `Convite · 1 Aninho da ${event.babyName} 🦊🍄` : 'Convite Não Encontrado',
    description: event?.description || 'O bosque encantado está em festa. Você foi convidado!',
  };
}

export default async function PublicInvitePage({ params }: InvitePageProps) {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug } });
  if (!event) notFound();

  const date    = new Date(event.date);
  const day     = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }).replace('/', '.');
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
  const hour    = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <main className="min-h-screen gingham-bg flex flex-col items-center justify-start px-4 pt-10 pb-0 relative overflow-hidden">

      {/* ── Borboletas voando pela cena ── */}
      <span className="absolute top-12 left-[8%] animate-butterfly-1 select-none pointer-events-none z-20">
        <Butterfly width={30} color="#EFB9C6" />
      </span>
      <span className="absolute top-32 right-[10%] animate-butterfly-2 select-none pointer-events-none z-20">
        <Butterfly width={24} color="#D8E0C9" />
      </span>
      <span className="absolute top-[55%] left-[5%] animate-butterfly-3 select-none pointer-events-none z-20">
        <Butterfly width={20} color="#EFB9C6" />
      </span>

      {/* ── Folhinhas caindo ── */}
      <span className="absolute top-24 left-[28%] animate-leaf-1 select-none pointer-events-none z-0">
        <Leaf width={13} />
      </span>
      <span className="absolute top-16 right-[30%] animate-leaf-2 select-none pointer-events-none z-0">
        <Leaf width={11} color="#A8845A" />
      </span>
      <span className="absolute top-40 right-[18%] animate-leaf-3 select-none pointer-events-none z-0">
        <Leaf width={14} />
      </span>

      {/* ═══ Cartão arco (painel creme da arte) ═══ */}
      <div
        className="relative w-full max-w-sm bg-[#FDFBF5]/97 z-10 animate-card-rise mt-10"
        style={{
          borderRadius: '170px 170px 26px 26px',
          border: '1.5px solid rgba(138, 150, 120, 0.55)',
          boxShadow: '0 24px 60px -12px rgba(110, 90, 60, 0.18), 0 4px 16px rgba(110, 90, 60, 0.08)',
        }}
      >
        {/* Laço rosa no topo do arco */}
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 animate-bow z-20">
          <PinkBow width={148} />
        </div>

        {/* Borboletinhas junto ao laço, como na arte */}
        <span className="absolute -top-8 left-7 animate-butterfly-2 z-20">
          <Butterfly width={22} color="#EFB9C6" />
        </span>
        <span className="absolute -top-4 right-8 animate-butterfly-3 z-20">
          <Butterfly width={19} color="#D8E0C9" />
        </span>

        <div className="pt-20 pb-10 px-7 space-y-5 text-center">

          {/* ── Frase do bosque (verde sálvia, como na arte) ── */}
          <p className="font-serif-display text-[17px] leading-relaxed text-forest-sage-dark">
            O bosque encantado está em festa para comemorar meu primeiro aninho!
          </p>

          {/* ── Nome (script terracota) ── */}
          <h1 className="font-script text-[5.2rem] text-princess-rose leading-none animate-name-shimmer -my-2">
            {event.babyName}
          </h1>

          {/* ── 1 ANINHO (serif marrom, tracking largo) ── */}
          <p className="font-serif-display text-2xl font-semibold tracking-[0.28em] text-princess-text uppercase">
            1 Aninho
          </p>

          {/* ── Linha de data: Sábado · 30.01 · às 14:00h ── */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <span className="flex flex-col items-center gap-1">
              <span className="h-px w-12 border-t border-dashed border-forest-sage/70" />
              <span className="font-serif-display text-base text-princess-gold-dark capitalize">{weekday.replace('-feira', '')}</span>
              <span className="h-px w-12 border-t border-dashed border-forest-sage/70" />
            </span>
            <span className="font-serif-display text-[2.6rem] font-bold text-princess-text leading-none px-1">
              {day}
            </span>
            <span className="flex flex-col items-center gap-1">
              <span className="h-px w-12 border-t border-dashed border-forest-sage/70" />
              <span className="font-serif-display text-base text-princess-gold-dark">às {hour}h</span>
              <span className="h-px w-12 border-t border-dashed border-forest-sage/70" />
            </span>
          </div>

          {/* ── Local ── */}
          <p className="text-[12px] font-semibold text-princess-text/65">
            {event.locationName}
          </p>

          {/* ── Contagem regressiva ── */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold tracking-[0.25em] text-forest-sage-dark/70 uppercase">
              Contagem Regressiva
            </p>
            <Countdown targetDate={event.date} />
          </div>

          {/* ── Ícones de ação (círculos terracota da arte) ── */}
          <div className="flex items-start justify-center gap-7 pt-2">
            {/* Endereço */}
            {event.locationMapUrl && (
              <a href={event.locationMapUrl} target="_blank" rel="noreferrer"
                className="flex flex-col items-center gap-2 group">
                <span className="w-[54px] h-[54px] rounded-full bg-princess-rose flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-[#A8543F] transition-all duration-200">
                  <MapPin size={24} className="text-white" />
                </span>
                <span className="font-serif-display text-[13px] leading-tight text-princess-text/80">
                  Endereço<br />da festa
                </span>
              </a>
            )}

            {/* Confirmar presença */}
            <Link href={`/convite/${slug}/rsvp`} className="flex flex-col items-center gap-2 group">
              <span className="w-[54px] h-[54px] rounded-full bg-princess-rose flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-[#A8543F] transition-all duration-200">
                <CheckCircle2 size={24} className="text-white" />
              </span>
              <span className="font-serif-display text-[13px] leading-tight text-princess-text/80">
                Confirmar<br />presença
              </span>
            </Link>

            {/* Presentes */}
            {event.giftSuggestions && (
              <Link href={`/convite/${slug}/presentes`} className="flex flex-col items-center gap-2 group">
                <span className="w-[54px] h-[54px] rounded-full bg-princess-rose flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-[#A8543F] transition-all duration-200">
                  <Gift size={24} className="text-white" />
                </span>
                <span className="font-serif-display text-[13px] leading-tight text-princess-text/80">
                  Sugestões<br />de presentes
                </span>
              </Link>
            )}
          </div>

          {/* ── Dica + Espero você ── */}
          <p className="text-[12px] text-forest-sage-dark/80 pt-1">
            ☝️ Clique nos ícones para abrir!
          </p>
          <p className="font-script text-4xl text-princess-gold-dark leading-none pb-2">
            Espero você!
          </p>
        </div>
      </div>

      {/* ═══ Cena do bosque (base da página, como na arte) ═══ */}
      <div className="relative w-full max-w-2xl h-56 sm:h-64 mt-2 z-10 pointer-events-none select-none" aria-hidden>
        {/* Grama */}
        <GrassMound className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[130%] sm:w-full h-24" />

        {/* Árvore + raposa (direita) */}
        <div className="absolute bottom-10 right-0 sm:right-4">
          <Tree width={120} className="hidden sm:block" />
          <Tree width={92} className="sm:hidden" />
        </div>
        <div className="absolute bottom-4 right-16 sm:right-28 animate-critter">
          <Fox width={110} />
        </div>

        {/* Corça deitada (esquerda) */}
        <div className="absolute bottom-5 left-0 sm:left-4 animate-critter-slow">
          <Deer width={185} />
        </div>

        {/* Esquilo com coração (centro) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 animate-critter">
          <Squirrel width={74} />
        </div>

        {/* Cogumelos espalhados */}
        <span className="absolute bottom-6 left-[26%]"><Mushroom width={26} /></span>
        <span className="absolute bottom-3 left-[8%]"><Mushroom width={20} /></span>
        <span className="absolute bottom-8 right-[34%]"><Mushroom width={30} /></span>
        <span className="absolute bottom-2 right-[8%]"><Mushroom width={22} /></span>
        <span className="absolute bottom-12 right-[22%]"><Mushroom width={18} /></span>
      </div>

      {/* Footer sobre a grama */}
      <footer className="w-full text-center text-[11px] text-white/90 font-serif-display italic relative z-20 -mt-7 pb-3">
        🍄 No bosque encantado da {event.babyName}, todo dia é pura magia.
      </footer>
    </main>
  );
}
