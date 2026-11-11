'use client';

// Minuteur Pomodoro de la v2 : travail puis pause, en boucle. Deux rythmes au choix
// (25/5 classique, 50/10 pour les longues plages). Le rythme choisi est retenu dans
// le navigateur ; la session, elle, vit le temps de l'onglet.
import { useEffect, useRef, useState } from 'react';

export const RHYTHMS = {
  short: { work: 25, rest: 5 },
  long: { work: 50, rest: 10 },
} as const;
export type Rhythm = keyof typeof RHYTHMS;
export type PomoPhase = 'work' | 'break';

const KEY = 'orbe.pomodoro.rhythm';
const loadRhythm = (): Rhythm => {
  try { return localStorage.getItem(KEY) === 'long' ? 'long' : 'short'; } catch { return 'short'; }
};

const endAt = (n: number, min: number) => n + min * 60_000;

type Run = { phase: PomoPhase; endsAt: number; cycle: number };

/** `onPhase` est appelé à chaque bascule automatique (fin du travail → 'break', fin de la pause → 'work'). */
export function usePomodoro(onPhase?: (next: PomoPhase) => void) {
  const [rhythm, setRhythmState] = useState<Rhythm>('short');
  const [run, setRun] = useState<Run | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const cb = useRef(onPhase);
  cb.current = onPhase;

  useEffect(() => { setRhythmState(loadRhythm()); }, []);

  const r = RHYTHMS[rhythm];
  const minutes = (ph: PomoPhase) => (ph === 'break' ? r.rest : r.work);

  useEffect(() => {
    if (!run) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= run.endsAt) {
        const next: PomoPhase = run.phase === 'work' ? 'break' : 'work';
        setRun({ phase: next, endsAt: endAt(n, minutes(next)), cycle: next === 'work' ? run.cycle + 1 : run.cycle });
        cb.current?.(next);
      }
    }, 500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, rhythm]);

  const total = minutes(run?.phase ?? 'work') * 60_000;
  const left = run ? Math.max(0, run.endsAt - now) : 0;
  const start = () => { const n = Date.now(); setNow(n); setRun({ phase: 'work', endsAt: endAt(n, r.work), cycle: 1 }); };
  return {
    running: !!run,
    phase: run?.phase ?? 'work',
    cycle: run?.cycle ?? 1,
    left,
    progress: run ? 1 - left / total : 0,
    rhythm,
    /** Change de rythme ; si une session tourne, elle repart du début avec le nouveau rythme. */
    setRhythm: (next: Rhythm) => {
      setRhythmState(next);
      try { localStorage.setItem(KEY, next); } catch { /* stockage indisponible : tant pis */ }
      if (run) { const n = Date.now(); setNow(n); setRun({ phase: 'work', endsAt: endAt(n, RHYTHMS[next].work), cycle: 1 }); }
    },
    start,
    stop: () => setRun(null),
  };
}
export type Pomodoro = ReturnType<typeof usePomodoro>;

export const fmtLeft = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
