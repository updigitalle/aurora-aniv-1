'use client';

import React, { useState, useTransition } from 'react';
import { Guest } from '@prisma/client';
import { createGuest, updateGuest, deleteGuest, FamilyMember } from './actions';
import {
  Users, Search, Plus, Download, Trash2, Edit2, X,
  CheckCircle2, XCircle, Clock, AlertCircle, Sparkles,
  Smartphone, Baby, User, UserCheck, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseMember = (raw: string | null): FamilyMember[] => {
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
};

const STATUS_CONFIG = {
  confirmado: { label: 'Confirmado', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  nao_vai:    { label: 'Não vai',    cls: 'text-red-600 bg-red-50 border-red-200',             icon: XCircle },
  pendente:   { label: 'Pendente',   cls: 'text-amber-700 bg-amber-50 border-amber-200',       icon: Clock },
};

const ORIGIN_CONFIG = {
  manual:      { label: 'Manual',      cls: 'text-purple-700 bg-purple-50 border-purple-200' },
  rsvp_online: { label: 'RSVP Online', cls: 'text-blue-700 bg-blue-50 border-blue-200' },
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function GuestListClient({ initialGuests }: { initialGuests: Guest[] }) {
  const [guests] = useState<Guest[]>(initialGuests);
  const [isPending, startTransition] = useTransition();

  // Filtros
  const [search,     setSearch]     = useState('');
  const [statusF,    setStatusF]    = useState('Todos');
  const [originF,    setOriginF]    = useState('Todos');

  // Expand rows (mostrar membros)
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<Guest | null>(null);

  // Form
  const [fName,     setFName]     = useState('');
  const [fPhone,    setFPhone]    = useState('');
  const [fStatus,   setFStatus]   = useState('pendente');
  const [fOrigin,   setFOrigin]   = useState('rsvp_online');
  const [fNotes,    setFNotes]    = useState('');
  const [fMembers,  setFMembers]  = useState<FamilyMember[]>([]);
  const [fNewName,  setFNewName]  = useState('');
  const [fNewType,  setFNewType]  = useState<'adulto' | 'crianca'>('adulto');
  // Contagens manuais (quando não há membros)
  const [fAdults,   setFAdults]   = useState(1);
  const [fChildren, setFChildren] = useState(0);
  const [fError,    setFError]    = useState('');

  // ─── Estatísticas ─────────────────────────────────────────────────────────

  const stats = {
    familias:           guests.length,
    confirmadosTotal:   guests.filter(g => g.status === 'confirmado').reduce((s, g) => s + g.adultsCount + g.childrenCount, 0),
    confirmadosAdultos: guests.filter(g => g.status === 'confirmado').reduce((s, g) => s + g.adultsCount, 0),
    confirmadosCriancas:guests.filter(g => g.status === 'confirmado').reduce((s, g) => s + g.childrenCount, 0),
    pendentes:          guests.filter(g => g.status === 'pendente').length,
    recusados:          guests.filter(g => g.status === 'nao_vai').length,
  };

  // ─── Filtros ──────────────────────────────────────────────────────────────

  const filtered = guests.filter(g => {
    const members = parseMember(g.familyMembers as string | null);
    const q = search.toLowerCase();
    const matchSearch =
      g.name.toLowerCase().includes(q) ||
      (g.phone || '').includes(q) ||
      members.some(m => m.name.toLowerCase().includes(q));
    const matchStatus = statusF === 'Todos' || g.status === statusF;
    const matchOrigin = originF === 'Todos' || g.origin === originF;
    return matchSearch && matchStatus && matchOrigin;
  });

  // ─── Modal helpers ────────────────────────────────────────────────────────

  const resetForm = () => {
    setFName(''); setFPhone(''); setFStatus('pendente'); setFOrigin('rsvp_online');
    setFNotes(''); setFMembers([]); setFNewName(''); setFNewType('adulto');
    setFAdults(1); setFChildren(0); setFError('');
  };

  const openAdd = () => { resetForm(); setEditing(null); setModalOpen(true); };

  const openEdit = (g: Guest) => {
    setEditing(g);
    setFName(g.name); setFPhone(g.phone || '');
    setFStatus(g.status); setFOrigin(g.origin);
    setFNotes(g.notes || '');
    setFMembers(parseMember(g.familyMembers as string | null));
    setFAdults(g.adultsCount || 1); setFChildren(g.childrenCount || 0);
    setFNewName(''); setFNewType('adulto'); setFError('');
    setModalOpen(true);
  };

  const addMember = () => {
    if (!fNewName.trim()) return;
    setFMembers(prev => [...prev, { name: fNewName.trim(), type: fNewType, confirmed: fStatus === 'confirmado' }]);
    setFNewName('');
  };

  const removeMember = (i: number) => setFMembers(prev => prev.filter((_, idx) => idx !== i));

  const toggleMemberConfirmed = (i: number) =>
    setFMembers(prev => prev.map((m, idx) => idx === i ? { ...m, confirmed: !m.confirmed } : m));

  const memberAdults   = fMembers.filter(m => m.type === 'adulto').length;
  const memberChildren = fMembers.filter(m => m.type === 'crianca').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFError('');
    if (!fName.trim()) { setFError('O nome é obrigatório.'); return; }

    const payload = {
      name: fName, phone: fPhone, status: fStatus, origin: fOrigin, notes: fNotes,
      familyMembers: fMembers.length > 0 ? fMembers : undefined,
      adultsCount:   fMembers.length > 0 ? undefined : fAdults,
      childrenCount: fMembers.length > 0 ? undefined : fChildren,
    };

    startTransition(async () => {
      const res = editing
        ? await updateGuest(editing.id, payload)
        : await createGuest(payload);

      if (res.success) { setModalOpen(false); window.location.reload(); }
      else setFError(res.error || 'Erro ao salvar.');
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remover este convidado da lista?')) return;
    startTransition(async () => {
      await deleteGuest(id);
      window.location.reload();
    });
  };

  // ─── Export CSV ───────────────────────────────────────────────────────────

  const exportCSV = () => {
    const headers = ['Nome/Família','Membros','Contato','Adultos','Crianças','Status','Origem','Observações','Respondeu em'];
    const rows = filtered.map(g => {
      const members = parseMember(g.familyMembers as string | null);
      return [
        g.name,
        members.map(m => m.name).join(' | '),
        g.phone || '',
        g.adultsCount,
        g.childrenCount,
        g.status === 'confirmado' ? 'Confirmado' : g.status === 'nao_vai' ? 'Não vai' : 'Pendente',
        g.origin === 'rsvp_online' ? 'RSVP Online' : 'Manual',
        g.notes || '',
        g.respondedAt ? new Date(g.respondedAt).toLocaleDateString('pt-BR') : '',
      ];
    });
    const csv = '﻿' + [headers, ...rows].map(r =>
      r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })),
      download: `convidados_aurora_${new Date().toISOString().split('T')[0]}.csv`,
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const toggleExpand = (id: string) =>
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-princess-text flex items-center gap-2">
            <Users className="text-princess-rose" /> Controle de Convidados
          </h2>
          <p className="text-sm text-princess-text/60">Famílias, membros e confirmações de presença</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-princess-rose/20 text-princess-rose hover:bg-princess-pink-light/30 rounded-xl font-medium shadow-sm transition text-sm">
            <Download size={15} /> Exportar CSV
          </button>
          <button onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-princess-rose to-princess-pink-dark hover:opacity-90 text-white rounded-xl font-medium shadow-md transition text-sm">
            <Plus size={15} /> Novo Convidado
          </button>
        </div>
      </div>

      {/* ── Cards resumo ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Famílias */}
        <div className="bg-white p-5 rounded-2xl border border-princess-pink-light/40 princess-card-shadow space-y-1">
          <span className="text-[11px] font-bold text-princess-text/45 uppercase tracking-wider">Famílias</span>
          <p className="text-3xl font-serif-display font-bold text-princess-text">{stats.familias}</p>
          <p className="text-[11px] text-princess-text/40">convidadas</p>
        </div>

        {/* Confirmados */}
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 princess-card-shadow space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <UserCheck size={11} /> Confirmados
          </span>
          <p className="text-3xl font-serif-display font-bold text-emerald-600">{stats.confirmadosTotal}</p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-500 mt-0.5">
            <span className="flex items-center gap-0.5"><User size={10} /> {stats.confirmadosAdultos} adultos</span>
            <span>·</span>
            <span className="flex items-center gap-0.5"><Baby size={10} /> {stats.confirmadosCriancas} crianças</span>
          </div>
        </div>

        {/* Aguardando */}
        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 princess-card-shadow space-y-1">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Clock size={11} /> Aguardando
          </span>
          <p className="text-3xl font-serif-display font-bold text-amber-600">{stats.pendentes}</p>
          <p className="text-[11px] text-amber-500">{stats.pendentes === 1 ? 'família' : 'famílias'} sem resposta</p>
        </div>

        {/* Recusados */}
        <div className="bg-red-50 p-5 rounded-2xl border border-red-100 princess-card-shadow space-y-1">
          <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
            <XCircle size={11} /> Recusados
          </span>
          <p className="text-3xl font-serif-display font-bold text-red-500">{stats.recusados}</p>
          <p className="text-[11px] text-red-400">{stats.recusados === 1 ? 'família não vai' : 'famílias não vão'}</p>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-2xl p-4 border border-princess-pink-light/40 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        {/* Busca */}
        <div className="relative w-full md:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-princess-rose/50" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por família ou membro..."
            className="w-full pl-9 pr-4 py-2 bg-[#FAF9F6] border border-princess-rose/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
        </div>

        {/* Filtros status + origem */}
        <div className="flex flex-wrap gap-2">
          {/* Status */}
          <div className="flex items-center gap-1 bg-[#FAF9F6] border border-princess-rose/10 rounded-xl px-3 py-1.5">
            <CheckCircle2 size={12} className="text-princess-rose" />
            <select value={statusF} onChange={e => setStatusF(e.target.value)}
              className="bg-transparent text-xs font-semibold text-princess-text/75 focus:outline-none cursor-pointer">
              <option value="Todos">Todos os Status</option>
              <option value="confirmado">Confirmados</option>
              <option value="pendente">Pendentes</option>
              <option value="nao_vai">Não vão</option>
            </select>
          </div>
          {/* Origem */}
          <div className="flex items-center gap-1 bg-[#FAF9F6] border border-princess-rose/10 rounded-xl px-3 py-1.5">
            <Smartphone size={12} className="text-princess-rose" />
            <select value={originF} onChange={e => setOriginF(e.target.value)}
              className="bg-transparent text-xs font-semibold text-princess-text/75 focus:outline-none cursor-pointer">
              <option value="Todos">Todas as Origens</option>
              <option value="manual">Manual</option>
              <option value="rsvp_online">RSVP Online</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Tabela ── */}
      <div className="bg-white rounded-2xl border border-princess-pink-light/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-princess-pink-light/20 text-[11px] font-bold text-princess-text/60 uppercase tracking-wider border-b border-princess-pink-light/30">
                <th className="px-4 py-3">Nome / Família</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3 text-center">Adultos</th>
                <th className="px-4 py-3 text-center">Crianças</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Observações</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-princess-pink-light/10">
              {filtered.length > 0 ? filtered.map(g => {
                const members    = parseMember(g.familyMembers as string | null);
                const isExpanded = expanded.has(g.id);
                const st         = STATUS_CONFIG[g.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pendente;
                const or         = ORIGIN_CONFIG[g.origin as keyof typeof ORIGIN_CONFIG] ?? ORIGIN_CONFIG.manual;
                const StIcon     = st.icon;
                const waPhone    = (g.phone || '').replace(/\D/g, '');

                return (
                  <React.Fragment key={g.id}>
                    <tr className="hover:bg-[#FAF9F6]/60 transition group">
                      {/* Nome */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-princess-text">{g.name}</div>
                        {members.length > 0 && (
                          <button onClick={() => toggleExpand(g.id)}
                            className="flex items-center gap-1 text-[11px] text-princess-rose hover:underline mt-0.5 font-medium">
                            <Users size={10} />
                            {members.length} {members.length === 1 ? 'membro' : 'membros'}
                            {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                          </button>
                        )}
                      </td>

                      {/* Contato */}
                      <td className="px-4 py-3.5">
                        {g.phone ? (
                          <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 text-princess-rose hover:underline text-xs font-medium">
                            <Smartphone size={13} /> {g.phone}
                          </a>
                        ) : (
                          <span className="text-princess-text/30 text-xs">—</span>
                        )}
                      </td>

                      {/* Adultos */}
                      <td className="px-4 py-3.5 text-center">
                        {g.status === 'confirmado' ? (
                          <span className="inline-flex items-center gap-0.5 text-sm font-bold text-princess-text">
                            <User size={12} className="text-princess-rose" /> {g.adultsCount}
                          </span>
                        ) : <span className="text-princess-text/25 text-xs">—</span>}
                      </td>

                      {/* Crianças */}
                      <td className="px-4 py-3.5 text-center">
                        {g.status === 'confirmado' ? (
                          <span className="inline-flex items-center gap-0.5 text-sm font-bold text-princess-text">
                            <Baby size={12} className="text-princess-rose" /> {g.childrenCount}
                          </span>
                        ) : <span className="text-princess-text/25 text-xs">—</span>}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${st.cls}`}>
                          <StIcon size={11} /> {st.label}
                        </span>
                      </td>

                      {/* Origem */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${or.cls}`}>
                          {or.label}
                        </span>
                      </td>

                      {/* Observações */}
                      <td className="px-4 py-3.5 max-w-[160px]">
                        <span className="text-xs text-princess-text/55 truncate block" title={g.notes || ''}>
                          {g.notes || <span className="text-princess-text/25">—</span>}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition">
                          <button onClick={() => openEdit(g)}
                            className="p-1.5 text-princess-text/60 hover:text-princess-rose hover:bg-princess-pink-light/30 rounded-lg transition" title="Editar">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(g.id)}
                            className="p-1.5 text-princess-text/60 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Excluir">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── Linha expandida com membros ── */}
                    {isExpanded && members.length > 0 && (
                      <tr className="bg-princess-pink-light/10">
                        <td colSpan={8} className="px-6 py-3">
                          <div className="flex flex-wrap gap-2">
                            {members.map((m, i) => (
                              <span key={i}
                                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${
                                  m.confirmed
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-white text-princess-text/60 border-princess-pink/30'
                                }`}>
                                {m.type === 'adulto' ? <User size={11} /> : <Baby size={11} />}
                                {m.name}
                                {m.confirmed && <CheckCircle2 size={11} className="text-emerald-500" />}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <Users size={32} className="mx-auto text-princess-rose/25 mb-3" />
                    <p className="text-sm text-princess-text/45 font-medium">
                      {search || statusF !== 'Todos' || originF !== 'Todos'
                        ? 'Nenhum convidado encontrado para este filtro.'
                        : 'Nenhum convidado cadastrado ainda.'}
                    </p>
                    {!search && statusF === 'Todos' && originF === 'Todos' && (
                      <button onClick={openAdd} className="mt-3 text-xs text-princess-rose hover:underline font-medium flex items-center gap-1 mx-auto">
                        <Plus size={12} /> Adicionar agora
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>

            {/* Rodapé totais */}
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-princess-pink-light/15 border-t border-princess-pink-light/30 text-xs font-bold text-princess-text/60">
                  <td className="px-4 py-3">{filtered.length} {filtered.length === 1 ? 'família' : 'famílias'}</td>
                  <td />
                  <td className="px-4 py-3 text-center">
                    {filtered.filter(g => g.status === 'confirmado').reduce((s, g) => s + g.adultsCount, 0)} adultos
                  </td>
                  <td className="px-4 py-3 text-center">
                    {filtered.filter(g => g.status === 'confirmado').reduce((s, g) => s + g.childrenCount, 0)} crianças
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL — Novo / Editar Convidado
      ══════════════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 princess-card-shadow border border-princess-pink-light/40 relative z-10">
            <button onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-princess-pink-light text-princess-rose hover:bg-princess-pink-light/30 transition">
              <X size={16} />
            </button>

            <h3 className="font-serif-display font-bold text-lg text-princess-text mb-5 flex items-center gap-1.5">
              <Sparkles size={16} className="text-princess-gold" />
              {editing ? 'Editar Convidado' : 'Novo Convidado / Família'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1">Nome / Família *</label>
                <input value={fName} onChange={e => setFName(e.target.value)} required
                  placeholder="Ex: Família Tamasse, Vovó Maria, Tio Roberto e Família"
                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
              </div>

              {/* Contato + Status + Origem */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-princess-text/75 mb-1">WhatsApp</label>
                  <input value={fPhone} onChange={e => setFPhone(e.target.value)} placeholder="11999998888"
                    className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-princess-text/75 mb-1">Status</label>
                  <select value={fStatus} onChange={e => setFStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30">
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="nao_vai">Não vai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1">Origem</label>
                <div className="flex gap-2">
                  {[
                    { val: 'manual',      label: 'Manual (confirmei eu)',    icon: '✍️' },
                    { val: 'rsvp_online', label: 'RSVP Online',             icon: '🌐' },
                  ].map(o => (
                    <button key={o.val} type="button" onClick={() => setFOrigin(o.val)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition ${
                        fOrigin === o.val
                          ? 'bg-princess-rose text-white border-princess-rose'
                          : 'bg-[#FAF9F6] text-princess-text/65 border-princess-rose/15 hover:border-princess-rose/40'
                      }`}>
                      {o.icon} {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Membros da família ── */}
              <div className="border border-princess-pink/25 rounded-2xl p-4 space-y-3 bg-princess-pink-light/10">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-princess-rose uppercase tracking-wide flex items-center gap-1.5">
                    <Users size={13} /> Membros da Família
                    <span className="text-princess-text/40 font-normal normal-case">(opcional)</span>
                  </p>
                  {fMembers.length > 0 && (
                    <span className="text-[11px] text-princess-text/50">
                      {memberAdults} adulto{memberAdults !== 1 ? 's' : ''} · {memberChildren} criança{memberChildren !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Lista de membros */}
                {fMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {fMembers.map((m, i) => (
                      <div key={i}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full border cursor-pointer select-none transition ${
                          m.confirmed
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-white text-princess-text/65 border-princess-pink/30'
                        }`}
                        onClick={() => toggleMemberConfirmed(i)}
                        title="Clique para marcar/desmarcar presença">
                        {m.type === 'adulto' ? <User size={11} /> : <Baby size={11} />}
                        {m.name}
                        {m.confirmed && <CheckCircle2 size={11} className="text-emerald-500" />}
                        <button type="button" onClick={e => { e.stopPropagation(); removeMember(i); }}
                          className="ml-0.5 text-princess-text/40 hover:text-red-500 rounded-full p-0.5">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Adicionar membro */}
                <div className="flex gap-2">
                  <input value={fNewName} onChange={e => setFNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMember())}
                    placeholder="Nome do membro..."
                    className="flex-1 px-3 py-2 bg-white border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
                  <select value={fNewType} onChange={e => setFNewType(e.target.value as 'adulto' | 'crianca')}
                    className="px-2 py-2 bg-white border border-princess-rose/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-princess-rose/30 font-medium text-princess-text/70">
                    <option value="adulto">Adulto</option>
                    <option value="crianca">Criança</option>
                  </select>
                  <button type="button" onClick={addMember}
                    className="px-3 py-2 bg-princess-rose hover:opacity-90 text-white rounded-xl text-xs font-bold transition flex items-center gap-1">
                    <Plus size={13} />
                  </button>
                </div>
                <p className="text-[11px] text-princess-text/45">
                  Clique em um membro para marcar/desmarcar presença. Os totais de adultos e crianças são calculados automaticamente.
                </p>
              </div>

              {/* Contagens manuais (só se não tiver membros) */}
              {fMembers.length === 0 && fStatus === 'confirmado' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-princess-text/75 mb-1 flex items-center gap-1">
                      <User size={11} className="text-princess-rose" /> Adultos confirmados
                    </label>
                    <input type="number" min={0} value={fAdults} onChange={e => setFAdults(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-princess-text/75 mb-1 flex items-center gap-1">
                      <Baby size={11} className="text-princess-rose" /> Crianças confirmadas
                    </label>
                    <input type="number" min={0} value={fChildren} onChange={e => setFChildren(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
                  </div>
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1">Observações / Restrições Alimentares</label>
                <textarea value={fNotes} onChange={e => setFNotes(e.target.value)} rows={2}
                  placeholder="Ex: Gabriel é alérgico a amendoim..."
                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30 resize-none" />
              </div>

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
                  {isPending ? 'Salvando...' : 'Salvar Convidado'} <Sparkles size={13} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
