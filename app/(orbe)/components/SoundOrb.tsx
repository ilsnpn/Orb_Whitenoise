'use client';

// L'orbe de la v1, branchée sur le moteur partagé : figure du mode (ou figure
// imposée à la main), vitesse / densité dérivées des paramètres effectifs (orbDrive).
// Toujours blanche, à pleine lueur : pas de gris ni de teinte.
import { WHITE_INK } from '@/lib/prelude/day-plan';
import { useSound } from '@/lib/prelude/soundscape-context';
import { Orb } from '../../orb';

export function SoundOrb({ px }: { px: number }) {
  const s = useSound();
  return (
    <Orb
      look={{ state: s.orbState, density: s.drive.density }}
      speed={s.playing ? s.drive.speed : s.drive.speed * 0.3}
      near={WHITE_INK.near}
      far={WHITE_INK.far}
      glow={1}
      pulse={s.pulse}
      px={Math.round(px)}
    />
  );
}
