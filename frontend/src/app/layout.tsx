import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

// next/font must live in a Server Component for optimal font loading (no FOUT)
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'APP-DX — BTS Integral',
  description: 'Sistema de Gestión de Laboratorios',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
