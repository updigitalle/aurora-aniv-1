import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ChevronLeft, Gift, Heart, Sparkles } from 'lucide-react';
import { Metadata } from 'next';

interface PresentesPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PresentesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug } });
  return {
    title: event ? `Sugestões de Presentes · ${event.babyName} 🎁` : 'Presentes',
    description: `Sugestões de presentes para o aniversário da ${event?.babyName ?? 'aniversariante'}`,
  };
}

export default async function PresentesPage({ params }: PresentesPageProps) {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug } });

  if (!event) notFound();
  if (!event.giftSuggestions) {
    return (
      <main className="min-h-screen gingham-bg flex items-center justify-center p-4">
        <div className="max-w-xs w-full bg-white/95 rounded-3xl border-2 border-princess-rose/20 shadow-xl p-8 text-center space-y-4">
          <span className="text-4xl">🎁</span>
          <p className="font-serif-display italic text-princess-text/60 text-sm">
            Nenhuma sugestão de presente foi configurada ainda.
          </p>
          <Link
            href={`/convite/${slug}`}
            className="inline-flex items-center gap-1.5 text-xs text-princess-rose font-semibold hover:underline"
          >
            <ChevronLeft size={13} />
            Voltar ao convite
          </Link>
        </div>
      </main>
    );
  }

  // Parse lines for display
  const lines = event.giftSuggestions.split('\n').filter(l => l.trim());

  return (
    <main className="min-h-screen gingham-bg flex flex-col items-center justify-start px-4 pt-8 pb-10 relative overflow-hidden">
      {/* Floating sparkles */}
      <span className="absolute top-8 left-6 text-xl text-princess-gold/30 animate-star-1 select-none pointer-events-none">★</span>
      <span className="absolute top-16 right-7 text-lg text-princess-rose/25 animate-star-2 select-none pointer-events-none">✦</span>
      <span className="absolute bottom-20 left-8 text-base text-princess-gold/25 animate-star-3 select-none pointer-events-none">★</span>

      {/* Back link */}
      <Link
        href={`/convite/${slug}`}
        className="self-start mb-4 inline-flex items-center gap-1.5 text-xs text-princess-rose/70 hover:text-princess-rose font-semibold transition-colors relative z-10"
      >
        <ChevronLeft size={13} />
        Voltar ao convite
      </Link>

      {/* Card */}
      <div
        className="w-full max-w-xs bg-white/96 border-2 border-princess-gold/25 relative z-10"
        style={{ borderRadius: '28px', boxShadow: '0 16px 50px -8px rgba(212,175,55,0.18), 0 4px 16px rgba(138,107,79,0.1)' }}
      >
        {/* Gold inner ring */}
        <div className="absolute inset-[5px] border border-princess-gold/12 rounded-[24px] pointer-events-none" />

        <div className="p-7 space-y-5 text-center">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-princess-gold-light/60 border-2 border-princess-gold/30 flex items-center justify-center animate-float">
                <Gift size={26} className="text-princess-gold-dark" />
              </div>
            </div>
            <h1 className="font-script text-4xl text-princess-rose leading-none">
              Sugestões de Presentes
            </h1>
            <p className="text-[11px] font-bold tracking-[0.3em] text-princess-text/45 uppercase">
              Para a {event.babyName}
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-princess-gold/20" />
            <Heart size={10} className="text-princess-rose/50 fill-princess-rose/30" />
            <div className="h-px flex-1 bg-princess-gold/20" />
          </div>

          {/* Suggestions */}
          <div className="text-left space-y-2">
            {lines.map((line, i) => {
              const isBullet = line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().match(/^\d+\./);
              const text = line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-princess-rose/60 text-sm shrink-0">
                    {isBullet ? '✦' : '✦'}
                  </span>
                  <p className="text-sm text-princess-text/80 leading-snug">{text || line.trim()}</p>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-princess-gold/15" />
            <Sparkles size={10} className="text-princess-gold/50" />
            <div className="h-px flex-1 bg-princess-gold/15" />
          </div>

          {/* Footer note */}
          <p className="font-serif-display italic text-[11px] text-princess-text/45 leading-relaxed">
            "O seu presente mais precioso é a sua presença no nosso bosque." 🌲
          </p>

          {/* CTA */}
          <Link
            href={`/convite/${slug}/rsvp`}
            className="block w-full py-3 rounded-2xl text-white text-sm font-bold font-serif-display tracking-wide shadow-md transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #C16A52, #D98B6F)' }}
          >
            Confirmar Presença
          </Link>
        </div>
      </div>

      <footer className="mt-7 text-center text-[10px] text-princess-rose/30 font-serif-display italic">
        🍄 Com amor, família {event.babyName}
      </footer>
    </main>
  );
}
