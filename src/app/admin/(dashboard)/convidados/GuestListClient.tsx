'use client';

import React, { useState, useTransition } from 'react';
import { Guest } from '@prisma/client';
import { createGuest, updateGuest, deleteGuest } from './actions';
import {
  Users,
  Search,
  Plus,
  Download,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface GuestListClientProps {
  initialGuests: Guest[];
}

export default function GuestListClient({ initialGuests }: GuestListClientProps) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [isPending, startTransition] = useTransition();

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [originFilter, setOriginFilter] = useState<string>('Todos');

  // Modal Add/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAdults, setFormAdults] = useState(1);
  const [formChildren, setFormChildren] = useState(0);
  const [formStatus, setFormStatus] = useState('pendente');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Abrir modal para Adicionar
  const openAddModal = () => {
    setEditingGuest(null);
    setFormName('');
    setFormPhone('');
    setFormAdults(1);
    setFormChildren(0);
    setFormStatus('pendente');
    setFormNotes('');
    setFormError('');
    setModalOpen(true);
  };

  // Abrir modal para Editar
  const openEditModal = (guest: Guest) => {
    setEditingGuest(guest);
    setFormName(guest.name);
    setFormPhone(guest.phone || '');
    setFormAdults(guest.status === 'confirmado' ? guest.adultsCount : 1);
    setFormChildren(guest.status === 'confirmado' ? guest.childrenCount : 0);
    setFormStatus(guest.status);
    setFormNotes(guest.notes || '');
    setFormError('');
    setModalOpen(true);
  };

  // Deletar convidado
  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente remover este convidado da lista?')) {
      const original = [...guests];
      setGuests(prev => prev.filter(g => g.id !== id));

      const res = await deleteGuest(id);
      if (!res.success) {
        setGuests(original);
        alert(res.error);
      }
    }
  };

  // Submit do formulário (Add/Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('O nome do convidado é obrigatório.');
      return;
    }

    startTransition(async () => {
      let res;
      if (editingGuest) {
        // Editar
        res = await updateGuest(editingGuest.id, {
          name: formName,
          phone: formPhone,
          adultsCount: formStatus === 'confirmado' ? formAdults : 0,
          childrenCount: formStatus === 'confirmado' ? formChildren : 0,
          status: formStatus,
          notes: formNotes,
        });
      } else {
        // Criar
        res = await createGuest({
          name: formName,
          phone: formPhone,
          adultsCount: formStatus === 'confirmado' ? formAdults : 0,
          childrenCount: formStatus === 'confirmado' ? formChildren : 0,
          status: formStatus,
          origin: 'manual',
          notes: formNotes,
        });
      }

      if (res.success) {
        setModalOpen(false);
        window.location.reload();
      } else {
        setFormError(res.error || 'Erro ao salvar convidado.');
      }
    });
  };

  // Exportar para CSV
  const exportToCSV = () => {
    const headers = [
      'Nome',
      'Telefone',
      'Status',
      'Origem',
      'Adultos Confirmados',
      'Crianças Confirmadas',
      'Total Confirmados',
      'Data de Resposta',
      'Observações'
    ];

    const rows = filteredGuests.map(g => [
      g.name,
      g.phone || '',
      g.status === 'confirmado' ? 'Confirmado' : g.status === 'nao_vai' ? 'Não vai' : 'Pendente',
      g.origin === 'rsvp_online' ? 'RSVP Online' : 'Manual',
      g.status === 'confirmado' ? g.adultsCount : 0,
      g.status === 'confirmado' ? g.childrenCount : 0,
      g.status === 'confirmado' ? (g.adultsCount + g.childrenCount) : 0,
      g.respondedAt ? new Date(g.respondedAt).toLocaleDateString('pt-BR') : '',
      g.notes || ''
    ]);

    // Usar o BOM UTF-8 (\uFEFF) para garantir acentos corretos no Excel
    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map(r => r.map(v => `"${v.toString().replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `convidados_aurora_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtragem
  const filteredGuests = guests.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (g.phone && g.phone.includes(searchQuery));
    const matchesStatus = statusFilter === 'Todos' || g.status === statusFilter;
    const matchesOrigin = originFilter === 'Todos' || g.origin === originFilter;
    return matchesSearch && matchesStatus && matchesOrigin;
  });

  // Estatísticas calculadas sobre a lista filtrada ou total
  const stats = {
    totalFamilias: guests.length,
    confirmadosTotal: guests.filter(g => g.status === 'confirmado').reduce((sum, g) => sum + g.adultsCount + g.childrenCount, 0),
    confirmadosAdultos: guests.filter(g => g.status === 'confirmado').reduce((sum, g) => sum + g.adultsCount, 0),
    confirmadosCriancas: guests.filter(g => g.status === 'confirmado').reduce((sum, g) => sum + g.childrenCount, 0),
    pendentesTotal: guests.filter(g => g.status === 'pendente').length,
    recusadosTotal: guests.filter(g => g.status === 'nao_vai').length,
  };

  return (
    <div className="space-y-6">
      {/* Header com botões */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-princess-text flex items-center gap-2">
            <Users className="text-princess-rose" /> Controle de Convidados
          </h2>
          <p className="text-sm text-princess-text/60">Monitore as confirmações de presença e exporte os dados</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-princess-rose/20 text-princess-rose hover:bg-princess-pink-light/35 rounded-xl font-medium shadow-sm transition duration-200 text-sm"
          >
            <Download size={16} />
            Exportar CSV
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-princess-rose to-princess-pink-dark hover:from-princess-pink-dark hover:to-princess-rose text-white rounded-xl font-medium shadow-md transition duration-200 text-sm"
          >
            <Plus size={16} />
            Novo Convidado
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-princess-pink-light/40 princess-card-shadow">
          <span className="text-xs font-semibold text-princess-text/50 uppercase tracking-wider block">Famílias Listadas</span>
          <span className="text-2xl font-serif-display font-bold text-princess-text mt-1 block">{stats.totalFamilias}</span>
        </div>
        <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/50 princess-card-shadow">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">Confirmados (Pessoas)</span>
          <span className="text-2xl font-serif-display font-bold text-emerald-600 mt-1 block">{stats.confirmadosTotal}</span>
          <span className="text-[10px] text-emerald-600/70 block mt-0.5">{stats.confirmadosAdultos} adultos • {stats.confirmadosCriancas} crianças</span>
        </div>
        <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100/50 princess-card-shadow">
          <span className="text-xs font-semibold text-princess-gold-dark uppercase tracking-wider block">Aguardando Resposta</span>
          <span className="text-2xl font-serif-display font-bold text-princess-gold-dark mt-1 block">{stats.pendentesTotal}</span>
        </div>
        <div className="bg-red-50/40 p-4 rounded-2xl border border-red-100/50 princess-card-shadow">
          <span className="text-xs font-semibold text-red-500 uppercase tracking-wider block">Recusados (Famílias)</span>
          <span className="text-2xl font-serif-display font-bold text-red-500 mt-1 block">{stats.recusadosTotal}</span>
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
            placeholder="Pesquisar convidado..."
            className="w-full pl-9 pr-4 py-2 bg-[#FAF9F6] border border-princess-rose/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filtro Status */}
          <div className="bg-[#FAF9F6] border border-princess-rose/10 rounded-xl px-3 py-1.5 text-sm">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none font-medium text-princess-text/80 cursor-pointer text-xs"
            >
              <option value="Todos">Todos os Status</option>
              <option value="confirmado">Confirmados</option>
              <option value="pendente">Pendentes</option>
              <option value="nao_vai">Não vão</option>
            </select>
          </div>

          {/* Filtro Origem */}
          <div className="bg-[#FAF9F6] border border-princess-rose/10 rounded-xl px-3 py-1.5 text-sm">
            <select
              value={originFilter}
              onChange={e => setOriginFilter(e.target.value)}
              className="bg-transparent focus:outline-none font-medium text-princess-text/80 cursor-pointer text-xs"
            >
              <option value="Todos">Todas as Origens</option>
              <option value="rsvp_online">RSVP Online</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Convidados (Tabela) */}
      <div className="bg-white rounded-2xl border border-princess-pink-light/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-princess-pink-light/20 text-xs font-bold text-princess-text/70 border-b border-princess-pink-light/30">
                <th className="p-4">Nome</th>
                <th className="p-4">Contato</th>
                <th className="p-4">Adultos / Crianças</th>
                <th className="p-4">Status</th>
                <th className="p-4">Origem</th>
                <th className="p-4">Observações</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-princess-pink-light/10 text-sm text-princess-text/90">
              {filteredGuests.length > 0 ? (
                filteredGuests.map(g => (
                  <tr key={g.id} className="hover:bg-[#FAF9F6]/50 transition">
                    <td className="p-4 font-semibold">{g.name}</td>
                    <td className="p-4 text-princess-text/60">
                      {g.phone ? (
                        <a
                          href={`https://wa.me/${g.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1 text-princess-rose"
                        >
                          <Smartphone size={14} />
                          {g.phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4 text-xs">
                      {g.status === 'confirmado' ? (
                        <span>
                          <strong>{g.adultsCount}</strong> adultos + <strong>{g.childrenCount}</strong> crianças
                        </span>
                      ) : (
                        <span className="text-princess-text/40">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {g.status === 'confirmado' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          <CheckCircle2 size={12} /> Confirmado
                        </span>
                      )}
                      {g.status === 'nao_vai' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                          <XCircle size={12} /> Não vai
                        </span>
                      )}
                      {g.status === 'pendente' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-princess-gold-dark bg-amber-50 px-2 py-0.5 rounded border border-princess-gold-light">
                          <HelpCircle size={12} /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs font-semibold text-princess-text/60">
                      {g.origin === 'rsvp_online' ? 'RSVP Online' : 'Manual'}
                    </td>
                    <td className="p-4 max-w-xs truncate text-xs text-princess-text/60" title={g.notes || ''}>
                      {g.notes || '-'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(g)}
                          className="p-1.5 text-princess-text/60 hover:text-princess-rose hover:bg-princess-pink-light/30 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="p-1.5 text-princess-text/60 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-princess-text/50">
                    <AlertCircle size={28} className="mx-auto text-princess-rose/30 mb-2" />
                    Nenhum convidado encontrado na busca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
          
          {/* Modal Card */}
          <div className="bg-white rounded-2xl w-full max-w-md p-6 princess-card-shadow border border-princess-pink-light/40 relative z-10 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-princess-pink-light text-princess-rose hover:bg-princess-pink-light/30 transition"
            >
              <X size={16} />
            </button>

            <h3 className="font-serif-display font-bold text-lg text-princess-text mb-4 flex items-center gap-1.5">
              <Sparkles size={16} className="text-princess-gold" />
              {editingGuest ? 'Editar Convidado' : 'Adicionar Convidado'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/80 mb-1">Nome Completo / Família</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ex: Tio Roberto e Família"
                  required
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/80 mb-1">WhatsApp / Contato</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  placeholder="Ex: 11999998888"
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/80 mb-1">Status de Presença</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                >
                  <option value="pendente">Pendente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="nao_vai">Não vai</option>
                </select>
              </div>

              {/* Contagem Adultos / Crianças - Mostrar apenas se Confirmado */}
              {formStatus === 'confirmado' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-semibold text-princess-text/80 mb-1">Adultos</label>
                    <input
                      type="number"
                      min={1}
                      value={formAdults}
                      onChange={e => setFormAdults(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-princess-text/80 mb-1">Crianças (1-12 anos)</label>
                    <input
                      type="number"
                      min={0}
                      value={formChildren}
                      onChange={e => setFormChildren(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/80 mb-1">Observações / Restrições Alimentares</label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Ex: Alérgico a camarão ou Glúten"
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
