import type { Event } from '@prisma/client';

// Formatação dos dados do convite no padrão do PDF (ex.: "30.01.27", "SÁBADO", "10.11").
// Sempre no fuso de Brasília, para o servidor (UTC na Vercel) não deslocar o dia.
const TZ = 'America/Sao_Paulo';

export type InviteInfo = {
  dateLabel: string;      // "30.01.27"
  weekday: string;        // "SÁBADO"
  timeLabel: string | null; // "16:00" ou null quando o horário ainda não foi confirmado
  deadlineLabel: string | null; // "10.11" ou null quando não há prazo
  location: { name: string; address: string; mapUrl: string | null } | null; // null = revelar só após RSVP
};

export function getInviteInfo(event: Event): InviteInfo {
  const date = new Date(event.date);
  const dateLabel = date
    .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: TZ })
    .replaceAll('/', '.');
  const weekday = date
    .toLocaleDateString('pt-BR', { weekday: 'long', timeZone: TZ })
    .replace('-feira', '')
    .toUpperCase();
  const timeLabel = event.timeConfirmed
    ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
    : null;
  const deadlineLabel = event.rsvpDeadline
    ? new Date(event.rsvpDeadline)
        .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: TZ })
        .replace('/', '.')
    : null;
  const location = event.revealLocationAfterRsvp
    ? null
    : { name: event.locationName, address: event.locationAddress, mapUrl: event.locationMapUrl || null };

  return { dateLabel, weekday, timeLabel, deadlineLabel, location };
}

// Data no formato do <input type="date"> (yyyy-mm-dd), no fuso de Brasília.
export function toDateInputValue(d: Date | string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-CA', { timeZone: TZ });
}
