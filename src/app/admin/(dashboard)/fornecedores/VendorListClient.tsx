'use client';

import React, { useState, useTransition } from 'react';
import { Vendor, Expense } from '@prisma/client';
import { createVendor, updateVendor, deleteVendor, createExpenseFromVendor } from './actions';
import {
  Building2,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Smartphone,
  Mail,
  Wallet,
  Sparkles,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Coins
} from 'lucide-react';

interface VendorListClientProps {
  initialVendors: (Vendor & { expenses: Expense[] })[];
}

export default function VendorListClient({ initialVendors }: VendorListClientProps) {
  const [vendors, setVendors] = useState(initialVendors);
  const [isPending, startTransition] = useTransition();

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Add/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formService, setFormService] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formStatus, setFormStatus] = useState('a_cotar');
  const [formAgreedValue, setFormAgreedValue] = useState('0');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Abrir para Adicionar
  const openAddModal = () => {
    setEditingVendor(null);
    setFormName('');
    setFormService('');
    setFormPhone('');
    setFormEmail('');
    setFormStatus('a_cotar');
    setFormAgreedValue('0');
    setFormNotes('');
    setFormError('');
    setModalOpen(true);
  };

  // Abrir para Editar
  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormName(vendor.name);
    setFormService(vendor.service);
    setFormPhone(vendor.phone || '');
    setFormEmail(vendor.email || '');
    setFormStatus(vendor.status);
    setFormAgreedValue(vendor.agreedValue.toString());
    setFormNotes(vendor.notes || '');
    setFormError('');
    setModalOpen(true);
  };

  // Deletar fornecedor
  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente remover este fornecedor? As despesas vinculadas a ele continuarão existindo sem vínculo.')) {
      const original = [...vendors];
      setVendors(prev => prev.filter(v => v.id !== id));

      const res = await deleteVendor(id);
      if (!res.success) {
        setVendors(original);
        alert(res.error);
      }
    }
  };

  // Gerar despesa no orçamento
  const handleGenerateExpense = async (vendorId: string) => {
    startTransition(async () => {
      const res = await createExpenseFromVendor(vendorId);
      if (res.success) {
        alert('Despesa criada com sucesso e vinculada ao orçamento!');
        window.location.reload();
      } else {
        alert(res.error);
      }
    });
  };

  // Submit do formulário (Add/Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || !formService.trim()) {
      setFormError('Nome e serviço são obrigatórios.');
      return;
    }

    startTransition(async () => {
      let res;
      if (editingVendor) {
        res = await updateVendor(editingVendor.id, {
          name: formName,
          service: formService,
          phone: formPhone,
          email: formEmail,
          status: formStatus,
          agreedValue: Number(formAgreedValue) || 0,
          notes: formNotes,
        });
      } else {
        res = await createVendor({
          name: formName,
          service: formService,
          phone: formPhone,
          email: formEmail,
          status: formStatus,
          agreedValue: Number(formAgreedValue) || 0,
          notes: formNotes,
        });
      }

      if (res.success) {
        setModalOpen(false);
        window.location.reload();
      } else {
        setFormError(res.error || 'Erro ao salvar fornecedor.');
      }
    });
  };

  // Filtragem
  const filteredVendors = vendors.filter(v => {
    return v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           v.service.toLowerCase().includes(searchQuery.toLowerCase());
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
            <Building2 className="text-princess-rose" /> Fornecedores & Serviços
          </h2>
          <p className="text-sm text-princess-text/60">Contatos, cotações e status de contratação</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-princess-rose to-princess-pink-dark hover:from-princess-pink-dark hover:to-princess-rose text-white rounded-xl font-medium shadow-md transition duration-200 text-sm align-self-start sm:align-self-auto"
        >
          <Plus size={16} />
          Adicionar Fornecedor
        </button>
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
            placeholder="Pesquisar por nome ou serviço..."
            className="w-full pl-9 pr-4 py-2 bg-[#FAF9F6] border border-princess-rose/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
          />
        </div>
      </div>

      {/* Grid de Fornecedores */}
      {filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map(vendor => {
            const hasExpense = vendor.expenses && vendor.expenses.length > 0;
            const waPhone = vendor.phone ? vendor.phone.replace(/\D/g, '') : '';
            
            return (
              <div
                key={vendor.id}
                className="bg-white rounded-2xl p-6 border border-princess-pink-light/40 princess-card-shadow flex flex-col justify-between hover:-translate-y-1 transition duration-200"
              >
                <div>
                  {/* Status & Service */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-0.5 bg-princess-lavender text-princess-rose text-xs font-semibold rounded-lg border border-princess-lilac/30">
                      {vendor.service}
                    </span>
                    
                    {vendor.status === 'pago' && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        Pago
                      </span>
                    )}
                    {vendor.status === 'contratado' && (
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        Contratado
                      </span>
                    )}
                    {vendor.status === 'a_cotar' && (
                      <span className="text-xs font-bold text-princess-gold-dark bg-amber-50 px-2 py-0.5 rounded border border-princess-gold-light">
                        A Cotar
                      </span>
                    )}
                  </div>

                  {/* Name & Value */}
                  <div className="space-y-1">
                    <h3 className="font-serif-display font-bold text-lg text-princess-text">{vendor.name}</h3>
                    <p className="text-md font-bold text-princess-rose mt-1">
                      {formatCurrency(vendor.agreedValue)}
                    </p>
                  </div>

                  {/* Contacts */}
                  <div className="mt-4 space-y-2 text-sm text-princess-text/70 border-t border-princess-pink-light/35 pt-4">
                    {vendor.phone ? (
                      <a
                        href={`https://wa.me/${waPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 hover:text-princess-rose hover:underline"
                      >
                        <Smartphone size={15} className="text-princess-rose" />
                        <span>{vendor.phone}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-princess-text/40">
                        <Smartphone size={15} />
                        <span>Sem telefone</span>
                      </div>
                    )}

                    {vendor.email ? (
                      <a
                        href={`mailto:${vendor.email}`}
                        className="flex items-center gap-2 hover:text-princess-rose hover:underline"
                      >
                        <Mail size={15} className="text-princess-rose" />
                        <span className="truncate">{vendor.email}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-princess-text/40">
                        <Mail size={15} />
                        <span>Sem e-mail</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {vendor.notes && (
                    <div className="mt-4 bg-[#FAF9F6] p-3 rounded-xl border border-princess-rose/5 text-xs text-princess-text/60 italic">
                      {vendor.notes}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="mt-6 pt-4 border-t border-princess-pink-light/35 flex items-center justify-between gap-3">
                  {/* Orçamento auto link */}
                  {hasExpense ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                      <CheckCircle size={12} /> No Orçamento
                    </span>
                  ) : (
                    <button
                      onClick={() => handleGenerateExpense(vendor.id)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-princess-rose bg-princess-pink-light hover:bg-princess-lilac/30 px-2.5 py-1.5 rounded-lg transition duration-150 disabled:opacity-50"
                      title="Gerar despesa automática no Orçamento com este valor"
                    >
                      <Coins size={12} />
                      Gerar Despesa
                    </button>
                  )}

                  {/* Edit / Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(vendor)}
                      className="p-1.5 text-princess-text/50 hover:text-princess-rose hover:bg-princess-pink-light/30 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(vendor.id)}
                      className="p-1.5 text-princess-text/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white py-12 rounded-2xl text-center text-princess-text/50 border border-princess-pink-light/40">
          <Building2 size={32} className="mx-auto text-princess-rose/30 mb-2" />
          <p className="text-sm font-medium">Nenhum fornecedor cadastrado ainda.</p>
        </div>
      )}

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
              {editingVendor ? 'Editar Fornecedor' : 'Adicionar Fornecedor'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/80 mb-1">Nome do Fornecedor / Empresa</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ex: Estúdio Encantado Fotografia"
                  required
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                />
              </div>

              {/* Serviço */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/80 mb-1">Serviço Prestado</label>
                <input
                  type="text"
                  value={formService}
                  onChange={e => setFormService(e.target.value)}
                  placeholder="Ex: Fotografia, Buffet, Bolo, Decoração..."
                  required
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Telefone */}
                <div>
                  <label className="block text-xs font-semibold text-princess-text/80 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="Ex: 11999998888"
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-xs font-semibold text-princess-text/80 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="Ex: contato@empresa.com"
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-princess-text/80 mb-1">Status Contrato</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                  >
                    <option value="a_cotar">A Cotar</option>
                    <option value="contratado">Contratado</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>

                {/* Valor Acordado */}
                <div>
                  <label className="block text-xs font-semibold text-princess-text/80 mb-1">Valor Acordado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formAgreedValue}
                    onChange={e => setFormAgreedValue(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/80 mb-1">Notas / Observações</label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Ex: Incluso álbum de fotos impresso com 50 páginas."
                  rows={3}
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm resize-none"
                />
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
