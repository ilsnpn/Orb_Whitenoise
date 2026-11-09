'use client';

// Un seul moteur audio pour toute la v2 : le hook existant (lib/ui/use-soundscape)
// est monté une fois dans le layout de /prelude et partagé par contexte.
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useSoundscape } from '../ui/use-soundscape';
import { MODE_LABELS } from './quiz';

export type Soundscape = ReturnType<typeof useSoundscape>;

const Ctx = createContext<Soundscape | null>(null);

export function SoundscapeProvider({ children }: { children: ReactNode }) {
  const s = useSoundscape();
  // Le hook v1 écrit à chaque rendu le titre du lecteur système avec ses noms
  // (« Sleep »…). Cet effet passe juste après lui : on y met les noms de la v2.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: MODE_LABELS[s.mode], artist: 'L’Orbe' });
  });
  return <Ctx.Provider value={s}>{children}</Ctx.Provider>;
}

export function useSound(): Soundscape {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSound() hors de <SoundscapeProvider>');
  return s;
}
