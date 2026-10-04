'use client';

import React, { useState, useTransition } from 'react';
import { Guest } from '@prisma/client';
import { createGuest, updateGuest, deleteGuest } from './actions';
import {
  type FamilyMember, type MemberType, parseMembers, summarizeConfirmed, isValidChildAge,
  FREE_UNTIL_AGE, MAX_CHILD_AGE,
} from '@/lib/guests';
import {
  Users, Search, Plus, Download, Trash2, Edit2, X,
  CheckCircle2, XCircle, Clock, AlertCircle, Leaf,
  Smartphone, Baby, User, UserCheck, ChevronDown, ChevronUp, Link2, Check,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseMember = (raw: string | null): FamilyMember[] => parseMembers(raw);

// "Lia · 4 anos"; criança confirmada sem idade fica sinalizada para o buffet
const memberLabel = (m: FamilyMember) => {
  if (m.type !== 'crianca') return m.name;
  if (isValidChildAge(m.age)) return `${m.name} · ${m.age} ${m.age === 1 ? 'ano' : 'anos'}`;
  return m.confirmed ? `${m.name} · idade?` : m.name;
};

/** Resumo do buffet das famílias confirmadas (famílias antigas sem membros contam como adultos). */
const buffetOf = (guests: Guest[]) => {
  const all: FamilyMember[] = [];
  for (const g of guests) {
    if (g.status !== 'confirmado') continue;
    const members = parseMember(g.familyMembers as string | null);
    if (members.length > 0) all.push(...members);
    else for (let i = 0; i < g.adultsCount + g.childrenCount; i++) all.push({ name: g.name, type: 'adulto', confirmed: true });
  }
  return summarizeConfirmed(all);
};

const STATUS_CONFIG = {
  confirmado: { label: 'Confirmado', cls: 'text-forest-sage-dark bg-princess-pink-light border-princess-lilac', icon: CheckCircle2 },
  nao_vai:    { label: 'Não vai',    cls: 'text-forest-berry bg-[#f9ebe8] border-[#ebc6be]',             icon: XCircle },
  pendente:   { label: 'Pendente',   cls: 'text-princess-gold-dark bg-princess-gold-light border-princess-gold/25',       icon: Clock },
};

const ORIGIN_CONFIG = {
  manual:      { label: 'Manual',      cls: 'text-princess-gold-dark bg-princess-gold-light border-princess-gold/25' },
  rsvp_online: { label: 'RSVP Online', cls: 'text-forest-sage-dark bg-princess-pink-light border-princess-lilac' },
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function GuestListClient({ initialGuests, eventSlug }: { initialGuests: Guest[]; eventSlug: string | null }) {
  const [guests] = useState<Guest[]>(initialGuests);
  const [isPending, startTransition] = useTransition();

  // Link que os convidados recebem para se cadastrar e confirmar presença
  const [linkCopied, setLinkCopied] = useState(false);
  const copyRsvpLink = async () => {
    if (!eventSlug) return;
    const url = `${window.location.origin}/convite/${eventSlug}/rsvp`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copie o link de confirmação:', url);
      return;
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

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
  const [fNewType,  setFNewType]  = useState<MemberType>('adulto');
  const [fNewAge,   setFNewAge]   = useState('');
  const [fError,    setFError]    = useState('');

  // ─── Estatísticas ─────────────────────────────────────────────────────────

  const stats = {
    familias:           guests.length,
    confirmadosTotal:   guests.filter(g => g.status === 'confirmado').reduce((s, g) => s + g.adultsCount + g.childrenCount, 0),
    confirmadosAdultos: guests.filter(g => g.status === 'confirmado').reduce((s, g) => s + g.adultsCount, 0),
    confirmadosCriancas:guests.filter(g => g.status === 'confirmado').reduce((s, g) => s + g.childrenCount, 0),
    pendentes:          guests.filter(g => g.status === 'pendente').length,
    buffet:             buffetOf(guests),
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
    setFNotes(''); setFMembers([]); setFNewName(''); setFNewType('adulto'); setFNewAge('');
    setFError('');
  };

  const openAdd = () => { resetForm(); setEditing(null); setModalOpen(true); };

  const openEdit = (g: Guest) => {
    setEditing(g);
    setFName(g.name); setFPhone(g.phone || '');
    setFStatus(g.status); setFOrigin(g.origin);
    setFNotes(g.notes || '');
    setFMembers(parseMember(g.familyMembers as string | null));
    setFNewName(''); setFNewType('adulto'); setFNewAge(''); setFError('');
    setModalOpen(true);
  };

  // Membro digitado no campo (ainda não adicionado à lista), ou o erro que impede adicioná-lo
  const draftMember = (): { member?: FamilyMember; error?: string } => {
    if (!fNewName.trim()) return {};
    const member: FamilyMember = { name: fNewName.trim(), type: fNewType, confirmed: fStatus === 'confirmado' };
    if (fNewType === 'crianca' && fNewAge !== '') {
      const age = Number(fNewAge);
      if (!isValidChildAge(age)) return { error: `A idade deve ser um número de 0 a ${MAX_CHILD_AGE}.` };
      member.age = age;
    }
    return { member };
  };

  const addMember = () => {
    const { member, error } = draftMember();
    if (error) { setFError(error); return; }
    if (!member) return;
    setFMembers(prev => [...prev, member]);
    setFNewName(''); setFNewAge(''); setFError('');
  };

  const removeMember = (i: number) => setFMembers(prev => prev.filter((_, idx) => idx !== i));

  const toggleMemberConfirmed = (i: number) =>
    setFMembers(prev => prev.map((m, idx) => idx === i ? { ...m, confirmed: !m.confirmed } : m));

  const memberAdults   = fMembers.filter(m => m.type === 'adulto').length;
  const memberChildren = fMembers.filter(m => m.type === 'crianca').length;
  const memberBabies   = fMembers.filter(m => m.type === 'bebe').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFError('');
    // Inclui o membro que ficou digitado sem clicar em "+"
    const { member, error } = draftMember();
    if (error) { setFError(error); return; }
    const members = member ? [...fMembers, member] : fMembers;
    if (members.length === 0) { setFError('Adicione pelo menos um membro da família.'); return; }

    const payload = {
      name: fName, phone: fPhone, status: fStatus, origin: fOrigin, notes: fNotes,
      familyMembers: members,
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
    const headers = ['Nome/Família','Membros','Contato','Adultos','Crianças','Idades das crianças','No buffet','Status','Origem','Observações','Respondeu em'];
    const rows = filtered.map(g => {
      const members = parseMember(g.familyMembers as string | null);
      return [
        g.name,
        members.map(m => m.name).join(' | '),
        g.phone || '',
        g.adultsCount,
        g.childrenCount,
        members.filter(m => m.type === 'crianca').map(m => `${m.name}: ${isValidChildAge(m.age) ? m.age : '?'}`).join(' | '),
        g.status === 'confirmado' ? buffetOf([g]).buffet : '',
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
    setExpanded(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

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
        <div className="flex flex-wrap items-center gap-2">
          {eventSlug && (
            <button onClick={copyRsvpLink}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-princess-rose/20 text-princess-rose hover:bg-princess-pink-light/30 rounded-xl font-medium shadow-sm transition text-sm">
              {linkCopied ? <Check size={15} /> : <Link2 size={15} />}
              {linkCopied ? 'Link copiado!' : 'Copiar link de confirmação'}
            </button>
          )}
          <button onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-princess-rose/20 text-princess-rose hover:bg-princess-pink-light/30 rounded-xl font-medium shadow-sm transition text-sm">
            <Download size={15} /> Exportar CSV
          </button>
          <button onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-princess-rose hover:bg-princess-pink-dark text-white rounded-xl font-medium shadow-md transition text-sm">
            <Plus size={15} /> Novo Convidado
          </button>
        </div>
      </div>

      {/* ── Cards resumo ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Famílias */}
        <div className="bg-white p-5 rounded-2xl border border-princess-pink-light/40 princess-card-shadow space-y-1">
          <span className="text-xs font-bold text-princess-text/45 uppercase tracking-wider">Famílias</span>
          <p className="text-3xl font-serif-display font-bold text-princess-text">{stats.familias}</p>
          <p className="text-xs text-princess-text/40">convidadas</p>
        </div>

        {/* Confirmados */}
        <div className="bg-princess-pink-light p-5 rounded-2xl border border-princess-lilac princess-card-shadow space-y-1">
          <span className="text-xs font-bold text-forest-sage-dark uppercase tracking-wider flex items-center gap-1">
            <UserCheck size={11} /> Confirmados
          </span>
          <p className="text-3xl font-serif-display font-bold text-forest-sage-dark">{stats.confirmadosTotal}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-princess-rose mt-0.5">
            <span className="flex items-center gap-0.5 whitespace-nowrap"><User size={10} /> {stats.confirmadosAdultos} adultos</span>
            <span>·</span>
            <span className="flex items-center gap-0.5 whitespace-nowrap"><Baby size={10} /> {stats.confirmadosCriancas} crianças</span>
          </div>
          <p className="text-xs text-princess-text/70 pt-1.5 mt-1.5 border-t border-princess-lilac">
            <span className="font-bold text-forest-sage-dark">{stats.buffet.buffet}</span> no buffet ·{' '}
            <span className="font-bold">{stats.buffet.free}</span> não pagam
            {stats.buffet.ageMissing > 0 && (
              <span className="block text-princess-gold-dark mt-0.5">
                {stats.buffet.ageMissing} {stats.buffet.ageMissing === 1 ? 'criança sem idade' : 'crianças sem idade'} (contando no buffet)
              </span>
            )}
          </p>
        </div>

        {/* Aguardando */}
        <div className="bg-princess-gold-light p-5 rounded-2xl border border-princess-gold/25 princess-card-shadow space-y-1">
          <span className="text-xs font-bold text-princess-gold-dark uppercase tracking-wider flex items-center gap-1">
            <Clock size={11} /> Aguardando
          </span>
          <p className="text-3xl font-serif-display font-bold text-princess-gold">{stats.pendentes}</p>
          <p className="text-xs text-princess-gold">{stats.pendentes === 1 ? 'família' : 'famílias'} sem resposta</p>
        </div>

        {/* Recusados */}
        <div className="bg-[#f9ebe8] p-5 rounded-2xl border border-[#f1d5cf] princess-card-shadow space-y-1">
          <span className="text-xs font-bold text-forest-berry uppercase tracking-wider flex items-center gap-1">
            <XCircle size={11} /> Recusados
          </span>
          <p className="text-3xl font-serif-display font-bold text-forest-berry">{stats.recusados}</p>
          <p className="text-xs text-forest-berry">{stats.recusados === 1 ? 'família não vai' : 'famílias não vão'}</p>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-2xl p-4 border border-princess-pink-light/40 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        {/* Busca */}
        <div className="relative w-full md:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-princess-rose/50" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por família ou membro..."
            className="w-full pl-9 pr-4 py-3 md:py-2 bg-princess-lavender border border-princess-rose/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
        </div>

        {/* Filtros status + origem */}
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:flex md:flex-wrap gap-2 w-full md:w-auto">
          {/* Status */}
          <div className="flex items-center gap-1 bg-princess-lavender border border-princess-rose/10 rounded-xl px-3 min-h-11 md:min-h-0 md:py-1.5">
            <CheckCircle2 size={12} className="text-princess-rose" />
            <select value={statusF} onChange={e => setStatusF(e.target.value)}
              className="w-full min-w-0 min-h-11 md:min-h-0 bg-transparent text-sm md:text-xs font-semibold text-princess-text/75 focus:outline-none cursor-pointer">
              <option value="Todos">Todos os Status</option>
              <option value="confirmado">Confirmados</option>
              <option value="pendente">Pendentes</option>
              <option value="nao_vai">Não vão</option>
            </select>
          </div>
          {/* Origem */}
          <div className="flex items-center gap-1 bg-princess-lavender border border-princess-rose/10 rounded-xl px-3 min-h-11 md:min-h-0 md:py-1.5">
            <Smartphone size={12} className="text-princess-rose" />
            <select value={originF} onChange={e => setOriginF(e.target.value)}
              className="w-full min-w-0 min-h-11 md:min-h-0 bg-transparent text-sm md:text-xs font-semibold text-princess-text/75 focus:outline-none cursor-pointer">
              <option value="Todos">Todas as Origens</option>
              <option value="manual">Manual</option>
              <option value="rsvp_online">RSVP Online</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Lista em cartões (celular) ── */}
      <ul className="md:hidden space-y-3" aria-label="Convidados">
        {filtered.length > 0 ? filtered.map(g => {
          const members    = parseMember(g.familyMembers as string | null);
          const isExpanded = expanded.has(g.id);
          const st         = STATUS_CONFIG[g.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pendente;
          const or         = ORIGIN_CONFIG[g.origin as keyof typeof ORIGIN_CONFIG] ?? ORIGIN_CONFIG.manual;
          const StIcon     = st.icon;
          const waPhone    = (g.phone || '').replace(/\D/g, '');
          const adultos    = g.adultsCount;
          const criancas   = g.childrenCount;

          return (
            <li key={g.id} className="bg-white rounded-2xl border border-princess-pink-light/40 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-serif-display text-lg leading-snug text-princess-text break-words">{g.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg border ${st.cls}`}>
                      <StIcon size={12} /> {st.label}
                    </span>
                    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-lg border ${or.cls}`}>
                      {or.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center -mr-2 -mt-1 shrink-0">
                  <button onClick={() => openEdit(g)} aria-label={`Editar ${g.name}`}
                    className="w-11 h-11 grid place-items-center text-princess-text/60 hover:text-princess-rose hover:bg-princess-pink-light/30 rounded-xl transition">
                    <Edit2 size={17} />
                  </button>
                  <button onClick={() => handleDelete(g.id)} aria-label={`Excluir ${g.name}`}
                    className="w-11 h-11 grid place-items-center text-princess-text/60 hover:text-forest-berry hover:bg-[#f9ebe8] rounded-xl transition">
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-princess-text/75">
                {g.status === 'confirmado' && (
                  <>
                    <span className="inline-flex items-center gap-1"><User size={14} className="text-princess-rose" /> {adultos} {adultos === 1 ? 'adulto' : 'adultos'}</span>
                    <span className="inline-flex items-center gap-1"><Baby size={14} className="text-princess-rose" /> {criancas} {criancas === 1 ? 'criança' : 'crianças'}</span>
                  </>
                )}
                {g.phone && (
                  <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 min-h-11 text-princess-rose font-medium hover:underline">
                    <Smartphone size={15} /> {g.phone}
                  </a>
                )}
              </div>

              {g.notes && <p className="mt-2 text-sm text-princess-text/60 break-words">{g.notes}</p>}

              {members.length > 0 && (
                <div className="mt-2 border-t border-princess-pink-light/30 pt-1">
                  <button onClick={() => toggleExpand(g.id)} aria-expanded={isExpanded}
                    className="flex items-center gap-1.5 min-h-11 w-full text-sm text-princess-rose font-medium">
                    <Users size={15} />
                    {members.length} {members.length === 1 ? 'membro' : 'membros'}
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  {isExpanded && (
                    <div className="flex flex-wrap gap-2 pb-1">
                      {members.map((m, i) => (
                        <span key={i}
                          className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border ${
                            m.confirmed
                              ? 'bg-princess-pink-light text-forest-sage-dark border-princess-lilac'
                              : 'bg-white text-princess-text/60 border-princess-pink/30'
                          }`}>
                          {m.type === 'adulto' ? <User size={13} /> : <Baby size={13} />}
                          {memberLabel(m)}
                          {m.confirmed && <CheckCircle2 size={13} className="text-princess-rose" />}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        }) : (
          <li className="bg-white rounded-2xl border border-princess-pink-light/40 py-12 px-4 text-center">
            <Users size={32} className="mx-auto text-princess-rose/25 mb-3" />
            <p className="text-sm text-princess-text/55 font-medium">
              {search || statusF !== 'Todos' || originF !== 'Todos'
                ? 'Nenhum convidado encontrado para este filtro.'
                : 'Nenhum convidado cadastrado ainda.'}
            </p>
            {!search && statusF === 'Todos' && originF === 'Todos' && (
              <button onClick={openAdd} className="mt-2 min-h-11 px-3 text-sm text-princess-rose hover:underline font-medium inline-flex items-center gap-1">
                <Plus size={14} /> Adicionar agora
              </button>
            )}
          </li>
        )}
        {filtered.length > 0 && (
          <li className="px-1 text-sm font-semibold text-princess-text/60">
            {filtered.length} {filtered.length === 1 ? 'família' : 'famílias'}
            {' · '}{filtered.filter(g => g.status === 'confirmado').reduce((s, g) => s + g.adultsCount, 0)} adultos
            {' · '}{filtered.filter(g => g.status === 'confirmado').reduce((s, g) => s + g.childrenCount, 0)} crianças
          </li>
        )}
      </ul>

      {/* ── Tabela (tablet e desktop) ── */}
      <div className="hidden md:block bg-white rounded-2xl border border-princess-pink-light/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-princess-pink-light/20 text-xs font-bold text-princess-text/60 uppercase tracking-wider border-b border-princess-pink-light/30">
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
                    <tr className="hover:bg-princess-lavender/60 transition group">
                      {/* Nome */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-princess-text">{g.name}</div>
                        {members.length > 0 && (
                          <button onClick={() => toggleExpand(g.id)}
                            className="flex items-center gap-1 text-xs text-princess-rose hover:underline mt-0.5 font-medium">
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
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg border ${st.cls}`}>
                          <StIcon size={11} /> {st.label}
                        </span>
                      </td>

                      {/* Origem */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-lg border ${or.cls}`}>
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
                            className="p-1.5 text-princess-text/60 hover:text-forest-berry hover:bg-[#f9ebe8] rounded-lg transition" title="Excluir">
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
                                    ? 'bg-princess-pink-light text-forest-sage-dark border-princess-lilac'
                                    : 'bg-white text-princess-text/60 border-princess-pink/30'
                                }`}>
                                {m.type === 'adulto' ? <User size={11} /> : <Baby size={11} />}
                                {memberLabel(m)}
                                {m.confirmed && <CheckCircle2 size={11} className="text-princess-rose" />}
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
              className="absolute top-3 right-3 w-11 h-11 grid place-items-center rounded-xl border border-princess-pink-light text-princess-rose hover:bg-princess-pink-light/30 transition">
              <X size={16} />
            </button>

            <h3 className="font-serif-display font-bold text-lg text-princess-text mb-5 flex items-center gap-1.5">
              <Leaf size={16} className="text-princess-gold" />
              {editing ? 'Editar Convidado' : 'Novo Convidado / Família'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Nome */}
              <div>
                <label htmlFor="guest-name" className="block text-xs font-semibold text-princess-text/75 mb-1">
                  Nome da família <span className="text-princess-text/45 font-normal">(opcional)</span>
                </label>
                <input id="guest-name" value={fName} onChange={e => setFName(e.target.value)}
                  placeholder="Ex: Família Tamasse. Vazio: usamos os nomes dos membros"
                  className="w-full px-3 py-2.5 bg-princess-lavender border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
              </div>

              {/* Contato + Status + Origem */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-princess-text/75 mb-1">WhatsApp</label>
                  <input value={fPhone} onChange={e => setFPhone(e.target.value)} placeholder="11999998888"
                    className="w-full px-3 py-2.5 bg-princess-lavender border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-princess-text/75 mb-1">Status</label>
                  <select value={fStatus} onChange={e => setFStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-princess-lavender border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30">
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
                          : 'bg-princess-lavender text-princess-text/65 border-princess-rose/15 hover:border-princess-rose/40'
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
                    <Users size={13} /> Membros da família *
                  </p>
                  {fMembers.length > 0 && (
                    <span className="text-xs text-princess-text/50">
                      {memberAdults} adulto{memberAdults !== 1 ? 's' : ''} · {memberChildren} criança{memberChildren !== 1 ? 's' : ''}
                      {memberBabies > 0 && <> · {memberBabies} bebê{memberBabies !== 1 ? 's' : ''}</>}
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
                            ? 'bg-princess-pink-light text-forest-sage-dark border-princess-lilac'
                            : 'bg-white text-princess-text/65 border-princess-pink/30'
                        }`}
                        onClick={() => toggleMemberConfirmed(i)}
                        title="Clique para marcar/desmarcar presença">
                        {m.type === 'adulto' ? <User size={11} /> : <Baby size={11} />}
                        {memberLabel(m)}
                        {m.confirmed && <CheckCircle2 size={11} className="text-princess-rose" />}
                        <button type="button" onClick={e => { e.stopPropagation(); removeMember(i); }}
                          className="ml-0.5 text-princess-text/40 hover:text-forest-berry rounded-full p-0.5">
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
                  <select value={fNewType} onChange={e => setFNewType(e.target.value as MemberType)}
                    className="px-2 py-2 bg-white border border-princess-rose/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-princess-rose/30 font-medium text-princess-text/70">
                    <option value="adulto">Adulto</option>
                    <option value="crianca">Criança</option>
                    <option value="bebe">Bebê de colo</option>
                  </select>
                  {fNewType === 'crianca' && (
                    <input type="number" inputMode="numeric" min={0} max={MAX_CHILD_AGE} value={fNewAge}
                      onChange={e => setFNewAge(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMember())}
                      placeholder="Idade" aria-label="Idade da criança"
                      className="w-20 px-2 py-2 bg-white border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30" />
                  )}
                  <button type="button" onClick={addMember}
                    className="px-3 py-2 bg-princess-rose hover:opacity-90 text-white rounded-xl text-xs font-bold transition flex items-center gap-1">
                    <Plus size={13} />
                  </button>
                </div>
                <p className="text-xs text-princess-text/45">
                  Clique em um membro para marcar ou desmarcar presença. A idade da criança é opcional aqui; no RSVP o convidado precisa informar. Até {FREE_UNTIL_AGE} anos e bebês de colo não entram no buffet.
                </p>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1">Observações / Restrições Alimentares</label>
                <textarea value={fNotes} onChange={e => setFNotes(e.target.value)} rows={2}
                  placeholder="Ex: Gabriel é alérgico a amendoim..."
                  className="w-full px-3 py-2.5 bg-princess-lavender border border-princess-rose/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-princess-rose/30 resize-none" />
              </div>

              {fError && (
                <p className="text-xs text-forest-berry bg-[#f9ebe8] p-3 rounded-xl border border-[#f1d5cf] flex items-center gap-1.5">
                  <AlertCircle size={13} /> {fError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-princess-text/60 hover:bg-princess-lavender rounded-xl transition">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending}
                  className="px-5 py-2 text-sm bg-princess-rose hover:bg-princess-pink-dark text-white rounded-xl font-medium shadow-sm transition disabled:opacity-50 flex items-center gap-1.5">
                  {isPending ? 'Salvando...' : 'Salvar Convidado'} <Leaf size={13} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
