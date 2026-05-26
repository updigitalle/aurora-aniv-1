import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import {
  Calendar, Users, Wallet, CheckSquare, Sparkles, ArrowRight,
  MapPin, Clock, Crown, AlertTriangle, CheckCircle2, XCircle,
  Building2, Baby, User, TrendingUp, PartyPopper, Star,
} from 'lucide-react';

export const revalidate = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDateLong = (d: Date) =>
  new Date(d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

const fmtTime = (d: Date) =>
  new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

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
          HERO — Título + Countdown
      ════════════════════════════════════════════════════════════════════ */}
      <div className="relative bg-gradient-to-br from-[#FFF2F5] via-white to-[#F5F0FF] rounded-3xl p-6 md:p-8 border border-princess-pink/30 princess-card-shadow overflow-hidden">
        {/* Decorações de fundo */}
        <div className="absolute top-4 right-8 text-princess-pink/20 animate-sparkle-1 pointer-events-none">
          <Crown size={56} />
        </div>
        <div className="absolute bottom-4 left-6 text-princess-gold/15 animate-sparkle-2 pointer-events-none">
          <Sparkles size={40} />
        </div>
        <div className="absolute top-6 right-28 text-princess-rose/10 pointer-events-none">
          <Star size={24} />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Info do evento */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-princess-rose bg-princess-pink-light/70 border border-princess-pink/30 px-3 py-1.5 rounded-full">
                <Sparkles size={12} className="animate-spin" style={{ animationDuration: '6s' }} />
                O Reino Está em Preparação
              </div>
            </div>

            <div>
              <h1 className="font-serif-display text-3xl md:text-4xl font-bold text-princess-text leading-tight">
                Aniversário da{' '}
                <span className="text-princess-rose">{event?.babyName || 'Aurora'}</span>
              </h1>
              <p className="text-princess-text/55 text-sm mt-1 font-medium">
                {event?.name || 'Configure o evento nas Configurações'}
              </p>
            </div>

            {event && (
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 text-sm text-princess-text/70">
                <div className="flex items-center gap-2 bg-white/70 backdrop-blur px-3 py-2 rounded-xl border border-princess-pink/20">
                  <Calendar size={14} className="text-princess-rose shrink-0" />
                  <span className="font-semibold capitalize">{fmtDateLong(event.date)}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/70 backdrop-blur px-3 py-2 rounded-xl border border-princess-pink/20">
                  <Clock size={14} className="text-princess-rose shrink-0" />
                  <span className="font-semibold">às {fmtTime(event.date)}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/70 backdrop-blur px-3 py-2 rounded-xl border border-princess-pink/20">
                  <MapPin size={14} className="text-princess-rose shrink-0" />
                  <span className="font-semibold">{event.locationName}</span>
                </div>
                {event.locationAddress && (
                  <div className="flex items-center gap-2 text-princess-text/50 px-1">
                    <span className="text-xs">{event.locationAddress}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Countdown box */}
          {event && (
            <div className={`flex-shrink-0 px-8 py-6 rounded-2xl text-center border-2 min-w-[180px] ${
              isToday
                ? 'bg-gradient-to-br from-princess-rose to-princess-pink-dark text-white border-princess-rose shadow-lg animate-float'
                : isPast
                ? 'bg-white/80 text-princess-text/60 border-princess-pink/20'
                : 'bg-white/80 text-princess-rose border-princess-pink/40 animate-float'
            }`}>
              {isToday ? (
                <>
                  <PartyPopper size={28} className="mx-auto mb-2" />
                  <p className="text-2xl font-serif-display font-bold">É HOJE!</p>
                  <p className="text-xs mt-1 opacity-80">✨ Que dia mágico!</p>
                </>
              ) : isPast ? (
                <>
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm font-semibold">Aconteceu há</p>
                  <p className="text-3xl font-serif-display font-bold text-emerald-600">{Math.abs(daysLeft)}</p>
                  <p className="text-xs mt-1 text-princess-text/50">dias</p>
                </>
              ) : (
                <>
                  <Crown size={24} className="mx-auto mb-2 opacity-70" />
                  <p className="text-xs font-bold uppercase tracking-widest opacity-70">Faltam</p>
                  <p className="text-5xl font-serif-display font-bold mt-1">{daysLeft}</p>
                  <p className="text-sm font-semibold mt-1 opacity-80">{daysLeft === 1 ? 'dia' : 'dias'}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          3 CARDS DE RESUMO
      ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* ── Card: Confirmações ── */}
        <div className="bg-white rounded-2xl p-6 border border-princess-pink-light/40 princess-card-shadow space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-princess-text/60">Confirmações</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Users size={18} className="text-emerald-500" />
            </div>
          </div>

          {/* Total confirmados */}
          <div>
            <p className="text-4xl font-serif-display font-bold text-emerald-600">{confPessoas}</p>
            <p className="text-xs text-princess-text/50 mt-0.5">pessoas confirmadas</p>
          </div>

          {/* Adultos / crianças */}
          <div className="flex gap-3">
            <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-bold text-emerald-700">{confAdultos}</p>
              <p className="text-[10px] text-emerald-600 font-medium flex items-center justify-center gap-0.5 mt-0.5">
                <User size={9} /> Adultos
              </p>
            </div>
            <div className="flex-1 bg-pink-50 border border-pink-100 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-bold text-pink-600">{confCriancas}</p>
              <p className="text-[10px] text-pink-500 font-medium flex items-center justify-center gap-0.5 mt-0.5">
                <Baby size={9} /> Crianças
              </p>
            </div>
          </div>

          {/* Pendentes + recusados */}
          <div className="flex items-center justify-between pt-3 border-t border-princess-pink-light/40 text-xs">
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <Clock size={11} /> {pending.length} aguardando
            </span>
            <span className="flex items-center gap-1 text-red-500 font-medium">
              <XCircle size={11} /> {declined.length} recusaram
            </span>
          </div>

          <Link href="/admin/convidados"
            className="flex items-center justify-center gap-1 text-xs text-princess-rose font-semibold hover:underline">
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>

        {/* ── Card: Orçamento ── */}
        <div className="bg-white rounded-2xl p-6 border border-princess-pink-light/40 princess-card-shadow space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-princess-text/60">Orçamento & Contas</p>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Wallet size={18} className="text-amber-500" />
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
              <span className={`font-bold ${isOverBudget ? 'text-red-500' : 'text-princess-rose'}`}>{fmt(totalActual)}</span>
            </div>
            {totalPlanned > 0 && (
              <p className="text-[11px] text-princess-text/40">{pctActual.toFixed(0)}% do previsto contratado</p>
            )}
          </div>

          {/* Barra dupla */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-princess-text/50">
              <span className="text-emerald-600 font-semibold">Pago: {fmt(totalPaid)}</span>
              <span className="text-amber-600 font-semibold">Restante: {fmt(totalRem)}</span>
            </div>
            <div className="relative w-full h-3 bg-princess-pink-light/30 rounded-full overflow-hidden border border-princess-pink/10">
              {totalPlanned > 0 && (
                <div className="absolute inset-y-0 left-0 rounded-full bg-princess-rose/20 transition-all duration-700"
                  style={{ width: `${pctActual}%` }} />
              )}
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                style={{ width: `${pctPaid}%` }} />
            </div>
            <div className="flex items-center gap-3 text-[10px] text-princess-text/40">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Pago</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-princess-rose/25 inline-block" /> Contratado</span>
            </div>
          </div>

          <Link href="/admin/orcamento"
            className="flex items-center justify-center gap-1 text-xs text-princess-rose font-semibold hover:underline">
            Ver orçamento <ArrowRight size={12} />
          </Link>
        </div>

        {/* ── Card: Tarefas ── */}
        <div className="bg-white rounded-2xl p-6 border border-princess-pink-light/40 princess-card-shadow space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-princess-text/60">Checklist de Tarefas</p>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <CheckSquare size={18} className="text-purple-500" />
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
            <div className="w-full h-3 bg-purple-50 rounded-full overflow-hidden border border-purple-100">
              <div className="h-full rounded-full bg-gradient-to-r from-princess-lilac to-purple-400 transition-all duration-700"
                style={{ width: `${taskPct}%` }} />
            </div>
            <div className="flex gap-2">
              <span className="flex-1 text-center text-xs bg-purple-50 border border-purple-100 rounded-xl py-1.5 font-semibold text-purple-600">
                {doneTasks} feitas
              </span>
              <span className="flex-1 text-center text-xs bg-amber-50 border border-amber-100 rounded-xl py-1.5 font-semibold text-amber-600">
                {totalTasks - doneTasks} pendentes
              </span>
            </div>
          </div>

          {/* Urgentes */}
          {urgentTasks.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <AlertTriangle size={12} />
              <span><strong>{urgentTasks.length}</strong> tarefa{urgentTasks.length > 1 ? 's' : ''} urgente{urgentTasks.length > 1 ? 's' : ''} pendente{urgentTasks.length > 1 ? 's' : ''}</span>
            </div>
          )}

          <Link href="/admin/tarefas"
            className="flex items-center justify-center gap-1 text-xs text-princess-rose font-semibold hover:underline">
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
              <AlertTriangle size={16} className="text-red-500" /> Tarefas Urgentes
            </h3>
            <Link href="/admin/tarefas" className="text-[11px] text-princess-rose font-bold hover:underline flex items-center gap-0.5">
              Ver todas <ArrowRight size={11} />
            </Link>
          </div>

          <div className="divide-y divide-princess-pink-light/20">
            {urgentTasks.length > 0 ? urgentTasks.map(task => (
              <div key={task.id} className="px-5 py-3.5 hover:bg-[#FAF9F6]/60 transition">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 w-2 h-2 rounded-full bg-red-400 shrink-0 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium text-princess-text leading-snug">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                        Alta
                      </span>
                      <span className="text-[10px] text-princess-text/45">{task.category}</span>
                      {task.dueDate && (
                        <span className="text-[10px] text-princess-text/45 flex items-center gap-0.5">
                          <Clock size={9} /> {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="px-5 py-10 text-center">
                <CheckCircle2 size={28} className="mx-auto text-emerald-400 mb-2" />
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
              <Sparkles size={16} className="text-princess-gold" /> Últimos RSVPs
            </h3>
            <Link href="/admin/convidados" className="text-[11px] text-princess-rose font-bold hover:underline flex items-center gap-0.5">
              Ver todos <ArrowRight size={11} />
            </Link>
          </div>

          <div className="divide-y divide-princess-pink-light/20">
            {recentRsvps.length > 0 ? recentRsvps.map(g => (
              <div key={g.id} className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-[#FAF9F6]/60 transition">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-princess-text truncate">{g.name}</p>
                  <p className="text-[10px] text-princess-text/40 mt-0.5 flex items-center gap-1">
                    <Clock size={9} />
                    {fmtDateShort(g.respondedAt)}
                    <span className="ml-1 capitalize text-princess-text/30">{g.origin === 'rsvp_online' ? '· online' : '· manual'}</span>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {g.status === 'confirmado' && (
                    <>
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                        <CheckCircle2 size={10} /> Confirmou
                      </span>
                      <p className="text-[10px] text-princess-text/45 mt-0.5">
                        {g.adultsCount + g.childrenCount} {g.adultsCount + g.childrenCount === 1 ? 'pessoa' : 'pessoas'}
                      </p>
                    </>
                  )}
                  {g.status === 'nao_vai' && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                      <XCircle size={10} /> Não vai
                    </span>
                  )}
                  {g.status === 'pendente' && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      <Clock size={10} /> Pendente
                    </span>
                  )}
                </div>
              </div>
            )) : (
              <div className="px-5 py-10 text-center">
                <Crown size={28} className="mx-auto text-princess-rose/25 mb-2" />
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
            <Link href="/admin/fornecedores" className="text-[11px] text-princess-rose font-bold hover:underline flex items-center gap-0.5">
              Ver todos <ArrowRight size={11} />
            </Link>
          </div>

          {/* Resumo rápido */}
          <div className="px-5 py-3 border-b border-princess-pink-light/15 grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'A Cotar',    count: vendors.filter(v => v.status === 'a_cotar').length,    cls: 'text-amber-600 bg-amber-50 border-amber-100' },
              { label: 'Contratado', count: vendors.filter(v => v.status === 'contratado').length, cls: 'text-blue-600 bg-blue-50 border-blue-100' },
              { label: 'Pago',       count: vendors.filter(v => v.status === 'pago').length,       cls: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border px-2 py-2 ${s.cls}`}>
                <p className="text-lg font-bold">{s.count}</p>
                <p className="text-[10px] font-semibold">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="divide-y divide-princess-pink-light/20">
            {vendorsPendentes.length > 0 ? vendorsPendentes.map(v => (
              <div key={v.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#FAF9F6]/60 transition">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-princess-text truncate">{v.name}</p>
                  <p className="text-[11px] text-princess-text/45 mt-0.5">{v.service}</p>
                </div>
                <div className="shrink-0 ml-2 text-right">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                    A Cotar
                  </span>
                  {v.agreedValue > 0 && (
                    <p className="text-[10px] text-princess-text/45 mt-0.5">{fmt(v.agreedValue)}</p>
                  )}
                </div>
              </div>
            )) : (
              <div className="px-5 py-8 text-center">
                <TrendingUp size={24} className="mx-auto text-emerald-400 mb-2" />
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
