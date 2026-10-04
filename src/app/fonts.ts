import { Simonetta, Delius, Nunito } from 'next/font/google';

// Fontes do convite original: Simonetta (texto) e DO Sans (detalhes).
// DO Sans não está no Google Fonts; Delius é a substituta mais próxima.
const simonetta = Simonetta({ subsets: ['latin'], weight: ['400'], variable: '--font-convite' });
const delius = Delius({ subsets: ['latin'], weight: ['400'], variable: '--font-convite-detalhe' });
// Interface do painel: arredondada como a Delius, mas com os pesos que tabelas e formulários pedem.
const nunito = Nunito({ subsets: ['latin'], variable: '--font-painel' });

export const fontVariables = `${simonetta.variable} ${delius.variable} ${nunito.variable}`;
