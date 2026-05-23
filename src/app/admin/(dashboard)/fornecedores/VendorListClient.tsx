'use client';

import React, { useState, useTransition } from 'react';
import { Vendor, Expense, Payment } from '@prisma/client';
import {
  createVendor, updateVendor, deleteVendor,
  createPayment, deletePayment, createExpenseFromVendor,
} from './actions';
import {
  Building2, Plus, Search, Trash2, Edit2, X, Smartphone, Mail,
  Sparkles, CheckCircle, AlertCircle, Coins, CreditCard, Banknote,
  CalendarPlus, CalendarCheck, ChevronDown, ChevronUp, Receipt,
  Wallet, Clock, BadgeCheck,
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type VendorFull = Vendor & { expenses: Expense[]; payments: Payment[] };

interface Props { initialVendors: VendorFull[] }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('pt-BR');

const PAYMENT_METHODS = [
  { value: 'cartao_credito', label: 'Cartão de Crédito', icon: '💳' },
  { value: 'pix_unico',     label: 'Pix (único)',        icon: '⚡' },
  { value: 'pix_parcelado', label: 'Pix Parcelado',      icon: '📅' },
  { value: 'dinheiro',      label: 'Dinheiro',           icon: '💵' },
];

const PAYMENT_METHODS_CONFIRM = [
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'pix',            label: 'Pix' },
  { value: 'dinheiro',       label: 'Dinheiro' },
];

const statusConfig: Record<string, { label: string; cls: string }> = {
  a_cotar:   { label: 'A Cotar',    cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  contratado:{ label: 'Contratado', cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  pago:      { label: 'Pago',       cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function VendorListClient({ initialVendors }: Props) {
  const [vendors, setVendors] = useState(initialVendors);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');

  // ── Modal Fornecedor (Add/Edit) ──
  const [vendorModal, setVendorModal] = useState(false);
  const [editing, setEditing] = useState<VendorFull | null>(null);

  // Form fields
  const [fName,          setFName]          = useState('');
  const [fService,       setFService]       = useState('');
  const [fPhone,         setFPhone]         = useState('');
  const [fEmail,         setFEmail]         = useState('');
  const [fStatus,        setFStatus]        = useState('a_cotar');
  const [fAgreed,        setFAgreed]        = useState('0');
  const [fDeposit,       setFDeposit]       = useState('');
  const [fPayMethod,     setFPayMethod]     = useState('pix_unico');
  const [fPayDates,      setFPayDates]      = useState<string[]>([]); // for pix_parcelado
  const [fNewDate,       setFNewDate]       = useState('');
  const [fNotes,         setFNotes]         = useState('');
  const [fError,         setFError]         = useState('');

  // ── Modal Pagamento ──
  const [payModal, setPayModal]     = useState(false);
  const [payVendor, setPayVendor]   = useState<VendorFull | null>(null);
  const [pAmount,   setPAmount]     = useState('');
  const [pMethod,   setPMethod]     = useState('pix');
  const [pDate,     setPDate]       = useState('');
  const [pNotes,    setPNotes]      = useState('');
  const [pError,    setPError]      = useState('');

  // ── Expanded cards ──
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // ─────────────────── Handlers Vendor Modal ────────────────────────────────

  const resetVendorForm = () => {
    setFName(''); setFService(''); setFPhone(''); setFEmail('');
    setFStatus('a_cotar'); setFAgreed('0'); setFDeposit('');
    setFPayMethod('pix_unico'); setFPayDates([]); setFNewDate('');
    setFNotes(''); setFError('');
  };

  const openAdd = () => { resetVendorForm(); setEditing(null); setVendorModal(true); };

  const openEdit = (v: VendorFull) => {
    setEditing(v);
    setFName(v.name); setFService(v.service);
    setFPhone(v.phone || ''); setFEmail(v.email || '');
    setFStatus(v.status); setFAgreed(v.agreedValue.toString());
    setFDeposit(v.depositValue ? v.depositValue.toString() : '');
    setFPayMethod(v.paymentMethod || 'pix_unico');
    setFPayDates(v.paymentDates ? JSON.parse(v.paymentDates) : []);
    setFNotes(v.notes || ''); setFError('');
    setVendorModal(true);
  };

  const addPayDate = () => {
    if (fNewDate && !fPayDates.includes(fNewDate)) {
      setFPayDates(prev => [...prev, fNewDate].sort());
    }
    setFNewDate('');
  };

  const removePayDate = (d: string) =>
    setFPayDates(prev => prev.filter(x => x !== d));

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFError('');
    if (!fName.trim() || !fService.trim()) {
      setFError('Nome e serviço são obrigatórios.'); return;
    }
    if (fPayMethod === 'pix_parcelado' && fPayDates.length === 0) {
      setFError('Adicione pelo menos uma data de pagamento para Pix Parcelado.'); return;
    }

    const payload = {
      name: fName, service: fService, phone: fPhone, email: fEmail,
      status: fStatus, agreedValue: Number(fAgreed) || 0,
      depositValue: Number(fDeposit) || 0,
      paymentMethod: fPayMethod,
      paymentDates: fPayMethod === 'pix_parcelado' ? JSON.stringify(fPayDates) : undefined,
      notes: fNotes,
    };

    startTransition(async () => {
      const res = editing
        ? await updateVendor(editing.id, payload)
        : await createVendor(payload);

      if (res.success) { setVendorModal(false); window.location.reload(); }
      else setFError(res.error || 'Erro ao salvar.');
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remover este fornecedor?')) return;
    const orig = [...vendors];
    setVendors(prev => prev.filter(v => v.id !== id));
    startTransition(async () => {
      const res = await deleteVendor(id);
      if (!res.success) { setVendors(orig); alert(res.error); }
    });
  };

  // ─────────────────── Handlers Pagamento Modal ─────────────────────────────

  const openPayModal = (v: VendorFull) => {
    setPayVendor(v);
    const totalPaid = v.payments.reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, v.agreedValue - totalPaid);
    setPAmount(remaining.toFixed(2));
    setPMethod('pix'); setPDate(''); setPNotes(''); setPError('');
    setPayModal(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPError('');
    if (!pAmount || Number(pAmount) <= 0) { setPError('Informe um valor válido.'); return; }
    if (!pDate) { setPError('Selecione a data do pagamento.'); return; }

    startTransition(async () => {
      const res = await createPayment({
        vendorId: payVendor!.id,
        amount: Number(pAmount),
        paymentMethod: pMethod,
        paymentDate: pDate,
        notes: pNotes,
      });
      if (res.success) { setPayModal(false); window.location.reload(); }
      else setPError(res.error || 'Erro ao registrar.');
    });
  };

  const handleDeletePayment = (paymentId: string) => {
    if (!confirm('Remover este pagamento?')) return;
    startTransition(async () => {
      await deletePayment(paymentId);
      window.location.reload();
    });
  };

  // ─────────────────── Computed ─────────────────────────────────────────────

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.service.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (id: string) =>
    setExpanded(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  // ─────────────────── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-princess-text flex items-center gap-2">
            <Building2 className="text-princess-rose" /> Fornecedores & Serviços
          </h2>
          <p className="text-sm text-princess-text/60">Controle de contratos, pagamentos e contatos</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-princess-rose to-princess-pink-dark hover:opacity-90 text-white rounded-xl font-medium shadow-md transition text-sm"
        >
          <Plus size={16} /> Adicionar Fornecedor
        </button>
      </div>

      {/* ── Busca ── */}
      <div className="bg-white rounded-2xl p-4 border border-princess-pink-light/40">
        <div className="relative max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-princess-rose/50" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou serviço..."
            className="w-full pl-9 pr-4 py-2 bg-[#FAF9F6] border border-princess-rose/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30"
          />
        </div>
      </div>

      {/* ── Grid de Cards ── */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(vendor => {
            const totalPaid   = vendor.payments.reduce((s, p) => s + p.amount, 0);
            const remaining   = Math.max(0, vendor.agreedValue - totalPaid);
            const pct         = vendor.agreedValue > 0 ? Math.min(100, (totalPaid / vendor.agreedValue) * 100) : 0;
            const st          = statusConfig[vendor.status] ?? statusConfig.a_cotar;
            const payDates    = vendor.paymentDates ? JSON.parse(vendor.paymentDates) as string[] : [];
            const waPhone     = (vendor.phone || '').replace(/\D/g, '');
            const isExpanded  = expanded.has(vendor.id);
            const hasExpense  = vendor.expenses.length > 0;
            const methodLabel = PAYMENT_METHODS.find(m => m.value === vendor.paymentMethod);

            return (
              <div key={vendor.id} className="bg-white rounded-2xl border border-princess-pink-light/40 princess-card-shadow flex flex-col hover:-translate-y-0.5 transition duration-200 overflow-hidden">

                {/* ── Topo do card ── */}
                <div className="p-5 flex-1 space-y-4">
                  {/* Badges linha 1 */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 bg-princess-lavender text-princess-rose text-xs font-semibold rounded-lg border border-princess-lilac/30 truncate max-w-[140px]">
                      {vendor.service}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border whitespace-nowrap ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>

                  {/* Nome */}
                  <div>
                    <h3 className="font-serif-display font-bold text-lg text-princess-text leading-tight">{vendor.name}</h3>
                    {methodLabel && (
                      <span className="text-[11px] text-princess-text/50 flex items-center gap-1 mt-0.5">
                        <span>{methodLabel.icon}</span> {methodLabel.label}
                      </span>
                    )}
                  </div>

                  {/* Valores */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-princess-text/60">Total acordado</span>
                      <span className="font-bold text-princess-text">{fmt(vendor.agreedValue)}</span>
                    </div>
                    {vendor.depositValue > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-princess-text/50">Entrada</span>
                        <span className="font-semibold text-princess-text/70">{fmt(vendor.depositValue)}</span>
                      </div>
                    )}
                    {vendor.payments.length > 0 && (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-emerald-600 font-medium flex items-center gap-1"><BadgeCheck size={12} /> Pago</span>
                          <span className="font-bold text-emerald-600">{fmt(totalPaid)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-princess-text/50 flex items-center gap-1"><Clock size={12} /> Restante</span>
                          <span className={`font-bold ${remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{fmt(remaining)}</span>
                        </div>
                        {/* Barra de progresso */}
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-gradient-to-r from-princess-rose to-emerald-400 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Datas de pagamento (pix parcelado) */}
                  {vendor.paymentMethod === 'pix_parcelado' && payDates.length > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-1.5">
                      <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1 uppercase tracking-wide">
                        <CalendarCheck size={11} /> Parcelas Pix
                      </p>
                      {payDates.map((d: string) => (
                        <div key={d} className="flex items-center justify-between">
                          <span className="text-xs text-amber-800">{fmtDate(d)}</span>
                          {/* Marcar se já tem pagamento próximo desta data */}
                          {vendor.payments.some(p => {
                            const pd = new Date(p.paymentDate);
                            const dd = new Date(d);
                            return Math.abs(pd.getTime() - dd.getTime()) < 2 * 86400000;
                          }) ? (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle size={10} /> Pago</span>
                          ) : (
                            <span className="text-[10px] text-amber-600">Pendente</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Contatos */}
                  <div className="text-sm text-princess-text/70 space-y-1.5 border-t border-princess-pink-light/30 pt-3">
                    {vendor.phone ? (
                      <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 hover:text-princess-rose hover:underline">
                        <Smartphone size={13} className="text-princess-rose" /> {vendor.phone}
                      </a>
                    ) : (
                      <span className="flex items-center gap-2 text-princess-text/35">
                        <Smartphone size={13} /> Sem telefone
                      </span>
                    )}
                    {vendor.email ? (
                      <a href={`mailto:${vendor.email}`}
                        className="flex items-center gap-2 hover:text-princess-rose hover:underline truncate">
                        <Mail size={13} className="text-princess-rose" /> {vendor.email}
                      </a>
                    ) : (
                      <span className="flex items-center gap-2 text-princess-text/35">
                        <Mail size={13} /> Sem e-mail
                      </span>
                    )}
                  </div>

                  {/* Observações */}
                  {vendor.notes && (
                    <p className="text-xs text-princess-text/55 italic bg-[#FAF9F6] p-2.5 rounded-xl border border-princess-rose/5">
                      {vendor.notes}
                    </p>
                  )}

                  {/* Histórico de pagamentos (expansível) */}
                  {vendor.payments.length > 0 && (
                    <div>
                      <button
                        onClick={() => toggleExpand(vendor.id)}
                        className="flex items-center gap-1 text-xs text-princess-rose hover:underline font-medium"
                      >
                        <Receipt size={12} />
                        {isExpanded ? 'Ocultar' : 'Ver'} pagamentos ({vendor.payments.length})
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 space-y-1.5">
                          {vendor.payments.map(p => (
                            <div key={p.id} className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-xs">
                              <div>
                                <span className="font-bold text-emerald-700">{fmt(p.amount)}</span>
                                <span className="text-emerald-600 ml-1.5">· {fmtDate(p.paymentDate)}</span>
                                <span className="text-emerald-500 ml-1.5">· {p.paymentMethod}</span>
                                {p.notes && <span className="text-emerald-500 ml-1.5 italic">· {p.notes}</span>}
                              </div>
                              <button
                                onClick={() => handleDeletePayment(p.id)}
                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition ml-2"
                                title="Remover pagamento"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Footer ── */}
                <div className="px-5 py-3 border-t border-princess-pink-light/30 bg-[#FDFBFC] flex items-center justify-between gap-2">
                  {/* Confirmar Pagamento */}
                  {vendor.status !== 'pago' ? (
                    <button
                      onClick={() => openPayModal(vendor)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-90 px-3 py-1.5 rounded-lg shadow-sm transition"
                    >
                      <Wallet size={12} /> Confirmar Pagamento
                    </button>
                  ) : (
                    hasExpense ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                        <CheckCircle size={12} /> Quitado
                      </span>
                    ) : (
                      <button
                        onClick={() => createExpenseFromVendor(vendor.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-princess-rose bg-princess-pink-light hover:bg-princess-lilac/30 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        <Coins size={12} /> Gerar Despesa
                      </button>
                    )
                  )}

                  {/* Editar / Excluir */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(vendor)} className="p-1.5 text-princess-text/50 hover:text-princess-rose hover:bg-princess-pink-light/30 rounded-lg transition" title="Editar">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(vendor.id)} className="p-1.5 text-princess-text/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white py-14 rounded-2xl text-center border border-princess-pink-light/40">
          <Building2 size={36} className="mx-auto text-princess-rose/25 mb-3" />
          <p className="text-sm font-medium text-princess-text/50">Nenhum fornecedor cadastrado ainda.</p>
          <button onClick={openAdd} className="mt-4 inline-flex items-center gap-1.5 text-sm text-princess-rose hover:underline font-medium">
            <Plus size={14} /> Adicionar agora
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL — Adicionar / Editar Fornecedor
      ══════════════════════════════════════════════════════════════════════ */}
      {vendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setVendorModal(false)} />

          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 princess-card-shadow border border-princess-pink-light/40 relative z-10">
            <button onClick={() => setVendorModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-princess-pink-light text-princess-rose hover:bg-princess-pink-light/30 transition">
              <X size={16} />
            </button>

            <h3 className="font-serif-display font-bold text-lg text-princess-text mb-5 flex items-center gap-1.5">
              <Sparkles size={16} className="text-princess-gold" />
              {editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </h3>

            <form onSubmit={handleVendorSubmit} className="space-y-4">

              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1">Nome / Empresa *</label>
                <input value={fName} onChange={e => setFName(e.target.value)} required
                  placeholder="Ex: Estúdio Encantado Fotografia"
                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
              </div>

              {/* Serviço */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1">Serviço Prestado *</label>
                <input value={fService} onChange={e => setFService(e.target.value)} required
                  placeholder="Ex: Fotografia, Buffet, Bolo, Decoração..."
                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
              </div>

              {/* Contatos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-princess-text/75 mb-1">WhatsApp</label>
                  <input value={fPhone} onChange={e => setFPhone(e.target.value)} placeholder="11999998888"
                    className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-princess-text/75 mb-1">E-mail</label>
                  <input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="contato@empresa.com"
                    className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
                </div>
              </div>

              {/* Status + Valor acordado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-princess-text/75 mb-1">Status do Contrato</label>
                  <select value={fStatus} onChange={e => setFStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30">
                    <option value="a_cotar">A Cotar</option>
                    <option value="contratado">Contratado</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-princess-text/75 mb-1">Valor Acordado (R$) *</label>
                  <input type="number" step="0.01" min="0" value={fAgreed} onChange={e => setFAgreed(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
                </div>
              </div>

              {/* Valor de entrada */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1">
                  Valor de Entrada (R$) <span className="text-princess-text/40 font-normal">opcional</span>
                </label>
                <input type="number" step="0.01" min="0" value={fDeposit} onChange={e => setFDeposit(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
              </div>

              {/* Forma de pagamento */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-2">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.value} type="button"
                      onClick={() => setFPayMethod(m.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                        fPayMethod === m.value
                          ? 'bg-princess-rose text-white border-princess-rose shadow-sm'
                          : 'bg-[#FAF9F6] text-princess-text/70 border-princess-rose/15 hover:border-princess-rose/40'
                      }`}>
                      <span>{m.icon}</span> {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Datas do Pix Parcelado */}
              {fPayMethod === 'pix_parcelado' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5 uppercase tracking-wide">
                    <CalendarPlus size={13} /> Datas dos Pagamentos Pix
                  </p>

                  {/* Datas adicionadas */}
                  {fPayDates.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {fPayDates.map(d => (
                        <span key={d} className="inline-flex items-center gap-1 text-xs bg-white border border-amber-300 text-amber-800 rounded-lg px-2.5 py-1 font-medium">
                          {fmtDate(d)}
                          <button type="button" onClick={() => removePayDate(d)} className="ml-1 text-amber-500 hover:text-red-500">
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Input nova data */}
                  <div className="flex gap-2">
                    <input type="date" value={fNewDate} onChange={e => setFNewDate(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40" />
                    <button type="button" onClick={addPayDate}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition flex items-center gap-1">
                      <Plus size={14} /> Adicionar
                    </button>
                  </div>
                  {fPayDates.length === 0 && (
                    <p className="text-[11px] text-amber-600">Adicione pelo menos uma data de pagamento.</p>
                  )}
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1">Observações</label>
                <textarea value={fNotes} onChange={e => setFNotes(e.target.value)} rows={3}
                  placeholder="Ex: Incluso álbum impresso com 50 páginas..."
                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30 resize-none" />
              </div>

              {fError && (
                <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-1.5">
                  <AlertCircle size={13} /> {fError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setVendorModal(false)}
                  className="px-4 py-2 text-sm text-princess-text/60 hover:bg-gray-50 rounded-xl transition">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending}
                  className="px-5 py-2 text-sm bg-gradient-to-r from-princess-rose to-princess-pink-dark hover:opacity-90 text-white rounded-xl font-medium shadow-sm transition disabled:opacity-50 flex items-center gap-1.5">
                  {isPending ? 'Salvando...' : 'Salvar Fornecedor'} <Sparkles size={13} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL — Confirmar Pagamento
      ══════════════════════════════════════════════════════════════════════ */}
      {payModal && payVendor && (() => {
        const totalPaid  = payVendor.payments.reduce((s, p) => s + p.amount, 0);
        const remaining  = Math.max(0, payVendor.agreedValue - totalPaid);
        const afterPay   = Math.max(0, remaining - (Number(pAmount) || 0));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPayModal(false)} />

            <div className="bg-white rounded-2xl w-full max-w-md p-6 princess-card-shadow border border-princess-pink-light/40 relative z-10">
              <button onClick={() => setPayModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg border border-princess-pink-light text-princess-rose hover:bg-princess-pink-light/30 transition">
                <X size={16} />
              </button>

              <h3 className="font-serif-display font-bold text-lg text-princess-text mb-1 flex items-center gap-1.5">
                <Wallet size={17} className="text-emerald-500" /> Confirmar Pagamento
              </h3>
              <p className="text-sm text-princess-text/55 mb-5">{payVendor.name} · {payVendor.service}</p>

              {/* Resumo financeiro */}
              <div className="bg-princess-pink-light/20 rounded-xl p-4 mb-5 space-y-2 border border-princess-rose/10">
                <div className="flex justify-between text-sm">
                  <span className="text-princess-text/60">Valor acordado</span>
                  <span className="font-bold text-princess-text">{fmt(payVendor.agreedValue)}</span>
                </div>
                {totalPaid > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">Já pago</span>
                    <span className="font-bold text-emerald-600">{fmt(totalPaid)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-princess-rose/10 pt-2 mt-1">
                  <span className="text-princess-text/70 font-medium">Saldo restante</span>
                  <span className="font-bold text-amber-600">{fmt(remaining)}</span>
                </div>
              </div>

              <form onSubmit={handlePaySubmit} className="space-y-4">

                {/* Forma de pagamento */}
                <div>
                  <label className="block text-xs font-semibold text-princess-text/75 mb-2">Forma de Pagamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_METHODS_CONFIRM.map(m => (
                      <button key={m.value} type="button" onClick={() => setPMethod(m.value)}
                        className={`py-2 px-2 rounded-xl border text-xs font-medium transition ${
                          pMethod === m.value
                            ? 'bg-princess-rose text-white border-princess-rose'
                            : 'bg-[#FAF9F6] text-princess-text/70 border-princess-rose/15 hover:border-princess-rose/40'
                        }`}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Valor pago */}
                <div>
                  <label className="block text-xs font-semibold text-princess-text/75 mb-1">Valor Pago (R$) *</label>
                  <input type="number" step="0.01" min="0.01" value={pAmount}
                    onChange={e => setPAmount(e.target.value)} required
                    className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30 font-mono text-lg" />
                </div>

                {/* Valor restante automático */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold ${
                  afterPay <= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  <span className="flex items-center gap-1.5">
                    {afterPay <= 0 ? <CheckCircle size={14} /> : <Clock size={14} />}
                    {afterPay <= 0 ? 'Quitado após este pagamento' : 'Valor restante após pagamento'}
                  </span>
                  <span>{afterPay <= 0 ? '✨ R$ 0,00' : fmt(afterPay)}</span>
                </div>

                {/* Data do pagamento */}
                <div>
                  <label className="block text-xs font-semibold text-princess-text/75 mb-1">Data do Pagamento *</label>
                  <input type="date" value={pDate} onChange={e => setPDate(e.target.value)} required
                    className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
                </div>

                {/* Observação opcional */}
                <div>
                  <label className="block text-xs font-semibold text-princess-text/75 mb-1">
                    Observação <span className="text-princess-text/40 font-normal">opcional</span>
                  </label>
                  <input value={pNotes} onChange={e => setPNotes(e.target.value)}
                    placeholder="Ex: entrada, 1ª parcela..."
                    className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
                </div>

                {pError && (
                  <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-1.5">
                    <AlertCircle size={13} /> {pError}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-1">
                  <button type="button" onClick={() => setPayModal(false)}
                    className="px-4 py-2 text-sm text-princess-text/60 hover:bg-gray-50 rounded-xl transition">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isPending}
                    className="px-5 py-2 text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-90 text-white rounded-xl font-medium shadow-sm transition disabled:opacity-50 flex items-center gap-1.5">
                    {isPending ? 'Salvando...' : 'Confirmar Pagamento'} <BadgeCheck size={14} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
