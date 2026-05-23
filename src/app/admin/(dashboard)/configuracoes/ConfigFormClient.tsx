'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Event } from '@prisma/client';
import { updateEventConfig } from './actions';
import {
  Settings,
  Sparkles,
  Copy,
  Check,
  Calendar,
  MapPin,
  FileText,
  Crown,
  AlertCircle,
  ExternalLink,
  Laptop,
  Gift,
  Link2,
  Baby,
} from 'lucide-react';

interface ConfigFormClientProps {
  event: Event;
}

export default function ConfigFormClient({ event }: ConfigFormClientProps) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState(event.name);
  const [babyName, setBabyName] = useState(event.babyName);
  const [slug, setSlug] = useState(event.slug);
  const [date, setDate] = useState('');
  const [locationName, setLocationName] = useState(event.locationName);
  const [locationAddress, setLocationAddress] = useState(event.locationAddress);
  const [locationMapUrl, setLocationMapUrl] = useState(event.locationMapUrl || '');
  const [description, setDescription] = useState(event.description || '');
  const [giftSuggestions, setGiftSuggestions] = useState((event as Event & { giftSuggestions?: string }).giftSuggestions || '');

  const [originUrl, setOriginUrl] = useState('http://localhost:3000');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin);
    }
    if (event.date) {
      const d = new Date(event.date);
      const offset = d.getTimezoneOffset();
      const localTime = new Date(d.getTime() - offset * 60 * 1000);
      setDate(localTime.toISOString().slice(0, 16));
    }
  }, [event.date]);

  const handleSlugChange = (val: string) => {
    const formatted = val
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    setSlug(formatted);
  };

  const handleCopyLink = () => {
    const link = `${originUrl}/convite/${slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError('');

    if (!name.trim() || !babyName.trim() || !slug.trim() || !date) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    startTransition(async () => {
      const res = await updateEventConfig(event.id, {
        name,
        babyName,
        slug,
        date: new Date(date).toISOString(),
        locationName,
        locationAddress,
        locationMapUrl,
        description,
        giftSuggestions,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res.error || 'Erro ao atualizar configurações.');
      }
    });
  };

  const inviteLink = `${originUrl}/convite/${slug}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* ── Coluna Esquerda: Formulário ── */}
      <div className="lg:col-span-7 space-y-6">

        {/* ── Card: Link de Compartilhamento ── */}
        <div className="bg-white rounded-2xl p-6 border border-princess-pink-light/40 princess-card-shadow space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-princess-pink-light/60 flex items-center justify-center">
              <Link2 size={16} className="text-princess-rose" />
            </div>
            <div>
              <h2 className="font-serif-display text-lg font-bold text-princess-text">Link de Compartilhamento</h2>
              <p className="text-xs text-princess-text/55">Envie este link no WhatsApp para os convidados confirmarem presença</p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 px-3 py-2.5 bg-princess-pink-light/25 border border-princess-rose/15 rounded-xl text-sm focus:outline-none select-all font-mono text-princess-text/70 truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2.5 bg-white border border-princess-rose/25 text-princess-rose hover:bg-princess-pink-light/60 rounded-xl shadow-sm transition"
              title="Copiar Link"
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            </button>
            <a
              href={`/convite/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-princess-rose text-white hover:opacity-90 rounded-xl shadow-sm transition flex items-center justify-center"
              title="Visualizar convite"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {/* ── Card: Configurações do Evento ── */}
        <div className="bg-white rounded-2xl p-6 border border-princess-pink-light/40 princess-card-shadow space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-princess-pink-light/60 flex items-center justify-center">
              <Settings size={16} className="text-princess-rose" />
            </div>
            <div>
              <h2 className="font-serif-display text-lg font-bold text-princess-text">Configurações do Evento</h2>
              <p className="text-xs text-princess-text/55">Informações exibidas na página pública do convite</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome do Bebê */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1.5 flex items-center gap-1">
                  <Baby size={12} className="text-princess-rose" /> Nome do Bebê *
                </label>
                <input
                  type="text"
                  value={babyName}
                  onChange={e => setBabyName(e.target.value)}
                  placeholder="Ex: Aurora"
                  required
                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1.5 flex items-center gap-1">
                  <Link2 size={12} className="text-princess-rose" /> Slug do Link *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  placeholder="Ex: aurora-1-ano"
                  required
                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm font-mono"
                />
              </div>
            </div>

            {/* Título do Evento */}
            <div>
              <label className="block text-xs font-semibold text-princess-text/75 mb-1.5 flex items-center gap-1">
                <Crown size={12} className="text-princess-rose" /> Título do Evento *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Aniversário de 1 Ano da Princesa Aurora"
                required
                className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data e Hora */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1.5 flex items-center gap-1">
                  <Calendar size={12} className="text-princess-rose" /> Data e Hora *
                </label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                />
              </div>

              {/* Nome do Local */}
              <div>
                <label className="block text-xs font-semibold text-princess-text/75 mb-1.5 flex items-center gap-1">
                  <MapPin size={12} className="text-princess-rose" /> Nome do Local *
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  placeholder="Ex: Castelinho Real Eventos"
                  required
                  className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
                />
              </div>
            </div>

            {/* Endereço */}
            <div>
              <label className="block text-xs font-semibold text-princess-text/75 mb-1.5 flex items-center gap-1">
                <MapPin size={12} className="text-princess-rose" /> Endereço Completo *
              </label>
              <input
                type="text"
                value={locationAddress}
                onChange={e => setLocationAddress(e.target.value)}
                placeholder="Ex: Alameda dos Bosques, 1500 - Jardim das Flores, São Paulo - SP"
                required
                className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
              />
            </div>

            {/* Google Maps */}
            <div>
              <label className="block text-xs font-semibold text-princess-text/75 mb-1.5 flex items-center gap-1">
                <ExternalLink size={12} className="text-princess-rose" /> Link do Google Maps
                <span className="text-princess-text/40 font-normal">(opcional)</span>
              </label>
              <input
                type="url"
                value={locationMapUrl}
                onChange={e => setLocationMapUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
              />
            </div>

            {/* Mensagem / Descrição */}
            <div>
              <label className="block text-xs font-semibold text-princess-text/75 mb-1.5 flex items-center gap-1">
                <FileText size={12} className="text-princess-rose" /> Mensagem do Convite
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Digite uma mensagem acolhedora para os convidados..."
                rows={3}
                className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm resize-none"
              />
            </div>

            {/* ── Sugestões de Presentes ── */}
            <div className="border-t border-princess-pink-light/60 pt-4">
              <label className="block text-xs font-semibold text-princess-text/75 mb-1.5 flex items-center gap-1">
                <Gift size={12} className="text-princess-rose" /> Sugestões de Presentes
                <span className="text-princess-text/40 font-normal">(opcional)</span>
              </label>
              <textarea
                value={giftSuggestions}
                onChange={e => setGiftSuggestions(e.target.value)}
                placeholder={`Ex:\n• Roupinhas tamanho 12-18 meses\n• Livros infantis ilustrados\n• Brinquedos de encaixe e montar\n• Pix para a festa: (11) 99999-8888`}
                rows={5}
                className="w-full px-3 py-2.5 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm resize-none leading-relaxed"
              />
              <p className="text-[11px] text-princess-text/45 mt-1">
                Essas sugestões aparecem na página do convite para orientar os convidados.
              </p>
            </div>

            {/* Feedback */}
            {error && (
              <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-1.5">
                <AlertCircle size={14} /> {error}
              </p>
            )}
            {success && (
              <p className="text-xs text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                <Check size={14} /> Configurações salvas e publicadas com sucesso!
              </p>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 bg-gradient-to-r from-princess-rose to-princess-pink-dark hover:opacity-90 text-white rounded-xl font-medium shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? 'Salvando...' : 'Salvar Alterações'}
                <Sparkles size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Coluna Direita: Preview do Convite ── */}
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
        <h3 className="font-serif-display font-bold text-lg text-princess-text flex items-center gap-1.5">
          <Laptop size={18} className="text-princess-rose" /> Prévia do Convite
        </h3>

        <div className="bg-gradient-to-b from-[#FFF2F5] via-[#FFF9FA] to-[#F0F0FF] rounded-3xl p-6 border border-princess-pink/40 princess-card-shadow relative overflow-hidden text-center aspect-[9/16] max-h-[680px] flex flex-col justify-between">
          {/* Decorações */}
          <div className="absolute top-4 left-6 text-princess-pink animate-sparkle-1 opacity-40">
            <Crown size={28} />
          </div>
          <div className="absolute top-10 right-6 text-princess-gold animate-sparkle-2 opacity-40">
            <Sparkles size={20} />
          </div>

          <div className="space-y-3 my-auto">
            {/* Nome em script */}
            <div className="space-y-1">
              <span className="font-script text-4xl text-princess-rose block">{babyName || 'Aurora'}</span>
              <span className="font-serif-display text-sm tracking-widest uppercase font-semibold text-princess-text/60">Faz 1 Aninho</span>
            </div>

            {/* Card título */}
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3 border border-white/80 shadow-sm space-y-1.5">
              <h4 className="font-serif-display font-bold text-sm text-princess-text leading-tight">
                {name || 'Aniversário da Aurora'}
              </h4>
              <p className="text-[11px] text-princess-text/75 leading-relaxed line-clamp-3">
                {description || 'Venha festejar conosco!'}
              </p>
            </div>

            {/* Data e Local */}
            <div className="space-y-1.5 text-xs">
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-2 border border-white/60 flex items-center justify-center gap-2">
                <Calendar size={13} className="text-princess-rose" />
                <span className="font-semibold text-princess-text/80">
                  {date ? new Date(date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Data da Festa'}
                </span>
              </div>
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-2 border border-white/60 flex items-center justify-center gap-2">
                <MapPin size={13} className="text-princess-rose" />
                <span className="font-semibold text-princess-text/80 truncate">
                  {locationName || 'Local da Festa'}
                </span>
              </div>
            </div>

            {/* Sugestões de Presentes (preview) */}
            {giftSuggestions && (
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-2.5 border border-white/60 text-left space-y-1">
                <p className="text-[10px] font-bold text-princess-rose flex items-center gap-1 uppercase tracking-wide">
                  <Gift size={10} /> Sugestões de Presentes
                </p>
                <p className="text-[10px] text-princess-text/70 leading-relaxed line-clamp-3 whitespace-pre-line">
                  {giftSuggestions}
                </p>
              </div>
            )}
          </div>

          {/* Botão RSVP */}
          <div className="space-y-2">
            <button
              type="button"
              className="w-full py-2.5 bg-gradient-to-r from-princess-rose to-princess-pink-dark text-white text-xs font-semibold rounded-xl shadow-md cursor-default pointer-events-none"
            >
              Confirmar Presença (RSVP) ✨
            </button>
            <span className="text-[10px] text-princess-text/40 block">Prévia ilustrativa</span>
          </div>
        </div>
      </div>
    </div>
  );
}
