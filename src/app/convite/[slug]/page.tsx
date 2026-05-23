import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import Countdown from './Countdown';
import { Calendar, MapPin, Sparkles, Crown, Heart, Map } from 'lucide-react';
import { Metadata } from 'next';

interface InvitePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await db.event.findUnique({
    where: { slug },
  });

  return {
    title: event ? `Convite Especial: 1 Ano da ${event.babyName} 👑` : 'Convite Não Encontrado',
    description: event?.description || 'Você foi convidado para um aniversário especial!',
  };
}

export default async function PublicInvitePage({ params }: InvitePageProps) {
  const { slug } = await params;

  // Buscar evento pelo slug
  const event = await db.event.findUnique({
    where: { slug },
  });

  if (!event) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="min-h-screen w-full princess-gradient flex flex-col items-center justify-between p-4 md:p-8 relative overflow-hidden">
      {/* Decorative stars and crown background */}
      <div className="absolute top-8 left-8 text-princess-pink-dark animate-float opacity-30">
        <Crown size={36} />
      </div>
      <div className="absolute top-1/4 right-8 text-princess-gold animate-sparkle-1 opacity-40">
        <Sparkles size={24} />
      </div>
      <div className="absolute bottom-1/4 left-6 text-princess-rose animate-sparkle-2 opacity-30">
        <Heart size={20} />
      </div>
      <div className="absolute bottom-8 right-8 text-princess-gold-dark animate-float opacity-35" style={{ animationDelay: '2s' }}>
        <Sparkles size={32} />
      </div>

      {/* Main Invite Card Container */}
      <div className="w-full max-w-xl bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6 md:p-10 princess-card-shadow border border-princess-pink-dark/20 text-center space-y-8 my-auto relative z-10">
        {/* Magic Crown Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-princess-pink-light border border-princess-gold/30 text-princess-rose animate-float">
            <Crown size={32} className="text-princess-gold" />
          </div>
          <div className="space-y-1">
            <p className="font-serif-display text-xs tracking-[0.2em] text-princess-text/60 uppercase font-semibold">
              O Reino de Amor Convida Para
            </p>
            <h1 className="font-script text-6xl md:text-7xl text-princess-rose leading-none">
              {event.babyName}
            </h1>
            <p className="font-serif-display text-sm tracking-[0.25em] text-princess-gold-dark uppercase font-bold mt-1">
              Faz 1 Aninho
            </p>
          </div>
        </div>

        {/* Cuteness Separator */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-princess-rose/30"></div>
          <Heart size={14} className="text-princess-rose fill-princess-rose animate-pulse" />
          <div className="h-px w-12 bg-princess-rose/30"></div>
        </div>

        {/* Invitation Text */}
        <div className="bg-white/60 rounded-3xl p-6 border border-white/80 shadow-sm space-y-3">
          <p className="font-serif-display italic text-md md:text-lg text-princess-text leading-relaxed">
            "{event.description || 'Era uma vez um sonho que se tornou realidade...'}"
          </p>
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Calendar Card */}
          <div className="bg-white/80 rounded-2xl p-4 border border-princess-pink-light/40 shadow-sm flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-princess-pink-light flex items-center justify-center text-princess-rose">
              <Calendar size={20} />
            </div>
            <h3 className="font-serif-display font-bold text-sm text-princess-text uppercase tracking-wider">Quando</h3>
            <p className="text-xs text-princess-text/80 capitalize font-medium">
              {formatDate(event.date)}
            </p>
            <p className="text-xs font-bold text-princess-rose">
              às {formatTime(event.date)}
            </p>
          </div>

          {/* Location Card */}
          <div className="bg-white/80 rounded-2xl p-4 border border-princess-pink-light/40 shadow-sm flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-princess-pink-light flex items-center justify-center text-princess-rose">
              <MapPin size={20} />
            </div>
            <h3 className="font-serif-display font-bold text-sm text-princess-text uppercase tracking-wider">Onde</h3>
            <p className="text-xs text-princess-text/80 font-bold">
              {event.locationName}
            </p>
            <p className="text-[11px] text-princess-text/60 leading-tight">
              {event.locationAddress}
            </p>
          </div>
        </div>

        {/* Map Button */}
        {event.locationMapUrl && (
          <a
            href={event.locationMapUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-princess-gold/30 hover:bg-princess-pink-light/35 text-princess-rose font-semibold rounded-xl text-xs shadow-sm transition duration-200"
          >
            <Map size={14} className="text-princess-gold" />
            Como chegar (Ver no Google Maps)
          </a>
        )}

        {/* Countdown Timer */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-princess-text/50 uppercase tracking-widest">
            Tempo restante para a celebração
          </p>
          <Countdown targetDate={event.date} />
        </div>

        {/* RSVP Action Button */}
        <div className="pt-4 border-t border-princess-pink-light/35 space-y-4">
          <Link
            href={`/convite/${slug}/rsvp`}
            className="block w-full py-4 bg-gradient-to-r from-princess-rose to-princess-pink-dark hover:from-princess-pink-dark hover:to-princess-rose text-white font-serif-display font-bold text-lg rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 text-center animate-pulse-gold"
          >
            Confirmar Presença (RSVP)
          </Link>
          <p className="text-[11px] text-princess-text/40">
            Por favor, confirme sua presença até alguns dias antes para que possamos organizar tudo com carinho.
          </p>
        </div>
      </div>

      {/* Footer message */}
      <footer className="text-center text-xs text-princess-text/40 py-6 font-serif-display italic relative z-10">
        🏰 "No reino da Aurora, a felicidade é o nosso final feliz."
      </footer>
    </main>
  );
}
