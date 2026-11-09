'use client';

// Les trois ambiances, comme au début du parcours : l'orbe est le bouton, le nom est un
// simple texte dessous (liseré au survol, gras + cercle quand l'ambiance est choisie).
import type { ModeName } from '@/lib/audio/modes';
import { MOODS } from '@/lib/orb/moods';
import { WHITE_INK } from '@/lib/prelude/day-plan';
import { MODE_LABELS } from '@/lib/prelude/quiz';
import { useSound } from '@/lib/prelude/soundscape-context';
import type { CSSProperties } from 'react';
import { Orb } from '../../orb';
import './modeorbs.css';

const ORDER: ModeName[] = ['focus', 'relax', 'sleep'];
const still = () => 0;

export function ModeOrbs({ px, onChoose }: { px: number; onChoose: (m: ModeName) => void }) {
  const s = useSound();
  return (
    <div className="pr-mo" role="group" aria-label="Ambiance">
      {ORDER.map((m) => (
        <button key={m} type="button" className="pr-mo-item" aria-pressed={m === s.mode} onClick={() => onChoose(m)}
          style={{ '--pr-o': px } as CSSProperties}>
          <span className="pr-mo-orb" aria-hidden="true">
            <Orb look={{ state: MOODS[m].state, density: 0.75 }} speed={0.7} near={WHITE_INK.near} far={WHITE_INK.far}
              glow={1} pulse={still} px={px} />
          </span>
          <span className="pr-mo-label">{MODE_LABELS[m]}</span>
        </button>
      ))}
    </div>
  );
}
