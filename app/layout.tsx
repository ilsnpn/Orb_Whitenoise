import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import { ServiceWorkerRegister } from './sw-register';

export const metadata = {
  // Le nom de l'onglet ne change jamais : « L’Orbe » sur toutes les pages et dans tous les écrans.
  title: { absolute: 'L’Orbe' },
  description: 'Paysages sonores génératifs',
  appleWebApp: { capable: true, title: 'L’Orbe', statusBarStyle: 'black-translucent' as const },
  // favicon : l'orbe « Détente » (public/icon.svg, favicon.ico, PNG)
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/favicon.ico', sizes: 'any' }],
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = { themeColor: '#000000' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#000', color: '#fff' }}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
