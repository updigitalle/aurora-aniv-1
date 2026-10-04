import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { CalendarHeart, Clock, MapPin, Check } from 'lucide-react';
import { db } from '@/lib/db';
import { conviteFonts } from '../_shared/fonts';
import { getInviteInfo } from '@/lib/invite';

interface InvitePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug } });
  return {
    title: event ? `Convite · 1 Aninho da ${event.babyName}` : 'Convite não encontrado',
    description: 'Era uma vez um bosque encantado onde morava uma pequena princesa. Você está convidado(a)!',
  };
}

export default async function PublicInvitePage({ params }: InvitePageProps) {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug } });
  if (!event) notFound();

  const info = getInviteInfo(event);

  return (
    <main className={`${conviteFonts} convite-page`}>
      <div className="convite-sheet">
        <p className="convite-text convite-intro convite-in" style={{ '--d': '0ms' } as React.CSSProperties}>
          Era uma vez…
          <br />
          um bosque encantado onde morava uma pequena princesa chamada {event.babyName}.
        </p>

        <div className="convite-crest convite-in" style={{ '--d': '250ms' } as React.CSSProperties}>
          <Image
            src="/convite/brasao.webp"
            alt={`Brasão do bosque encantado com a letra ${event.babyName[0]}, uma corça, um coelho, um esquilo e uma raposa, e a faixa "${event.babyName} 1 Aninho"`}
            width={502}
            height={502}
            priority
            unoptimized
            className="convite-crest-img"
          />
        </div>

        <h1 className="convite-text convite-title convite-in" style={{ '--d': '600ms' } as React.CSSProperties}>
          Você está convidado(a) para celebrar
          <br />
          O 1º aniversário da {event.babyName}
        </h1>

        <ul className="convite-info convite-in" style={{ '--d': '800ms' } as React.CSSProperties}>
          <li>
            <CalendarHeart className="convite-icon" strokeWidth={1.6} aria-hidden />
            <span>
              {info.dateLabel}
              <br />
              {info.weekday}
            </span>
          </li>
          <li>
            <Clock className="convite-icon" strokeWidth={1.6} aria-hidden />
            {info.timeLabel ? (
              <span>
                Às {info.timeLabel}
              </span>
            ) : (
              <span>
                Horário a ser
                <br />
                confirmado.
              </span>
            )}
          </li>
          <li>
            <MapPin className="convite-icon" strokeWidth={1.6} aria-hidden />
            {info.location ? (
              <span>
                {info.location.mapUrl ? (
                  <a href={info.location.mapUrl} target="_blank" rel="noreferrer" className="convite-map-link">
                    {info.location.name}
                  </a>
                ) : (
                  info.location.name
                )}
              </span>
            ) : (
              <span>
                Local será enviado
                <br />
                após a confirmação!
              </span>
            )}
          </li>
        </ul>

        <p className="convite-text convite-thanks convite-in" style={{ '--d': '1000ms' } as React.CSSProperties}>
          Familia e amigos, temos mais que
          <br />
          1000 motivos para agradecer!
        </p>

        <div className="convite-garland" aria-hidden>
          <Image src="/convite/guirlanda.webp" alt="" width={615} height={105} className="convite-garland-img" unoptimized />
        </div>

        <p className="convite-text convite-rsvp convite-in" style={{ '--d': '1500ms' } as React.CSSProperties}>
          {info.deadlineLabel ? `Favor confirmar a presença até o dia ${info.deadlineLabel}` : 'Favor confirmar a presença'}
        </p>

        <Link
          href={`/convite/${slug}/rsvp`}
          className="convite-cta convite-in"
          style={{ '--d': '1700ms' } as React.CSSProperties}
        >
          <span className="convite-cta-ring">
            <Check strokeWidth={2.4} aria-hidden />
          </span>
          <span className="convite-text convite-cta-label">Clique no ícone</span>
          <span className="sr-only">para confirmar presença</span>
        </Link>
      </div>
    </main>
  );
}
