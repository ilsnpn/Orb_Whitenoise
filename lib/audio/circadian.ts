// Courbe d'énergie selon l'heure — inspiration rythmes circadien (24 h) et ultradien (~90 min).
import type { Params } from './modes';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Énergie 0…1 pour une heure décimale (ex. 14.5 = 14 h 30). */
export function energyAt(hour: number): number {
  const circadian = 0.5 - 0.4 * Math.cos((2 * Math.PI * (hour - 4)) / 24); // creux 4 h, pic 16 h
  const lunchDip = -0.15 * Math.exp(-((hour - 14) ** 2) / 2);              // coup de barre ~14 h
  const ultradian = 0.06 * Math.sin((2 * Math.PI * hour) / 1.5);           // vague de 90 min
  return clamp01(circadian + lunchDip + ultradian);
}

/** Module les paramètres de base selon l'énergie (0.5 = neutre). */
export function applyEnergy(p: Params, energy: number): Params {
  const f = energy - 0.5; // -0.5 … +0.5
  return {
    ...p,
    tempo: Math.round(p.tempo * (1 + 0.3 * f)),
    dynamism: clamp01(p.dynamism + 0.5 * f),
    brightness: clamp01(p.brightness + 0.5 * f),
    mix: { ...p.mix, pulse: clamp01(p.mix.pulse * (1 + f)) },
  };
}

export const nowHour = () => {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};
