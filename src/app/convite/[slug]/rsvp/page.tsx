import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import RsvpFormClient from './RsvpFormClient';
import { Crown, Sparkles, Heart } from 'lucide-react';
import { Metadata } from 'next';

interface RsvpPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RsvpPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await db.event.findUnique({
    where: { slug },
  });

  return {
    title: event ? `Confirmar Presença: 1 Ano da ${event.babyName} 👑` : 'Confirmação Não Encontrada',
    description: 'Confirme sua presença no aniversário!',
  };
}

export default async function RsvpPage({ params }: RsvpPageProps) {
  const { slug } = await params;

  const event = await db.event.findUnique({
    where: { slug },
  });

  if (!event) {
    notFound();
  }

  return (
    <main className="min-h-screen w-full princess-gradient flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-6 left-6 text-princess-pink-dark animate-float opacity-30">
        <Crown size={28} />
      </div>
      <div className="absolute bottom-6 right-6 text-princess-gold animate-sparkle-1 opacity-30">
        <Sparkles size={24} />
      </div>

      <RsvpFormClient slug={slug} babyName={event.babyName} />

      <footer className="text-center text-[10px] text-princess-text/40 mt-8 font-serif-display italic">
        🏰 "Celebrando um ano de pura magia."
      </footer>
    </main>
  );
}
