'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard] Rendering error:', error.message, error.stack);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
      <div className="bg-[#f9ebe8] border border-[#ebc6be] rounded-2xl p-8 max-w-md">
        <AlertTriangle className="mx-auto mb-3 text-forest-berry" size={36} />
        <h2 className="text-lg font-bold text-[#8a2f22] mb-2">Erro ao carregar o painel</h2>
        <p className="text-sm text-forest-berry/80 mb-4">
          {error.message || 'Ocorreu um erro inesperado.'}
        </p>
        {error.digest && (
          <p className="text-xs text-forest-berry mb-4 font-mono">ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="bg-forest-berry hover:bg-forest-berry text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
