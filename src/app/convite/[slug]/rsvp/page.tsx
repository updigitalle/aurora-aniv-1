import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import RsvpFormClient from './RsvpFormClient';
import { Metadata } from 'next';

interface RsvpPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RsvpPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug } });
  return {
    title: event ? `Confirmar Presença · 1 Ano da ${event.babyName} 👑` : 'RSVP',
    description: 'Confirme sua presença no aniversário!',
  };
}

export default async function RsvpPage({ params }: RsvpPageProps) {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug } });
  if (!event) notFound();

  return (
    <main className="min-h-screen gingham-bg flex flex-col items-center justify-start px-4 pt-8 pb-10 relative overflow-hidden">
      {/* Floating sparkles */}
      <span className="absolute top-10 left-6 text-xl text-princess-rose/25 animate-star-1 select-none pointer-events-none">✦</span>
      <span className="absolute top-20 right-7 text-lg text-princess-gold/30 animate-star-2 select-none pointer-events-none">★</span>
      <span className="absolute bottom-20 right-8 text-base text-princess-rose/20 animate-star-3 select-none pointer-events-none">✦</span>

      <RsvpFormClient slug={slug} babyName={event.babyName} />

      <footer className="mt-7 text-center text-[10px] text-princess-rose/30 font-serif-display italic">
        🏰 Celebrando um ano de pura magia.
      </footer>
    </main>
  );
}
