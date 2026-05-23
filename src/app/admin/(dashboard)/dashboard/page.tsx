import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import {
  Calendar,
  Users,
  Wallet,
  CheckSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  MapPin
} from 'lucide-react';

// Forçar a re-validação dos dados no Next.js Server Components
export const revalidate = 0;

async function getDashboardData() {
  const event = await db.event.findFirst({
    orderBy: { date: 'asc' },
  });

  const guests = await db.guest.findMany({
    where: event ? { eventId: event.id } : {},
    orderBy: { respondedAt: 'desc' },
  });

  const tasks = await db.task.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const expenses = await db.expense.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return { event, guests, tasks, expenses };
}

export default async function DashboardPage() {
  const { event, guests, tasks, expenses } = await getDashboardData();

  // 1. Cálculo do contador de dias
  let daysRemaining = 0;
  let countdownText = 'Data não configurada';
  let isPast = false;

  if (event) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const partyDate = new Date(event.date);
    partyDate.setHours(0, 0, 0, 0);

    const diffTime = partyDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRemaining > 0) {
      countdownText = `${daysRemaining} dias restantes`;
    } else if (daysRemaining === 0) {
      countdownText = 'É HOJE! 🎉';
    } else {
      countdownText = `Aconteceu há ${Math.abs(daysRemaining)} dias`;
      isPast = true;
    }
  }

  // 2. Estatísticas de convidados
  const totalGuestsGroupCount = guests.length; // famílias
  const guestsConfirmed = guests.filter((g) => g.status === 'confirmado');
  const totalConfirmedPessoas = guestsConfirmed.reduce(
    (sum, g) => sum + g.adultsCount + g.childrenCount,
    0
  );
  const totalConfirmedAdults = guestsConfirmed.reduce((sum, g) => sum + g.adultsCount, 0);
  const totalConfirmedChildren = guestsConfirmed.reduce((sum, g) => sum + g.childrenCount, 0);

  const guestsPending = guests.filter((g) => g.status === 'pendente');
  const totalPendingPessoas = guestsPending.reduce(
    (sum, g) => sum + g.adultsCount + g.childrenCount,
    0
  );

  const guestsDeclined = guests.filter((g) => g.status === 'nao_vai');
  const totalDeclinedPessoas = guestsDeclined.reduce(
    (sum, g) => sum + g.adultsCount + g.childrenCount,
    0
  );

  const totalInvitedPessoas =
    totalConfirmedPessoas + totalPendingPessoas + totalDeclinedPessoas;

  // 3. Checklist
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const urgentTasks = tasks
    .filter((t) => !t.completed && t.priority === 'alta')
    .slice(0, 5);

  // 4. Orçamento
  const totalPlanned = expenses.reduce((sum, e) => sum + e.plannedValue, 0);
  const totalActual = expenses.reduce((sum, e) => sum + e.actualValue, 0);
  const totalPaid = expenses
    .filter((e) => e.paid)
    .reduce((sum, e) => sum + (e.actualValue || e.plannedValue), 0);

  const budgetSpentPercentage =
    totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;
  const isBudgetOver = totalActual > totalPlanned;

  // 5. Últimas RSVPs
  const recentRsvps = guests
    .filter((g) => g.origin === 'rsvp_online' && g.respondedAt)
    .slice(0, 5);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: Date) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <>
      {/* Welcome Card & Countdown */}
      <div className="bg-white rounded-2xl p-6 md:p-8 princess-card-shadow gold-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        {/* Magical backgrounds sparkles */}
        <div className="absolute top-2 right-4 text-princess-pink animate-sparkle-1 opacity-40">
          <Sparkles size={20} />
        </div>
        <div className="absolute bottom-2 left-6 text-princess-gold animate-sparkle-2 opacity-40">
          <Sparkles size={16} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-princess-rose font-medium text-sm">
            <Sparkles size={16} className="animate-spin" style={{ animationDuration: '6s' }} />
            <span>O Reino está em preparação!</span>
          </div>
          <h2 className="font-serif-display text-2xl md:text-3xl font-bold text-princess-text">
            Aniversário da {event?.babyName || 'Aurora'}
          </h2>
          {event ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-princess-text/70 mt-1">
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-princess-rose" />
                {formatDate(event.date)} às {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-princess-rose" />
                {event.locationName}
              </span>
            </div>
          ) : (
            <p className="text-sm text-princess-text/60">Configurações do evento pendentes.</p>
          )}
        </div>

        <div className={`px-6 py-4 rounded-2xl flex flex-col items-center justify-center min-w-[160px] text-center border ${
          isPast 
            ? 'bg-princess-lavender border-princess-lilac/30 text-princess-text/70' 
            : 'bg-princess-pink-light border-princess-pink/40 text-princess-rose animate-float'
        }`}>
          <span className="text-xs uppercase tracking-wider font-semibold opacity-80">Contagem</span>
          <span className="text-2xl font-serif-display font-bold mt-1">{countdownText}</span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Guest Stats */}
        <div className="bg-white rounded-2xl p-6 princess-card-shadow gold-border flex flex-col justify-between princess-card-shadow-hover">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-princess-text/60">Confirmações RSVP</span>
            <div className="p-3 bg-princess-pink-light rounded-xl text-princess-rose">
              <Users size={20} />
            </div>
          </div>
          <div className="my-4">
            <span className="text-3xl font-serif-display font-bold text-princess-rose">
              {totalConfirmedPessoas}
            </span>
            <span className="text-sm text-princess-text/60 ml-2">pessoas confirmadas</span>
            <div className="flex items-center gap-4 mt-2 text-xs text-princess-text/70 bg-princess-pink-light/30 p-2.5 rounded-lg border border-princess-pink/20">
              <div>
                <strong>{totalConfirmedAdults}</strong> Adultos
              </div>
              <div className="h-3 w-px bg-princess-pink/40"></div>
              <div>
                <strong>{totalConfirmedChildren}</strong> Crianças
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-princess-text/60 pt-3 border-t border-princess-pink-light">
            <span>Pendentes: {totalPendingPessoas}</span>
            <span>Recusados: {totalDeclinedPessoas}</span>
          </div>
        </div>

        {/* Budget Stats */}
        <div className="bg-white rounded-2xl p-6 princess-card-shadow gold-border flex flex-col justify-between princess-card-shadow-hover">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-princess-text/60">Orçamento & Contas</span>
            <div className="p-3 bg-amber-50 rounded-xl text-princess-gold">
              <Wallet size={20} />
            </div>
          </div>
          <div className="my-4 space-y-2">
            <div>
              <span className="text-3xl font-serif-display font-bold text-princess-text">
                {formatCurrency(totalActual)}
              </span>
              <span className="text-xs text-princess-text/60 block mt-0.5">
                previsto total: {formatCurrency(totalPlanned)}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-princess-pink-light/40 rounded-full h-2.5 overflow-hidden border border-princess-pink/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isBudgetOver ? 'bg-red-400' : 'bg-gradient-to-r from-princess-rose to-princess-gold'
                }`}
                style={{ width: `${Math.min(100, budgetSpentPercentage)}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-princess-text/60 pt-3 border-t border-princess-pink-light">
            <span className="flex items-center gap-1">
              <TrendingUp size={12} className={isBudgetOver ? 'text-red-500' : 'text-princess-rose'} />
              {budgetSpentPercentage}% do previsto
            </span>
            <span className="text-emerald-600 font-medium">Pago: {formatCurrency(totalPaid)}</span>
          </div>
        </div>

        {/* Checklist Stats */}
        <div className="bg-white rounded-2xl p-6 princess-card-shadow gold-border flex flex-col justify-between princess-card-shadow-hover sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-princess-text/60">Tarefas Checklist</span>
            <div className="p-3 bg-purple-50 rounded-xl text-princess-lilac">
              <CheckSquare size={20} />
            </div>
          </div>
          <div className="my-4">
            <span className="text-3xl font-serif-display font-bold text-princess-text">
              {taskPercentage}%
            </span>
            <span className="text-sm text-princess-text/60 ml-2">concluídas</span>
            <div className="flex items-center gap-2 text-xs text-princess-text/70 mt-2">
              <span className="px-2 py-1 bg-princess-lavender rounded-lg border border-princess-lilac/30">
                {completedTasks} concluídas
              </span>
              <span className="px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                {totalTasks - completedTasks} pendentes
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-princess-text/60 pt-3 border-t border-princess-pink-light">
            <span>Checklist Realizado</span>
            <Link
              href="/admin/tarefas"
              className="text-princess-rose hover:underline flex items-center gap-0.5 font-medium"
            >
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Checklist & RSVPs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: High Priority Pending Tasks */}
        <div className="bg-white rounded-2xl p-6 princess-card-shadow border border-princess-pink-light/40">
          <div className="flex items-center justify-between mb-4 border-b border-princess-pink-light/50 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-princess-rose" />
              <h3 className="font-serif-display font-bold text-lg text-princess-text">Tarefas Urgentes</h3>
            </div>
            <Link
              href="/admin/tarefas"
              className="text-xs text-princess-rose font-semibold hover:underline"
            >
              Ir para checklist
            </Link>
          </div>

          {urgentTasks.length > 0 ? (
            <div className="divide-y divide-princess-pink-light/30">
              {urgentTasks.map((task) => (
                <div key={task.id} className="py-3 flex items-start justify-between gap-3 group">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-50 text-red-500 border border-red-100">
                      Alta
                    </span>
                    <p className="text-sm font-medium text-princess-text mt-1">{task.title}</p>
                    <span className="text-[11px] text-princess-text/50 block">{task.category}</span>
                  </div>
                  {task.dueDate && (
                    <span className="text-xs text-princess-text/60 flex items-center gap-1 bg-gray-50 p-1.5 rounded-lg">
                      <Clock size={12} />
                      {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-princess-text/50 text-sm">
              ✨ Nenhuma tarefa urgente pendente! Bom trabalho!
            </div>
          )}
        </div>

        {/* Right Column: Recent RSVP Activity */}
        <div className="bg-white rounded-2xl p-6 princess-card-shadow border border-princess-pink-light/40">
          <div className="flex items-center justify-between mb-4 border-b border-princess-pink-light/50 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-princess-gold" />
              <h3 className="font-serif-display font-bold text-lg text-princess-text">Últimos RSVPs Online</h3>
            </div>
            <Link
              href="/admin/convidados"
              className="text-xs text-princess-rose font-semibold hover:underline"
            >
              Ver convidados
            </Link>
          </div>

          {recentRsvps.length > 0 ? (
            <div className="divide-y divide-princess-pink-light/30">
              {recentRsvps.map((guest) => (
                <div key={guest.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-princess-text">{guest.name}</p>
                    {guest.respondedAt && (
                      <span className="text-[10px] text-princess-text/40 block">
                        Confirmado em {new Date(guest.respondedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                        guest.status === 'confirmado'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-red-50 text-red-500 border border-red-100'
                      }`}
                    >
                      {guest.status === 'confirmado' ? 'Confirmou' : 'Recusou'}
                    </span>
                    {guest.status === 'confirmado' && (
                      <span className="text-[11px] text-princess-text/60 block mt-1">
                        {guest.adultsCount} ad. + {guest.childrenCount} cr.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-princess-text/50 text-sm">
              🏰 Nenhum RSVP online recebido ainda. Envie o convite!
            </div>
          )}
        </div>
      </div>
    </>
  );
}
