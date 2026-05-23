'use client';

import React, { useState, useTransition } from 'react';
import { Expense, Vendor } from '@prisma/client';
import { createExpense, updateExpense, deleteExpense } from './actions';
import {
  Wallet,
  Plus,
  Trash2,
  Edit2,
  X,
  Search,
  Check,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Tag
} from 'lucide-react';

interface BudgetClientProps {
  initialExpenses: (Expense & { vendor?: Vendor | null })[];
  vendors: Vendor[];
}

const CATEGORIES = [
  'Espaço',
  'Comida',
  'Decoração',
  'Serviços',
  'Convites',
  'Vestuário',
  'Geral'
];

export default function BudgetClient({ initialExpenses, vendors }: BudgetClientProps) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isPending, startTransition] = useTransition();

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  // Modal Add/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Geral');
  const [formPlanned, setFormPlanned] = useState('0');
  const [formActual, setFormActual] = useState('0');
  const [formPaid, setFormPaid] = useState(false);
  const [formVendorId, setFormVendorId] = useState('');
  const [formError, setFormError] = useState('');

  // Totais
  const totalPlanned = expenses.reduce((sum, e) => sum + e.plannedValue, 0);
  const totalActual = expenses.reduce((sum, e) => sum + e.actualValue, 0);
  const totalPaid = expenses.filter(e => e.paid).reduce((sum, e) => sum + e.actualValue, 0);
  const totalPending = totalActual - totalPaid;

  const progressPercentage = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;
  const isOverBudget = totalActual > totalPlanned;

  // Abrir para Adicionar
  const openAddModal = () => {
    setEditingExpense(null);
    setFormDescription('');
    setFormCategory('Geral');
    setFormPlanned('0');
    setFormActual('0');
    setFormPaid(false);
    setFormVendorId('');
    setFormError('');
    setModalOpen(true);
  };

  // Abrir para Editar
  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setFormDescription(exp.description);
    setFormCategory(exp.category);
    setFormPlanned(exp.plannedValue.toString());
    setFormActual(exp.actualValue.toString());
    setFormPaid(exp.paid);
    setFormVendorId(exp.vendorId || '');
    setFormError('');
    setModalOpen(true);
  };

  // Excluir despesa
  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente remover esta despesa do orçamento?')) {
      const original = [...expenses];
      setExpenses(prev => prev.filter(e => e.id !== id));

      const res = await deleteExpense(id);
      if (!res.success) {
        setExpenses(original);
        alert(res.error);
      }
    }
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formDescription.trim()) {
      setFormError('A descrição da despesa é obrigatória.');
      return;
    }

    startTransition(async () => {
      let res;
      if (editingExpense) {
        res = await updateExpense(editingExpense.id, {
          description: formDescription,
          category: formCategory,
          plannedValue: Number(formPlanned) || 0,
          actualValue: Number(formActual) || 0,
          paid: formPaid,
          vendorId: formVendorId || undefined,
        });
      } else {
        res = await createExpense({
          description: formDescription,
          category: formCategory,
          plannedValue: Number(formPlanned) || 0,
          actualValue: Number(formActual) || 0,
          paid: formPaid,
          vendorId: formVendorId || undefined,
        });
      }

      if (res.success) {
        setModalOpen(false);
        window.location.reload();
      } else {
        setFormError(res.error || 'Erro ao salvar despesa.');
      }
    });
  };

  // Filtros aplicados
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (e.vendor?.name && e.vendor.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'Todos' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-princess-text flex items-center gap-2">
            <Wallet className="text-princess-rose" /> Planejamento de Orçamento
          </h2>
          <p className="text-sm text-princess-text/60">Controle os gastos previstos e reais das contratações</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-princess-rose to-princess-pink-dark hover:from-princess-pink-dark hover:to-princess-rose text-white rounded-xl font-medium shadow-md transition duration-200 text-sm align-self-start sm:align-self-auto"
        >
          <Plus size={16} />
          Adicionar Despesa
        </button>
      </div>

      {/* Alerta de estourou orçamento */}
      {isOverBudget && (
        <div className="bg-red-50 text-red-700 border border-red-100 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
          <AlertTriangle className="text-red-500 shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-sm">Alerta: Orçamento Excedido!</h4>
            <p className="text-xs">
              O total gasto real ({formatCurrency(totalActual)}) ultrapassou o orçamento previsto ({formatCurrency(totalPlanned)}) em{' '}
              <strong>{formatCurrency(totalActual - totalPlanned)}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-princess-pink-light/40 princess-card-shadow flex flex-col justify-between">
          <span className="text-xs font-semibold text-princess-text/50 uppercase tracking-wider block">Orçado Previsto</span>
          <span className="text-2xl font-serif-display font-bold text-princess-text mt-2 block">{formatCurrency(totalPlanned)}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-princess-pink-light/40 princess-card-shadow flex flex-col justify-between">
          <span className="text-xs font-semibold text-princess-text/50 uppercase tracking-wider block">Gasto Real (Fechado)</span>
          <span className="text-2xl font-serif-display font-bold text-princess-rose mt-2 block">{formatCurrency(totalActual)}</span>
        </div>
        <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100/50 princess-card-shadow flex flex-col justify-between">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">Total Pago</span>
          <span className="text-2xl font-serif-display font-bold text-emerald-600 mt-2 block">{formatCurrency(totalPaid)}</span>
        </div>
        <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-100/50 princess-card-shadow flex flex-col justify-between">
          <span className="text-xs font-semibold text-princess-gold-dark uppercase tracking-wider block">Restante a Pagar</span>
          <span className="text-2xl font-serif-display font-bold text-princess-gold-dark mt-2 block">{formatCurrency(totalPending)}</span>
        </div>
      </div>

      {/* Barra de Progresso do Orçamento */}
      <div className="bg-white rounded-2xl p-5 border border-princess-pink-light/40 princess-card-shadow space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-princess-text/60">Uso do Orçamento Previsto</span>
          <span className={`font-bold ${isOverBudget ? 'text-red-500' : 'text-princess-rose'}`}>
            {progressPercentage}% ({formatCurrency(totalActual)} de {formatCurrency(totalPlanned)})
          </span>
        </div>
        <div className="w-full bg-princess-pink-light/30 rounded-full h-3 overflow-hidden border border-princess-pink/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverBudget ? 'bg-red-400' : 'bg-gradient-to-r from-princess-rose to-princess-gold'
            }`}
            style={{ width: `${Math.min(100, progressPercentage)}%` }}
          ></div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-princess-pink-light/40 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-princess-rose/50">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar despesa ou fornecedor..."
            className="w-full pl-9 pr-4 py-2 bg-[#FAF9F6] border border-princess-rose/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#FAF9F6] border border-princess-rose/10 rounded-xl px-3 py-1.5 text-sm w-full md:w-auto">
          <Tag size={14} className="text-princess-rose" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-transparent focus:outline-none font-medium text-princess-text/80 cursor-pointer text-xs w-full"
          >
            <option value="Todos">Todas as Categorias</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Despesas */}
      <div className="bg-white rounded-2xl border border-princess-pink-light/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-princess-pink-light/20 text-xs font-bold text-princess-text/70 border-b border-princess-pink-light/30">
                <th className="p-4">Descrição</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Valor Previsto</th>
                <th className="p-4">Valor Real</th>
                <th className="p-4">Fornecedor</th>
                <th className="p-4">Status Pago</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-princess-pink-light/10 text-sm text-princess-text/90">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(e => {
                  const diff = e.actualValue - e.plannedValue;
                  return (
                    <tr key={e.id} className="hover:bg-[#FAF9F6]/50 transition">
                      <td className="p-4 font-semibold">{e.description}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-princess-lavender text-princess-rose/90 rounded border border-princess-lilac/30 text-xs">
                          {e.category}
                        </span>
                      </td>
                      <td className="p-4 text-princess-text/60">{formatCurrency(e.plannedValue)}</td>
                      <td className="p-4">
                        <span className="font-semibold">{formatCurrency(e.actualValue)}</span>
                        {diff > 0 && (
                          <span className="text-[10px] text-red-500 block mt-0.5 font-medium flex items-center gap-0.5">
                            <TrendingUp size={10} /> +{formatCurrency(diff)}
                          </span>
                        )}
                        {diff < 0 && (
                          <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium flex items-center gap-0.5">
                            <TrendingDown size={10} /> -{formatCurrency(Math.abs(diff))}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-princess-text/60">
                        {e.vendor ? (
                          <span className="text-princess-rose font-medium">{e.vendor.name}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-4">
                        {e.paid ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            <Check size={12} /> Pago
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-princess-gold-dark bg-amber-50 px-2 py-0.5 rounded border border-princess-gold-light">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(e)}
                            className="p-1.5 text-princess-text/60 hover:text-princess-rose hover:bg-princess-pink-light/30 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="p-1.5 text-princess-text/60 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-princess-text/50">
                    <DollarSign size={28} className="mx-auto text-princess-rose/30 mb-2" />
                    Nenhuma despesa registrada para o filtro atual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
          
          <div className="bg-white rounded-2xl w-full max-w-md p-6 princess-card-shadow border border-princess-pink-light/40 relative z-10 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-princess-pink-light text-princess-rose hover:bg-princess-pink-light/30 transition"
            >
              <X size={16} />
            </button>

            <h3 className="font-serif-display font-bold text-lg text-princess-text mb-4 flex items-center gap-1.5">
              <Sparkles size={16} className="text-princess-gold" />
              {editingExpense ? 'Editar Despesa' : 'Adicionar Despesa'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/80 mb-1">Descrição</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Ex: Bolo de aniversário Princesa Aurora"
                  required
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Categoria */}
                <div>
                  <label className="block text-xs font-semibold text-princess-text/80 mb-1">Categoria</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Fornecedor Vinculado */}
                <div>
                  <label className="block text-xs font-semibold text-princess-text/80 mb-1">Fornecedor Opcional</label>
                  <select
                    value={formVendorId}
                    onChange={e => setFormVendorId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                  >
                    <option value="">Nenhum</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Valor Previsto */}
                <div>
                  <label className="block text-xs font-semibold text-princess-text/80 mb-1">Valor Previsto (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPlanned}
                    onChange={e => setFormPlanned(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                  />
                </div>

                {/* Valor Real */}
                <div>
                  <label className="block text-xs font-semibold text-princess-text/80 mb-1">Valor Real (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formActual}
                    onChange={e => setFormActual(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                  />
                </div>
              </div>

              {/* Pago (Checkbox) */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="formPaid"
                  checked={formPaid}
                  onChange={e => setFormPaid(e.target.checked)}
                  className="rounded border-princess-rose/35 text-princess-rose focus:ring-princess-rose/30 h-4 w-4"
                />
                <label htmlFor="formPaid" className="text-sm font-semibold text-princess-text/80 cursor-pointer select-none">
                  Esta despesa já foi paga
                </label>
              </div>

              {formError && (
                <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-1.5">
                  <AlertCircle size={14} /> {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-princess-text/60 hover:bg-gray-50 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-sm bg-princess-rose hover:bg-princess-pink-dark text-white rounded-xl font-medium shadow-sm transition disabled:opacity-50"
                >
                  {isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
