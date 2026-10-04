import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ChevronLeft, Leaf } from 'lucide-react';
import { db } from '@/lib/db';
import { conviteFonts } from '../../_shared/fonts';

interface PresentesPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PresentesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug } });
  return {
    title: event ? `Sugestões de presentes · ${event.babyName}` : 'Presentes',
    description: `Sugestões de presentes para o 1º aniversário da ${event?.babyName ?? 'aniversariante'}.`,
  };
}

export default async function PresentesPage({ params }: PresentesPageProps) {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug } });
  if (!event) notFound();

  // Uma sugestão por linha; remove marcadores digitados no painel ("-", "•", "1.")
  const items = (event.giftSuggestions ?? '')
    .split('\n')
    .map(l => l.trim().replace(/^[-•✦*]\s*/, '').replace(/^\d+\.\s*/, ''))
    .filter(Boolean);

  return (
    <main className={`${conviteFonts} convite-page`}>
      <div className="rsvp-sheet">
        <Link href={`/convite/${slug}`} className="rsvp-back convite-in" style={{ '--d': '150ms' } as React.CSSProperties}>
          <ChevronLeft size={16} aria-hidden /> Voltar para o convite
        </Link>

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

        <section className="rsvp-main">
          <h1 className="convite-text rsvp-title convite-in" style={{ '--d': '250ms' } as React.CSSProperties}>
            Sugestões de presentes
          </h1>
          <p className="convite-text rsvp-lead convite-in" style={{ '--d': '400ms' } as React.CSSProperties}>
            O presente mais precioso é a sua presença no bosque da {event.babyName}.
          </p>

          <div className="rsvp-garland convite-in" style={{ '--d': '500ms' } as React.CSSProperties} aria-hidden>
            <Image src="/convite/guirlanda.webp" alt="" width={615} height={105} unoptimized />
          </div>

          <div className="rsvp-search convite-in" style={{ '--d': '650ms' } as React.CSSProperties}>
            {items.length > 0 ? (
              <ul className="presentes-list">
                {items.map((item, i) => (
                  <li key={i}>
                    <Leaf size={16} className="presentes-icon" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rsvp-empty">As sugestões de presentes ainda não foram publicadas.</p>
            )}
          </div>

          <Link
            href={`/convite/${slug}/rsvp`}
            className="rsvp-btn rsvp-btn-primary presentes-cta convite-in"
            style={{ '--d': '800ms' } as React.CSSProperties}
          >
            Confirmar presença
          </Link>
        </section>
      </div>
    </main>
  );
}
