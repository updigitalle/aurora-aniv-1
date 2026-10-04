import type { Metadata, Viewport } from 'next';
import { fontVariables } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aniversário de 1 Ano da Aurora',
  description: 'Organizador do 1º aniversário da Aurora no bosque encantado.',
  keywords: ['aniversário', 'Aurora', '1 ano', 'convite', 'RSVP', 'bosque encantado'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f0efeb',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${fontVariables} h-full scroll-smooth antialiased`}>
      <body className="min-h-full flex flex-col bg-princess-cream text-princess-text">
        {children}
      </body>
    </html>
  );
}
