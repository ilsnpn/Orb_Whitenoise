import type { ReactNode } from 'react';
import { SoundscapeProvider } from '@/lib/prelude/soundscape-context';
import './prelude.css';

// pas de titre ici : celui de l'onglet est fixé une fois pour toutes dans app/layout.tsx
export const metadata = {
  description: 'Un fond sonore génératif pour se concentrer, se détendre, s’apaiser.',
};

export default function PreludeLayout({ children }: { children: ReactNode }) {
  return (
    <SoundscapeProvider>
      <div className="pr">{children}</div>
    </SoundscapeProvider>
  );
}
