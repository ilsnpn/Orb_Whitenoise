'use client';

import { useId, type CSSProperties } from 'react';
import { MOODS } from '@/lib/orb/moods';
import { WHITE_INK } from '@/lib/prelude/day-plan';
import type { Option, Question } from '@/lib/prelude/types';
import { Orb } from '../../orb';
import { useViewport } from './use-viewport';
import './quiz.css';

const still = () => 0;

/**
 * Taille des orbes de la question d'orientation, et leur disposition.
 * Trois orbes qui prennent toute la place disponible : côte à côte sur un écran large,
 * l'une au-dessus de l'autre sur un écran étroit et haut, selon ce qui donne les plus grosses.
 * Les points n'occupent qu'environ 80 % du canevas : celui-ci est agrandi d'autant
 * (BLEED) et ses marges transparentes se recouvrent (voir .pr-q-mode-orb).
 */
const BLEED = 1.2;
function modeLayout(w: number, h: number) {
  const pad = w >= 700 ? 48 : 20;
  const gap = w >= 700 ? 24 : 12;
  const head = 120; // titre + marges
  const label = 48; // texte sous l'orbe
  const cell = (w - pad * 2 - gap * 2) / 3;
  const row = Math.min(cell, h - head - label - 30);
  const col = Math.min(w - pad * 2, (h - head - (label + 8) * 3 - 40) / 3);
  return row >= col
    ? { dir: 'row' as const, px: Math.round(Math.max(96, Math.min(row * BLEED, 640))), gap }
    : { dir: 'col' as const, px: Math.round(Math.max(96, Math.min(col * BLEED, 480))), gap: 8 };
}

export function QuestionView({
  question,
  step,
  total,
  onAnswer,
}: {
  question: Question;
  step: number;
  total?: number;
  onAnswer: (o: Option) => void;
}) {
  const titleId = useId();
  const vp = useViewport();
  // question d'orientation : les trois modes, chacun une grosse orbe cliquable avec son nom dessous
  const modes = question.options.every((o) => o.mode);
  const lay = modeLayout(vp.w, vp.h);

  return (
    <section key={question.id} className={`pr-screen pr-q-center${modes ? ' pr-q-wide' : ''}`}>
      <div className="pr-q-copy">
        <p className="pr-kicker">{total ? `${step} / ${total}` : 'Pour commencer'}</p>
        <h2 id={titleId} className="pr-title">{question.title}</h2>
      </div>
      <div
        className={modes ? `pr-q-modes pr-q-modes--${lay.dir}` : 'pr-q-options'}
        style={modes ? { gap: lay.gap } : undefined}
        role="group"
        aria-labelledby={titleId}
      >
        {question.options.map((o, i) => {
          const mood = o.mode && MOODS[o.mode];
          return (
            <button key={o.label} type="button"
              className={modes ? 'pr-q-mode' : 'pr-btn pr-q-option'}
              style={{ '--pr-q-i': i, '--pr-o': lay.px } as CSSProperties}
              onClick={() => onAnswer(o)}>
              {mood ? (
                <span className="pr-q-mode-orb" aria-hidden="true">
                  <Orb look={{ state: mood.state, density: 0.75 }} speed={0.7} near={WHITE_INK.near} far={WHITE_INK.far}
                    glow={1} pulse={still} px={lay.px} />
                </span>
              ) : null}
              <span className={modes ? 'pr-q-mode-label' : undefined}>{o.label}</span>
            </button>
          );
        })}
      </div>
      {question.note ? <p className="pr-muted">{question.note}</p> : null}
    </section>
  );
}
