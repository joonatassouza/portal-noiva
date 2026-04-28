import type { Metadata, Viewport } from 'next';

import '@/presentation/styles/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Portal Noiva', template: '%s · Portal Noiva' },
  description:
    'Catálogo global das igrejas da Mensagem (Abertura da Palavra). Endereços, cultos, transmissões e eventos.',
  applicationName: 'Portal Noiva',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)',  color: '#0E121B' },
  ],
};

/**
 * Root layout — owns <html>/<body>.
 * The locale-specific layout under [locale]/ adds i18n + chrome.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
