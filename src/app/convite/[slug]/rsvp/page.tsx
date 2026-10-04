import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { db } from '@/lib/db';
import RsvpFormClient from './RsvpFormClient';
import { conviteFonts } from '../../_shared/fonts';
import { getInviteInfo } from '@/lib/invite';

interface RsvpPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RsvpPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug } });
  return {
    title: event ? `Confirmar presença · 1 Aninho da ${event.babyName}` : 'Confirmar presença',
    description: 'Confirme sua presença no 1º aniversário da Aurora.',
  };
}

export default async function RsvpPage({ params }: RsvpPageProps) {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug } });
  if (!event) notFound();

  const { deadlineLabel } = getInviteInfo(event);

  return (
    <main className={`${conviteFonts} convite-page`}>
      <div className="rsvp-sheet">
        <div className="convite-crest rsvp-crest convite-in" style={{ '--d': '0ms' } as React.CSSProperties}>
          <Image
            src="/convite/brasao.webp"
            alt={`Brasão do bosque encantado com a faixa "${event.babyName} 1 Aninho"`}
            width={502}
            height={502}
            priority
            unoptimized
            className="convite-crest-img"
          />
        </div>

        <RsvpFormClient slug={slug} babyName={event.babyName} deadline={deadlineLabel} />
      </div>
    </main>
  );
}
