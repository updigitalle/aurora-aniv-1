import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aniversário de 1 Ano da Aurora',
  description: 'Organizador de aniversário e RSVP online da Aurora no bosque encantado.',
  keywords: ['aniversário', 'Aurora', '1 ano', 'convite', 'RSVP', 'bosque encantado'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full scroll-smooth antialiased">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="min-h-full flex flex-col bg-princess-cream text-princess-text">
        {children}
      </body>
    </html>
  );
}
