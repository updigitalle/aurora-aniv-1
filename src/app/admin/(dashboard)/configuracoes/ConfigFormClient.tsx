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
  Laptop
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

  // Base URL para geração de links
  const [originUrl, setOriginUrl] = useState('http://localhost:3000');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin);
    }
    // Formatar data do SQLite para datetime-local input
    if (event.date) {
      const d = new Date(event.date);
      // Ajustar fuso horário local para o formato do input
      const offset = d.getTimezoneOffset();
      const localTime = new Date(d.getTime() - offset * 60 * 1000);
      setDate(localTime.toISOString().slice(0, 16));
    }
  }, [event.date]);

  // Transformar slug ao digitar (letras minúsculas e hífens)
  const handleSlugChange = (val: string) => {
    const formatted = val
      .toLowerCase()
      .replace(/\s+/g, '-') // substitui espaços por hífens
      .replace(/[^a-z0-9-]/g, ''); // remove caracteres especiais inválidos
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
      {/* Coluna Esquerda: Formulário de Configuração */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-princess-pink-light/40 princess-card-shadow lg:col-span-7 space-y-6">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-princess-text flex items-center gap-2">
            <Settings className="text-princess-rose" /> Configurações do Evento
          </h2>
          <p className="text-sm text-princess-text/60">Configure as informações do convite público da festa</p>
        </div>

        {/* Link do Convite */}
        <div className="p-4 bg-princess-pink-light/35 rounded-2xl border border-princess-pink/20 space-y-2">
          <label className="block text-xs font-bold text-princess-rose uppercase tracking-wider">Link de Compartilhamento</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 px-3 py-2 bg-white/70 border border-princess-rose/10 rounded-xl text-sm focus:outline-none select-all font-mono text-princess-text/80 truncate"
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
              className="p-2.5 bg-princess-rose text-white hover:bg-princess-pink-dark rounded-xl shadow-sm transition flex items-center justify-center"
              title="Visualizar"
            >
              <ExternalLink size={16} />
            </a>
          </div>
          <p className="text-[11px] text-princess-text/50">Envie este link para os convidados no WhatsApp para que façam RSVP.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome da Bebê */}
            <div>
              <label className="block text-xs font-semibold text-princess-text/80 mb-1">Nome do Bebê *</label>
              <input
                type="text"
                value={babyName}
                onChange={e => setBabyName(e.target.value)}
                placeholder="Ex: Aurora"
                required
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-semibold text-princess-text/80 mb-1">Link do Convite (Slug) *</label>
              <input
                type="text"
                value={slug}
                onChange={e => handleSlugChange(e.target.value)}
                placeholder="Ex: aurora-1-ano"
                required
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm font-mono"
              />
            </div>
          </div>

          {/* Nome do Evento */}
          <div>
            <label className="block text-xs font-semibold text-princess-text/80 mb-1">Título do Evento *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Aniversário de 1 Ano da Princesa Aurora"
              required
              className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data e Hora */}
            <div>
              <label className="block text-xs font-semibold text-princess-text/80 mb-1">Data e Hora *</label>
              <input
                type="datetime-local"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
              />
            </div>

            {/* Nome do Local */}
            <div>
              <label className="block text-xs font-semibold text-princess-text/80 mb-1">Nome do Local *</label>
              <input
                type="text"
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                placeholder="Ex: Castelinho Real Eventos"
                required
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
              />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-xs font-semibold text-princess-text/80 mb-1">Endereço Completo *</label>
            <input
              type="text"
              value={locationAddress}
              onChange={e => setLocationAddress(e.target.value)}
              placeholder="Ex: Alameda dos Bosques, 1500 - Jardim das Flores"
              required
              className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
            />
          </div>

          {/* URL do Mapa */}
          <div>
            <label className="block text-xs font-semibold text-princess-text/80 mb-1">Link do Google Maps (Opcional)</label>
            <input
              type="url"
              value={locationMapUrl}
              onChange={e => setLocationMapUrl(e.target.value)}
              placeholder="Ex: https://maps.google.com/..."
              className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm"
            />
          </div>

          {/* Descrição / Texto do Convite */}
          <div>
            <label className="block text-xs font-semibold text-princess-text/80 mb-1">Texto do Convite / Mensagem</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Digite uma mensagem acolhedora para os convidados..."
              rows={4}
              className="w-full px-3 py-2 bg-[#FAF9F6] border border-princess-rose/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-princess-rose/30 text-sm resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-1.5">
              <AlertCircle size={14} /> {error}
            </p>
          )}

          {success && (
            <p className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100 flex items-center gap-1.5">
              <Check size={14} /> Configurações salvas e publicadas com sucesso!
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-gradient-to-r from-princess-rose to-princess-pink-dark hover:from-princess-pink-dark hover:to-princess-rose text-white rounded-xl font-medium shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? 'Salvando...' : 'Salvar Alterações'}
              <Sparkles size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Coluna Direita: Preview Live do Convite */}
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
        <h3 className="font-serif-display font-bold text-lg text-princess-text flex items-center gap-1.5">
          <Laptop size={18} className="text-princess-rose" /> Prévia do Convite Público
        </h3>

        {/* Replica Mini do Convite */}
        <div className="bg-gradient-to-b from-[#FFF2F5] via-[#FFF9FA] to-[#F0F0FF] rounded-3xl p-6 border border-princess-pink/40 princess-card-shadow relative overflow-hidden text-center aspect-[9/16] max-h-[640px] flex flex-col justify-between">
          {/* Subtle sparkles */}
          <div className="absolute top-4 left-6 text-princess-pink animate-sparkle-1 opacity-40">
            <Crown size={28} />
          </div>
          <div className="absolute top-10 right-6 text-princess-gold animate-sparkle-2 opacity-40">
            <Sparkles size={20} />
          </div>

          <div className="space-y-4 my-auto">
            {/* Header Cursivo */}
            <div className="space-y-1">
              <span className="font-script text-4xl text-princess-rose block">Aurora</span>
              <span className="font-serif-display text-sm tracking-widest uppercase font-semibold text-princess-text/60">Faz 1 Aninho</span>
            </div>

            {/* Card Título */}
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/80 shadow-sm space-y-2">
              <h4 className="font-serif-display font-bold text-md text-princess-text leading-tight">{name || 'Aniversário da Aurora'}</h4>
              <p className="text-xs text-princess-text/80 leading-relaxed max-h-[80px] overflow-hidden overflow-ellipsis">
                {description || 'Venha festejar conosco!'}
              </p>
            </div>

            {/* Data e Local */}
            <div className="space-y-2 text-xs">
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-2.5 border border-white/60 flex items-center justify-center gap-2">
                <Calendar size={14} className="text-princess-rose" />
                <span className="font-semibold text-princess-text/80">
                  {date ? new Date(date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Data da Festa'}
                </span>
              </div>
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-2.5 border border-white/60 flex items-center justify-center gap-2">
                <MapPin size={14} className="text-princess-rose" />
                <span className="font-semibold text-princess-text/80 truncate">
                  {locationName || 'Local da Festa'}
                </span>
              </div>
            </div>
          </div>

          {/* Botão RSVP Falso */}
          <div className="space-y-2">
            <button
              type="button"
              className="w-full py-2.5 bg-gradient-to-r from-princess-rose to-princess-pink-dark text-white text-xs font-semibold rounded-xl shadow-md cursor-default pointer-events-none"
            >
              Confirmar Presença (RSVP)
            </button>
            <span className="text-[10px] text-princess-text/40 block">Visualização ilustrativa para celulares</span>
          </div>
        </div>
      </div>
    </div>
  );
}
