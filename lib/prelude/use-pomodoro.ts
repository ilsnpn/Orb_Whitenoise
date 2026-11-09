'use client';

// Minuteur Pomodoro de la v2 : 25 min de travail, 5 min de pause, en boucle.
// Rien n'est enregistré ; le minuteur vit le temps de l'onglet.
import { useEffect, useState } from 'react';

export const WORK_MIN = 25;
export const BREAK_MIN = 5;

type Run = { phase: 'work' | 'break'; endsAt: number; cycle: number };

export function usePomodoro() {
  const [run, setRun] = useState<Run | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!run) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= run.endsAt) {
        setRun(run.phase === 'work'
          ? { phase: 'break', endsAt: n + BREAK_MIN * 60_000, cycle: run.cycle }
          : { phase: 'work', endsAt: n + WORK_MIN * 60_000, cycle: run.cycle + 1 });
      }
    }, 500);
    return () => clearInterval(t);
  }, [run]);

  const total = (run?.phase === 'break' ? BREAK_MIN : WORK_MIN) * 60_000;
  const left = run ? Math.max(0, run.endsAt - now) : 0;
  return {
    running: !!run,
    phase: run?.phase ?? 'work',
    cycle: run?.cycle ?? 1,
    left,
    progress: run ? 1 - left / total : 0,
    start: () => { const n = Date.now(); setNow(n); setRun({ phase: 'work', endsAt: n + WORK_MIN * 60_000, cycle: 1 }); },
    stop: () => setRun(null),
  };
}
export type Pomodoro = ReturnType<typeof usePomodoro>;

export const fmtLeft = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
