import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getInviteInfo } from '@/lib/invite';
import { parseMembers, summarizeConfirmed, type FamilyMember } from '@/lib/guests';
import { db } from '@/lib/db';
import {
  Calendar, Users, Wallet, CheckSquare, Leaf, ArrowRight,
  MapPin, Clock, TreePine, AlertTriangle, CheckCircle2, XCircle,
  Building2, Baby, User, TrendingUp, PartyPopper,
} from 'lucide-react';

// Painel mostra dados ao vivo (RSVP, pagamentos): sem isso o Next gera a página no build
// e serve uma versão em cache, e confirmações novas demoram a aparecer.
export const dynamic = 'force-dynamic';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDateShort = (d: Date | null) =>
  d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getData() {
  try {
    const event = await db.event.findFirst({ orderBy: { date: 'asc' } });

    const [guests, tasks, expenses, vendors] = await Promise.all([
      db.guest.findMany({
        where: event ? { eventId: event.id } : {},
        orderBy: { createdAt: 'desc' },
      }),
      db.task.findMany({ orderBy: { createdAt: 'asc' } }),
      db.expense.findMany({
        include: { vendor: { include: { payments: true } } },
      }),
      db.vendor.findMany({
        include: { payments: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { event, guests, tasks, expenses, vendors };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('[Dashboard] getData FAILED:', msg);
    if (stack) console.error('[Dashboard] stack:', stack);
    return { event: null, guests: [], tasks: [], expenses: [], vendors: [] };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const { event, guests, tasks, expenses, vendors } = await getData();

  const info = event ? getInviteInfo(event) : null;

  // ── Countdown ──
  let daysLeft = 0;
  let isPast = false;
  let isToday = false;

  if (event) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const party = new Date(event.date); party.setHours(0, 0, 0, 0);
    daysLeft = Math.ceil((party.getTime() - today.getTime()) / 86400000);
    isPast   = daysLeft < 0;
    isToday  = daysLeft === 0;
  }

  // ── Guests ──
  const confirmed    = guests.filter(g => g.status === 'confirmado');
  const pending      = guests.filter(g => g.status === 'pendente');
  const declined     = guests.filter(g => g.status === 'nao_vai');
  const confPessoas  = confirmed.reduce((s, g) => s + g.adultsCount + g.childrenCount, 0);
  const confAdultos  = confirmed.reduce((s, g) => s + g.adultsCount, 0);
  const confCriancas = confirmed.reduce((s, g) => s + g.childrenCount, 0);

  // ── Buffet: até 5 anos e bebês de colo não pagam; famílias antigas sem membros contam como adultos ──
  const buffet = summarizeConfirmed(confirmed.flatMap((g): FamilyMember[] => {
    const members = parseMembers(g.familyMembers as string | null);
    return members.length > 0
      ? members
      : Array.from({ length: g.adultsCount + g.childrenCount }, () => ({ name: g.name, type: 'adulto' as const, confirmed: true }));
  }));

  // ── Budget (usa Payment model) ──
  const totalPlanned  = expenses.reduce((s, e) => s + e.plannedValue, 0);
  const totalActual   = expenses.reduce((s, e) => s + e.actualValue, 0);
  const totalPaid     = vendors.reduce((s, v) => s + v.payments.reduce((ps, p) => ps + p.amount, 0), 0);
  const totalRem      = Math.max(0, totalActual - totalPaid);
  const pctActual     = totalPlanned > 0 ? Math.min(100, (totalActual / totalPlanned) * 100) : 0;
  const pctPaid       = totalActual  > 0 ? Math.min(100, (totalPaid  / totalActual)  * 100) : 0;
  const isOverBudget  = totalActual > totalPlanned && totalPlanned > 0;

  // ── Tasks ──
  const totalTasks     = tasks.length;
  const doneTasks      = tasks.filter(t => t.completed).length;
  const taskPct        = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const urgentTasks    = tasks.filter(t => !t.completed && t.priority === 'alta').slice(0, 5);

  // ── Recent RSVPs (online + manual confirmados/recusados) ──
  const recentRsvps = guests
    .filter(g => g.respondedAt)
    .sort((a, b) => new Date(b.respondedAt!).getTime() - new Date(a.respondedAt!).getTime())
    .slice(0, 6);

  // ── Vendors sem contrato ──
  const vendorsPendentes = vendors.filter(v => v.status === 'a_cotar').slice(0, 4);

  return (
    <div className="space-y-6">

      {/* ════════════════════════════════════════════════════════════════════
          HERO: brasão, dados do convite e contagem regressiva
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#fbfaf6]/90 rounded-3xl border border-princess-pink princess-card-shadow overflow-hidden">
        <div className="grid gap-6 p-5 sm:p-7 lg:p-8 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <Image
            src="/convite/brasao.webp"
            alt=""
            width={502}
            height={502}
            priority
            unoptimized
            className="w-32 sm:w-36 lg:w-44 h-auto mx-auto md:mx-0 drop-shadow-sm"
          />

          <div className="text-center md:text-left space-y-3 min-w-0">
            <div>
              <h1 className="font-serif-display text-3xl lg:text-4xl text-forest-sage leading-tight">
                1º aniversário da {event?.babyName || 'Aurora'}
              </h1>
              <p className="text-princess-text/70 text-sm mt-1">
                {event ? 'Era uma vez… um bosque encantado' : 'Configure o evento em Configurações'}
              </p>
            </div>

            {info && (
              <ul className="flex flex-wrap justify-center md:justify-start gap-2 text-sm">
                <li className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-princess-pink">
                  <Calendar size={15} className="text-forest-olive shrink-0" />
                  <span className="font-semibold">{info.dateLabel} · {info.weekday}</span>
                </li>
                <li className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-princess-pink">
                  <Clock size={15} className="text-forest-olive shrink-0" />
                  <span className="font-semibold">{info.timeLabel ? `Às ${info.timeLabel}` : 'Horário a confirmar'}</span>
                </li>
                <li className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-princess-pink">
                  <MapPin size={15} className="text-forest-olive shrink-0" />
                  <span className="font-semibold">{info.location ? info.location.name : 'Local revelado após o RSVP'}</span>
                </li>
                {info.deadlineLabel && (
                  <li className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-princess-gold-light border border-princess-gold/25 text-princess-gold-dark">
                    <CheckCircle2 size={15} className="shrink-0" />
                    <span className="font-semibold">RSVP até {info.deadlineLabel}</span>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Contagem regressiva */}
          {event && (
            <div className={`mx-auto md:mx-0 grid place-items-center text-center w-36 h-36 rounded-full border-4 ${
              isToday
                ? 'bg-princess-rose text-white border-princess-rose'
                : isPast
                ? 'bg-white text-princess-text/70 border-princess-pink'
                : 'bg-white text-princess-rose border-princess-rose/70'
            }`}>
              {isToday ? (
                <div>
                  <PartyPopper size={26} className="mx-auto mb-1" />
                  <p className="text-2xl font-serif-display">É hoje!</p>
                </div>
              ) : isPast ? (
                <div>
                  <p className="text-xs font-semibold">Aconteceu há</p>
                  <p className="text-4xl font-serif-display text-forest-sage-dark">{Math.abs(daysLeft)}</p>
                  <p className="text-xs text-princess-text/60">dias</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-princess-text/60">Faltam</p>
                  <p className="text-5xl font-serif-display leading-none my-1 tabular-nums">{daysLeft}</p>
                  <p className="text-sm font-semibold">{daysLeft === 1 ? 'dia' : 'dias'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          3 CARDS DE RESUMO
      ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* ── Card: Confirmações ── */}
        <div className="bg-white rounded-2xl p-6 border border-princess-pink-light/40 princess-card-shadow space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-princess-text/60">Confirmações</p>
            <div className="w-9 h-9 rounded-xl bg-princess-pink-light flex items-center justify-center">
              <Users size={18} className="text-princess-rose" />
            </div>
          </div>

          {/* Total confirmados */}
          <div>
            <p className="text-4xl font-serif-display font-bold text-forest-sage-dark">{confPessoas}</p>
            <p className="text-xs text-princess-text/50 mt-0.5">pessoas confirmadas</p>
          </div>

          {/* Adultos / crianças */}
          <div className="flex gap-3">
            <div className="flex-1 bg-princess-pink-light border border-princess-lilac rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-bold text-forest-sage-dark">{confAdultos}</p>
              <p className="text-xs text-forest-sage-dark font-medium flex items-center justify-center gap-0.5 mt-0.5">
                <User size={9} /> Adultos
              </p>
            </div>
            <div className="flex-1 bg-princess-gold-light border border-princess-gold/25 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-bold text-princess-gold-dark">{confCriancas}</p>
              <p className="text-xs text-princess-gold font-medium flex items-center justify-center gap-0.5 mt-0.5">
                <Baby size={9} /> Crianças
              </p>
            </div>
          </div>

          {/* Buffet */}
          <div className="rounded-xl bg-white border border-princess-pink px-3 py-2.5 text-sm">
            <p className="flex items-baseline justify-between gap-2">
              <span className="text-princess-text/70">Entram no buffet</span>
              <span className="font-bold text-forest-sage-dark tabular-nums">{buffet.buffet}</span>
            </p>
            <p className="flex items-baseline justify-between gap-2 mt-0.5">
              <span className="text-princess-text/70">Não pagam (até 5 anos e bebês)</span>
              <span className="font-bold tabular-nums">{buffet.free}</span>
            </p>
            {buffet.ageMissing > 0 && (
              <p className="text-xs text-princess-gold-dark mt-1.5">
                {buffet.ageMissing} {buffet.ageMissing === 1 ? 'criança confirmada sem idade' : 'crianças confirmadas sem idade'}, contando no buffet
              </p>
            )}
          </div>

          {/* Pendentes + recusados */}
          <div className="flex items-center justify-between pt-3 border-t border-princess-pink-light/40 text-xs">
            <span className="flex items-center gap-1 text-princess-gold font-medium">
              <Clock size={11} /> {pending.length} aguardando
            </span>
            <span className="flex items-center gap-1 text-forest-berry font-medium">
              <XCircle size={11} /> {declined.length} recusaram
            </span>
          </div>

          <Link href="/admin/convidados"
            className="flex items-center justify-center gap-1 min-h-11 text-sm md:text-xs text-princess-rose font-semibold hover:underline">
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>

        {/* ── Card: Orçamento ── */}
        <div className="bg-white rounded-2xl p-6 border border-princess-pink-light/40 princess-card-shadow space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-princess-text/60">Orçamento & Contas</p>
            <div className="w-9 h-9 rounded-xl bg-princess-gold-light flex items-center justify-center">
              <Wallet size={18} className="text-princess-gold" />
            </div>
          </div>

          {/* Total previsto / contratado */}
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-princess-text/50">Previsto</span>
              <span className="font-bold text-princess-text">{fmt(totalPlanned)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-princess-text/50">Contratado</span>
              <span className={`font-bold ${isOverBudget ? 'text-forest-berry' : 'text-princess-rose'}`}>{fmt(totalActual)}</span>
            </div>
            {totalPlanned > 0 && (
              <p className="text-xs text-princess-text/40">{pctActual.toFixed(0)}% do previsto contratado</p>
            )}
          </div>

          {/* Barra dupla */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-princess-text/50">
              <span className="text-forest-sage-dark font-semibold">Pago: {fmt(totalPaid)}</span>
              <span className="text-princess-gold font-semibold">Restante: {fmt(totalRem)}</span>
            </div>
            <div className="relative w-full h-3 bg-princess-pink-light/30 rounded-full overflow-hidden border border-princess-pink/10">
              {totalPlanned > 0 && (
                <div className="absolute inset-y-0 left-0 rounded-full bg-princess-rose/20 transition-all duration-700"
                  style={{ width: `${pctActual}%` }} />
              )}
              <div className="absolute inset-y-0 left-0 rounded-full bg-princess-rose transition-all duration-700"
                style={{ width: `${pctPaid}%` }} />
            </div>
            <div className="flex items-center gap-3 text-xs text-princess-text/40">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-princess-rose inline-block" /> Pago</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-princess-rose/25 inline-block" /> Contratado</span>
            </div>
          </div>

          <Link href="/admin/orcamento"
            className="flex items-center justify-center gap-1 min-h-11 text-sm md:text-xs text-princess-rose font-semibold hover:underline">
            Ver orçamento <ArrowRight size={12} />
          </Link>
        </div>

        {/* ── Card: Tarefas ── */}
        <div className="bg-white rounded-2xl p-6 border border-princess-pink-light/40 princess-card-shadow space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-princess-text/60">Checklist de Tarefas</p>
            <div className="w-9 h-9 rounded-xl bg-princess-gold-light flex items-center justify-center">
              <CheckSquare size={18} className="text-princess-gold" />
            </div>
          </div>

          {/* % concluídas */}
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-serif-display font-bold text-princess-text">{taskPct}<span className="text-2xl">%</span></p>
              <p className="text-xs text-princess-text/50">concluídas</p>
            </div>
          </div>

          {/* Barra */}
          <div className="space-y-2">
            <div className="w-full h-3 bg-princess-gold-light rounded-full overflow-hidden border border-princess-gold/25">
              <div className="h-full rounded-full bg-princess-gold transition-all duration-700"
                style={{ width: `${taskPct}%` }} />
            </div>
            <div className="flex gap-2">
              <span className="flex-1 text-center text-xs bg-princess-gold-light border border-princess-gold/25 rounded-xl py-1.5 font-semibold text-princess-gold">
                {doneTasks} feitas
              </span>
              <span className="flex-1 text-center text-xs bg-princess-gold-light border border-princess-gold/25 rounded-xl py-1.5 font-semibold text-princess-gold">
                {totalTasks - doneTasks} pendentes
              </span>
            </div>
          </div>

          {/* Urgentes */}
          {urgentTasks.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-forest-berry bg-[#f9ebe8] border border-[#f1d5cf] rounded-xl px-3 py-2">
              <AlertTriangle size={12} />
              <span><strong>{urgentTasks.length}</strong> tarefa{urgentTasks.length > 1 ? 's' : ''} urgente{urgentTasks.length > 1 ? 's' : ''} pendente{urgentTasks.length > 1 ? 's' : ''}</span>
            </div>
          )}

          <Link href="/admin/tarefas"
            className="flex items-center justify-center gap-1 min-h-11 text-sm md:text-xs text-princess-rose font-semibold hover:underline">
            Ver checklist <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          GRID INFERIOR — Tarefas urgentes + RSVPs + Fornecedores
      ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Tarefas Urgentes ── */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-princess-pink-light/40 princess-card-shadow overflow-hidden">
          <div className="px-5 py-4 border-b border-princess-pink-light/30 flex items-center justify-between">
            <h3 className="font-serif-display font-bold text-base text-princess-text flex items-center gap-2">
              <AlertTriangle size={16} className="text-forest-berry" /> Tarefas Urgentes
            </h3>
            <Link href="/admin/tarefas" className="text-sm md:text-xs text-princess-rose font-bold hover:underline flex items-center gap-0.5 min-h-11 -my-3 px-1">
              Ver todas <ArrowRight size={11} />
            </Link>
          </div>

          <div className="divide-y divide-princess-pink-light/20">
            {urgentTasks.length > 0 ? urgentTasks.map(task => (
              <div key={task.id} className="px-5 py-3.5 hover:bg-princess-lavender/60 transition">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 w-2 h-2 rounded-full bg-forest-berry shrink-0 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium text-princess-text leading-snug">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-forest-berry bg-[#f9ebe8] border border-[#f1d5cf] px-1.5 py-0.5 rounded uppercase tracking-wide">
                        Alta
                      </span>
                      <span className="text-xs text-princess-text/45">{task.category}</span>
                      {task.dueDate && (
                        <span className="text-xs text-princess-text/45 flex items-center gap-0.5">
                          <Clock size={9} /> {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="px-5 py-10 text-center">
                <CheckCircle2 size={28} className="mx-auto text-princess-rose mb-2" />
                <p className="text-sm text-princess-text/50 font-medium">Nenhuma tarefa urgente!</p>
                <p className="text-xs text-princess-text/35 mt-0.5">Bom trabalho ✨</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Últimos RSVPs ── */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-princess-pink-light/40 princess-card-shadow overflow-hidden">
          <div className="px-5 py-4 border-b border-princess-pink-light/30 flex items-center justify-between">
            <h3 className="font-serif-display font-bold text-base text-princess-text flex items-center gap-2">
              <Leaf size={16} className="text-princess-gold" /> Últimos RSVPs
            </h3>
            <Link href="/admin/convidados" className="text-sm md:text-xs text-princess-rose font-bold hover:underline flex items-center gap-0.5 min-h-11 -my-3 px-1">
              Ver todos <ArrowRight size={11} />
            </Link>
          </div>

          <div className="divide-y divide-princess-pink-light/20">
            {recentRsvps.length > 0 ? recentRsvps.map(g => (
              <div key={g.id} className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-princess-lavender/60 transition">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-princess-text truncate">{g.name}</p>
                  <p className="text-xs text-princess-text/40 mt-0.5 flex items-center gap-1">
                    <Clock size={9} />
                    {fmtDateShort(g.respondedAt)}
                    <span className="ml-1 capitalize text-princess-text/30">{g.origin === 'rsvp_online' ? '· online' : '· manual'}</span>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {g.status === 'confirmado' && (
                    <>
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-forest-sage-dark bg-princess-pink-light border border-princess-lilac px-2 py-0.5 rounded-lg">
                        <CheckCircle2 size={10} /> Confirmou
                      </span>
                      <p className="text-xs text-princess-text/45 mt-0.5">
                        {g.adultsCount + g.childrenCount} {g.adultsCount + g.childrenCount === 1 ? 'pessoa' : 'pessoas'}
                      </p>
                    </>
                  )}
                  {g.status === 'nao_vai' && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-forest-berry bg-[#f9ebe8] border border-[#ebc6be] px-2 py-0.5 rounded-lg">
                      <XCircle size={10} /> Não vai
                    </span>
                  )}
                  {g.status === 'pendente' && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-princess-gold-dark bg-princess-gold-light border border-princess-gold/25 px-2 py-0.5 rounded-lg">
                      <Clock size={10} /> Pendente
                    </span>
                  )}
                </div>
              </div>
            )) : (
              <div className="px-5 py-10 text-center">
                <TreePine size={28} className="mx-auto text-princess-rose/25 mb-2" />
                <p className="text-sm text-princess-text/50 font-medium">Nenhum RSVP ainda.</p>
                <p className="text-xs text-princess-text/35 mt-0.5">Envie o link do convite!</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Fornecedores a Confirmar ── */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-princess-pink-light/40 princess-card-shadow overflow-hidden">
          <div className="px-5 py-4 border-b border-princess-pink-light/30 flex items-center justify-between">
            <h3 className="font-serif-display font-bold text-base text-princess-text flex items-center gap-2">
              <Building2 size={16} className="text-princess-rose" /> Fornecedores
            </h3>
            <Link href="/admin/fornecedores" className="text-sm md:text-xs text-princess-rose font-bold hover:underline flex items-center gap-0.5 min-h-11 -my-3 px-1">
              Ver todos <ArrowRight size={11} />
            </Link>
          </div>

          {/* Resumo rápido */}
          <div className="px-5 py-3 border-b border-princess-pink-light/15 grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'A Cotar',    count: vendors.filter(v => v.status === 'a_cotar').length,    cls: 'text-princess-gold bg-princess-gold-light border-princess-gold/25' },
              { label: 'Contratado', count: vendors.filter(v => v.status === 'contratado').length, cls: 'text-forest-sage-dark bg-princess-pink-light border-princess-lilac' },
              { label: 'Pago',       count: vendors.filter(v => v.status === 'pago').length,       cls: 'text-forest-sage-dark bg-princess-pink-light border-princess-lilac' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border px-2 py-2 ${s.cls}`}>
                <p className="text-lg font-bold">{s.count}</p>
                <p className="text-xs font-semibold">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="divide-y divide-princess-pink-light/20">
            {vendorsPendentes.length > 0 ? vendorsPendentes.map(v => (
              <div key={v.id} className="px-5 py-3 flex items-center justify-between hover:bg-princess-lavender/60 transition">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-princess-text truncate">{v.name}</p>
                  <p className="text-xs text-princess-text/45 mt-0.5">{v.service}</p>
                </div>
                <div className="shrink-0 ml-2 text-right">
                  <span className="text-xs font-bold text-princess-gold-dark bg-princess-gold-light border border-princess-gold/25 px-2 py-0.5 rounded-lg">
                    A Cotar
                  </span>
                  {v.agreedValue > 0 && (
                    <p className="text-xs text-princess-text/45 mt-0.5">{fmt(v.agreedValue)}</p>
                  )}
                </div>
              </div>
            )) : (
              <div className="px-5 py-8 text-center">
                <TrendingUp size={24} className="mx-auto text-princess-rose mb-2" />
                <p className="text-sm text-princess-text/50 font-medium">Tudo contratado!</p>
                <p className="text-xs text-princess-text/35 mt-0.5">Nenhum fornecedor a cotar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
