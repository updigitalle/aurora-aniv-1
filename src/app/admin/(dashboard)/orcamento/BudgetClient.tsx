'use client';

import React, { useState, useTransition } from 'react';
import { Expense, Vendor, Payment } from '@prisma/client';
import { createExpense, updateExpense, deleteExpense } from './actions';
import {
  Wallet, Plus, Trash2, Edit2, X, Search, AlertCircle,
  Sparkles, TrendingDown, TrendingUp, Tag, AlertTriangle,
  CheckCircle, Clock, CircleDashed, Building2, Info,
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type VendorWithPayments = Vendor & { payments: Payment[] };
type ExpenseFull = Expense & { vendor?: (VendorWithPayments) | null };

interface Props {
  initialExpenses: ExpenseFull[];
  vendors: VendorWithPayments[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIES = ['Espaço', 'Comida', 'Decoração', 'Serviços', 'Convites', 'Vestuário', 'Lembranças', 'Geral'];

const CAT_COLORS: Record<string, string> = {
  Espaço:     'bg-blue-50 text-blue-700 border-blue-200',
  Comida:     'bg-orange-50 text-orange-700 border-orange-200',
  Decoração:  'bg-pink-50 text-pink-700 border-pink-200',
  Serviços:   'bg-purple-50 text-purple-700 border-purple-200',
  Convites:   'bg-rose-50 text-rose-700 border-rose-200',
  Vestuário:  'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  Lembranças: 'bg-teal-50 text-teal-700 border-teal-200',
  Geral:      'bg-gray-50 text-gray-600 border-gray-200',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

/** Status de pagamento derivado dos pagamentos reais do fornecedor */
function getPaymentStatus(expense: ExpenseFull): 'pago' | 'parcial' | 'pendente' | 'sem_fornecedor' {
  if (!expense.vendor) return 'sem_fornecedor';
  const paid = expense.vendor.payments.reduce((s, p) => s + p.amount, 0);
  if (paid <= 0) return 'pendente';
  if (paid >= expense.vendor.agreedValue) return 'pago';
  return 'parcial';
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function BudgetClient({ initialExpenses, vendors }: Props) {
  const [expenses]        = useState(initialExpenses);
  const [isPending, startTransition] = useTransition();

  // Filtros
  const [search,   setSearch]   = useState('');
  const [catFilter, setCatFilter] = useState('Todos');

  // Modal
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editing,    setEditing]    = useState<ExpenseFull | null>(null);

  // Form
  const [fDesc,     setFDesc]     = useState('');
  const [fCat,      setFCat]      = useState('Geral');
  const [fPlanned,  setFPlanned]  = useState('');
  const [fVendorId, setFVendorId] = useState('');
  const [fError,    setFError]    = useState('');

  // ─── Totais ────────────────────────────────────────────────────────────────

  const totalPlanned = expenses.reduce((s, e) => s + e.plannedValue, 0);
  const totalActual  = expenses.reduce((s, e) => s + e.actualValue, 0);

  // Total pago = soma de todos os pagamentos de todos os fornecedores vinculados
  const totalPaid = expenses.reduce((s, e) => {
    if (!e.vendor) return s;
    return s + e.vendor.payments.reduce((ps, p) => ps + p.amount, 0);
  }, 0);

  const totalRemaining = Math.max(0, totalActual - totalPaid);
  const isOverBudget   = totalActual > totalPlanned && totalPlanned > 0;
  const pctPaid        = totalActual > 0 ? Math.min(100, (totalPaid / totalActual) * 100) : 0;
  const pctActual      = totalPlanned > 0 ? Math.min(100, (totalActual / totalPlanned) * 100) : 0;

  // ─── Handlers Modal ────────────────────────────────────────────────────────

  const resetForm = () => {
    setFDesc(''); setFCat('Geral'); setFPlanned(''); setFVendorId(''); setFError('');
  };

  const openAdd = () => { resetForm(); setEditing(null); setModalOpen(true); };

  const openEdit = (e: ExpenseFull) => {
    setEditing(e);
    setFDesc(e.description);
    setFCat(e.category);
    setFPlanned(e.plannedValue > 0 ? e.plannedValue.toString() : '');
    setFVendorId(e.vendorId || '');
    setFError('');
    setModalOpen(true);
  };

  // Quando muda o fornecedor, auto-preenche o valor previsto se ainda vazio
  const handleVendorChange = (vendorId: string) => {
    setFVendorId(vendorId);
    if (vendorId) {
      const vendor = vendors.find(v => v.id === vendorId);
      if (vendor && !fPlanned) {
        setFPlanned(vendor.agreedValue.toString());
      }
    }
  };

  // Valor real exibido no modal (leitura — vem do fornecedor)
  const modalActualValue = fVendorId
    ? (vendors.find(v => v.id === fVendorId)?.agreedValue ?? 0)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFError('');
    if (!fDesc.trim()) { setFError('A descrição é obrigatória.'); return; }

    const payload = {
      description:  fDesc,
      category:     fCat,
      plannedValue: Number(fPlanned) || 0,
      vendorId:     fVendorId || undefined,
    };

    startTransition(async () => {
      const res = editing
        ? await updateExpense(editing.id, payload)
        : await createExpense(payload);

      if (res.success) { setModalOpen(false); window.location.reload(); }
      else setFError(res.error || 'Erro ao salvar.');
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remover esta despesa do orçamento?')) return;
    startTransition(async () => {
      await deleteExpense(id);
      window.location.reload();
    });
  };

  // ─── Filtros ───────────────────────────────────────────────────────────────

  const filtered = expenses.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = e.description.toLowerCase().includes(q) ||
                        (e.vendor?.name ?? '').toLowerCase().includes(q);
    const matchCat    = catFilter === 'Todos' || e.category === catFilter;
    return matchSearch && matchCat;
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-princess-text flex items-center gap-2">
            <Wallet className="text-princess-rose" /> Planejamento de Orçamento
          </h2>
          <p className="text-sm text-princess-text/60">Controle os gastos previstos e reais de cada serviço</p>
        </div>
        <button onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-princess-rose to-princess-pink-dark hover:opacity-90 text-white rounded-xl font-medium shadow-md transition text-sm">
          <Plus size={16} /> Adicionar Despesa
        </button>
      </div>

      {/* ── Alerta orçamento estourado ── */}
      {isOverBudget && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-red-700">Atenção: orçamento excedido!</p>
            <p className="text-xs text-red-600 mt-0.5">
              O gasto real ({fmt(totalActual)}) ultrapassou o previsto ({fmt(totalPlanned)}) em <strong>{fmt(totalActual - totalPlanned)}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── Cards de resumo ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orçamento Previsto */}
        <div className="bg-white p-5 rounded-2xl border border-princess-pink-light/40 princess-card-shadow space-y-2">
          <span className="text-[11px] font-bold text-princess-text/45 uppercase tracking-wider">Previsto</span>
          <p className="text-2xl font-serif-display font-bold text-princess-text">{fmt(totalPlanned)}</p>
          <p className="text-[11px] text-princess-text/45">Total estimado</p>
        </div>

        {/* Gasto Real */}
        <div className="bg-white p-5 rounded-2xl border border-princess-pink-light/40 princess-card-shadow space-y-2">
          <span className="text-[11px] font-bold text-princess-rose/70 uppercase tracking-wider">Gasto Real</span>
          <p className={`text-2xl font-serif-display font-bold ${isOverBudget ? 'text-red-500' : 'text-princess-rose'}`}>
            {fmt(totalActual)}
          </p>
          <p className="text-[11px] text-princess-text/45">
            {totalPlanned > 0 ? `${pctActual.toFixed(0)}% do previsto` : 'Com fornecedores'}
          </p>
        </div>

        {/* Total Pago */}
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 princess-card-shadow space-y-2">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Total Pago</span>
          <p className="text-2xl font-serif-display font-bold text-emerald-600">{fmt(totalPaid)}</p>
          <p className="text-[11px] text-emerald-500">
            {totalActual > 0 ? `${pctPaid.toFixed(0)}% quitado` : 'Pagamentos confirmados'}
          </p>
        </div>

        {/* Restante */}
        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 princess-card-shadow space-y-2">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Restante</span>
          <p className="text-2xl font-serif-display font-bold text-amber-600">{fmt(totalRemaining)}</p>
          <p className="text-[11px] text-amber-500">A pagar aos fornecedores</p>
        </div>
      </div>

      {/* ── Barra de progresso ── */}
      <div className="bg-white rounded-2xl p-5 border border-princess-pink-light/40 princess-card-shadow space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-princess-text/60">Progresso de Pagamentos</span>
          <span className="text-xs font-bold text-princess-rose">
            {fmt(totalPaid)} pago de {fmt(totalActual)}
          </span>
        </div>

        {/* Barra dupla: real sobre previsto */}
        <div className="relative w-full h-4 bg-princess-pink-light/30 rounded-full overflow-hidden border border-princess-pink/10">
          {/* camada de fundo: % gasto real / previsto */}
          {totalPlanned > 0 && (
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 opacity-30 ${isOverBudget ? 'bg-red-400' : 'bg-princess-rose'}`}
              style={{ width: `${pctActual}%` }}
            />
          )}
          {/* camada principal: % pago / real */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
            style={{ width: `${pctPaid}%` }}
          />
        </div>

        <div className="flex items-center gap-4 text-[11px] text-princess-text/50">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Pago</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-princess-rose/30 inline-block" /> Gasto real</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-princess-pink-light/60 inline-block border border-princess-pink/20" /> Previsto</span>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-2xl p-4 border border-princess-pink-light/40 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        {/* Busca */}
        <div className="relative w-full md:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-princess-rose/50" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar despesa ou fornecedor..."
            className="w-full pl-9 pr-4 py-2 bg-[#FAF9F6] border border-princess-rose/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
        </div>

        {/* Pills de categoria */}
        <div className="flex flex-wrap gap-1.5">
          {['Todos', ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                catFilter === cat
                  ? 'bg-princess-rose text-white border-princess-rose shadow-sm'
                  : 'bg-[#FAF9F6] text-princess-text/60 border-princess-rose/15 hover:border-princess-rose/40'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabela ── */}
      <div className="bg-white rounded-2xl border border-princess-pink-light/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-princess-pink-light/20 text-[11px] font-bold text-princess-text/60 uppercase tracking-wider border-b border-princess-pink-light/30">
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-right">Previsto</th>
                <th className="px-4 py-3 text-right">Real</th>
                <th className="px-4 py-3">Fornecedor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-princess-pink-light/10 text-sm">
              {filtered.length > 0 ? filtered.map(e => {
                const status = getPaymentStatus(e);
                const vendorPaid = e.vendor?.payments.reduce((s, p) => s + p.amount, 0) ?? 0;
                const diff = e.actualValue - e.plannedValue;

                return (
                  <tr key={e.id} className="hover:bg-[#FAF9F6]/60 transition group">
                    {/* Descrição */}
                    <td className="px-4 py-3.5 font-semibold text-princess-text max-w-[180px]">
                      <span className="truncate block">{e.description}</span>
                    </td>

                    {/* Categoria */}
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-semibold ${CAT_COLORS[e.category] ?? CAT_COLORS.Geral}`}>
                        {e.category}
                      </span>
                    </td>

                    {/* Previsto */}
                    <td className="px-4 py-3.5 text-right text-princess-text/60 tabular-nums">
                      {fmt(e.plannedValue)}
                    </td>

                    {/* Real */}
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      {e.actualValue > 0 ? (
                        <div>
                          <span className="font-bold text-princess-text">{fmt(e.actualValue)}</span>
                          {diff > 0 && e.plannedValue > 0 && (
                            <span className="text-[10px] text-red-500 flex items-center justify-end gap-0.5 mt-0.5">
                              <TrendingUp size={9} /> +{fmt(diff)}
                            </span>
                          )}
                          {diff < 0 && (
                            <span className="text-[10px] text-emerald-600 flex items-center justify-end gap-0.5 mt-0.5">
                              <TrendingDown size={9} /> {fmt(diff)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-princess-text/30 text-xs">—</span>
                      )}
                    </td>

                    {/* Fornecedor */}
                    <td className="px-4 py-3.5">
                      {e.vendor ? (
                        <div>
                          <span className="text-xs font-semibold text-princess-rose flex items-center gap-1">
                            <Building2 size={11} /> {e.vendor.name}
                          </span>
                          {vendorPaid > 0 && (
                            <span className="text-[10px] text-emerald-600 mt-0.5 block">
                              {fmt(vendorPaid)} pagos
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-princess-text/30 text-xs">Sem vínculo</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      {status === 'pago' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                          <CheckCircle size={11} /> Pago
                        </span>
                      )}
                      {status === 'parcial' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                          <Clock size={11} /> Parcial
                        </span>
                      )}
                      {status === 'pendente' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                          <Clock size={11} /> Pendente
                        </span>
                      )}
                      {status === 'sem_fornecedor' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg">
                          <CircleDashed size={11} /> Sem fornecedor
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition">
                        <button onClick={() => openEdit(e)}
                          className="p-1.5 text-princess-text/60 hover:text-princess-rose hover:bg-princess-pink-light/30 rounded-lg transition" title="Editar">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(e.id)}
                          className="p-1.5 text-princess-text/60 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Excluir">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <Wallet size={32} className="mx-auto text-princess-rose/25 mb-3" />
                    <p className="text-sm text-princess-text/45 font-medium">Nenhuma despesa encontrada.</p>
                    {catFilter !== 'Todos' && (
                      <button onClick={() => setCatFilter('Todos')} className="mt-2 text-xs text-princess-rose hover:underline">
                        Limpar filtro
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>

            {/* Rodapé com totais */}
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-princess-pink-light/15 border-t border-princess-pink-light/30 text-xs font-bold text-princess-text/70">
                  <td className="px-4 py-3" colSpan={2}>
                    {filtered.length} {filtered.length === 1 ? 'despesa' : 'despesas'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {fmt(filtered.reduce((s, e) => s + e.plannedValue, 0))}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-princess-rose">
                    {fmt(filtered.reduce((s, e) => s + e.actualValue, 0))}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL — Adicionar / Editar Despesa
      ══════════════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

          <div className="bg-white rounded-2xl w-full max-w-md p-6 princess-card-shadow border border-princess-pink-light/40 relative z-10">
            <button onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-princess-pink-light text-princess-rose hover:bg-princess-pink-light/30 transition">
              <X size={16} />
            </button>

            <h3 className="font-serif-display font-bold text-lg text-princess-text mb-5 flex items-center gap-1.5">
              <Sparkles size={16} className="text-princess-gold" />
              {editing ? 'Editar Despesa' : 'Nova Despesa'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1">Descrição *</label>
                <input value={fDesc} onChange={e => setFDesc(e.target.value)} required
                  placeholder="Ex: Bolo decorado Princesa Aurora"
                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1">Categoria</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button key={cat} type="button" onClick={() => setFCat(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                        fCat === cat
                          ? 'bg-princess-rose text-white border-princess-rose'
                          : 'bg-[#FAF9F6] text-princess-text/60 border-princess-rose/15 hover:border-princess-rose/40'
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fornecedor */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1">
                  Fornecedor <span className="text-princess-text/40 font-normal">opcional</span>
                </label>
                <select value={fVendorId} onChange={e => handleVendorChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30">
                  <option value="">Nenhum fornecedor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name} — {v.service}</option>
                  ))}
                </select>
              </div>

              {/* Valor Previsto */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1">
                  Valor Previsto (R$) *
                </label>
                <input type="number" step="0.01" min="0" value={fPlanned}
                  onChange={e => setFPlanned(e.target.value)} required
                  placeholder="0,00"
                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
              </div>

              {/* Valor Real (derivado do fornecedor) */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1 flex items-center gap-1">
                  Valor Real (R$)
                  <span className="text-princess-text/40 font-normal flex items-center gap-0.5">
                    <Info size={11} /> preenchido pelo fornecedor
                  </span>
                </label>
                <div className={`w-full px-3 py-2.5 rounded-xl text-sm border flex items-center justify-between ${
                  fVendorId
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}>
                  <span>{fVendorId ? fmt(modalActualValue) : 'Selecione um fornecedor'}</span>
                  {fVendorId && <CheckCircle size={14} className="text-emerald-500" />}
                </div>
              </div>

              {/* Aviso se não tiver fornecedor */}
              {!fVendorId && (
                <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-start gap-1.5">
                  <AlertCircle size={12} className="mt-0.5 shrink-0" />
                  O valor real é preenchido automaticamente ao vincular um fornecedor. Você pode adicionar a despesa sem fornecedor e editar depois.
                </p>
              )}

              {fError && (
                <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-1.5">
                  <AlertCircle size={13} /> {fError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-princess-text/60 hover:bg-gray-50 rounded-xl transition">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending}
                  className="px-5 py-2 text-sm bg-gradient-to-r from-princess-rose to-princess-pink-dark hover:opacity-90 text-white rounded-xl font-medium shadow-sm transition disabled:opacity-50 flex items-center gap-1.5">
                  {isPending ? 'Salvando...' : 'Salvar Despesa'} <Sparkles size={13} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
