// Pad 2D → paramètres du moteur. Deux axes perceptifs par mode.
// Au centre (0, 0) on retrouve le preset du mode (MODES[m].params) ; les bords
// atteignent les bornes ci-dessous. Interpolation par morceaux de chaque côté du centre.
import { MODES, type ModeName, type NoiseKind, type Params } from '../audio/modes';
import type { PadPos } from './types';

export const CENTER: PadPos = { x: 0, y: 0 };

export interface AxisLabels { top: string; bottom: string; left: string; right: string }

export const PAD_LABELS: Record<ModeName, AxisLabels> = {
  focus: { top: 'Vif', bottom: 'Posé', left: 'Fluide', right: 'Rythmé' },
  relax: { top: 'Foisonnant', bottom: 'Clairsemé', left: 'Feutré', right: 'Lumineux' },
  sleep: { top: 'Mélodies', bottom: 'Sans mélodie', left: 'Souffle clair', right: 'Souffle grave' },
};

export const PAD_HINT: Record<ModeName, string> = {
  focus: 'Glissez le palet : en haut plus d’élan, à droite un cadre rythmique plus net.',
  relax: 'Glissez le palet : en haut plus de notes, à droite un son plus lumineux.',
  sleep: 'Glissez le palet : en haut des mélodies, à droite un souffle plus grave.',
};

const clamp = (v: number, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, v));

/** v ∈ [-1, 1] → lo (à -1), mid (à 0), hi (à +1). */
const axis = (v: number, lo: number, mid: number, hi: number) =>
  v >= 0 ? mid + v * (hi - mid) : mid + v * (mid - lo);

export const clampPos = (p: PadPos): PadPos => ({ x: clamp(p.x), y: clamp(p.y) });

// Sleep : couleur du bruit par zones le long de x, avec une marge pour ne pas
// basculer sans arrêt quand le doigt hésite sur une frontière.
const NOISE_ZONES: { kind: NoiseKind; from: number }[] = [
  { kind: 'white', from: -1 },
  { kind: 'pink', from: -0.5 },
  { kind: 'brown', from: 0 }, // le preset sleep est brown : le centre retombe dessus
];
const HYSTERESIS = 0.06;

export function noiseKindAt(x: number, prev?: NoiseKind): NoiseKind {
  const raw = [...NOISE_ZONES].reverse().find((z) => x >= z.from)!.kind;
  if (!prev || prev === raw) return raw;
  const i = NOISE_ZONES.findIndex((z) => z.kind === prev);
  const lo = NOISE_ZONES[i].from - HYSTERESIS;
  const hi = (NOISE_ZONES[i + 1]?.from ?? Infinity) + HYSTERESIS;
  return x >= lo && x < hi ? prev : raw;
}

/** Réglages du moteur pour une position du palet. `prevNoise` sert à l'hystérésis (sleep). */
export function padPatch(mode: ModeName, pos: PadPos, prevNoise?: NoiseKind): Partial<Params> {
  const p = MODES[mode].params;
  const { x, y } = clampPos(pos);
  switch (mode) {
    case 'focus':
      return {
        dynamism: axis(y, 0.2, p.dynamism, 0.95),
        tempo: Math.round(axis(y, 76, p.tempo, 108)),
        mix: { ...p.mix, pulse: axis(x, 0.1, p.mix.pulse, 0.8), pad: axis(x, 0.75, p.mix.pad, 0.35) },
      };
    case 'relax':
      return {
        dynamism: axis(y, 0.15, p.dynamism, 0.8),
        brightness: axis(x, 0.15, p.brightness, 0.85),
        mix: { ...p.mix, melody: axis(y, 0.25, p.mix.melody, 0.8) },
      };
    case 'sleep':
      return {
        noiseKind: noiseKindAt(x, prevNoise),
        brightness: axis(x, 0.45, p.brightness, 0.1),
        mix: { ...p.mix, melody: axis(y, 0, p.mix.melody, 0.5), noise: axis(x, 0.15, p.mix.noise, 0.3) },
      };
  }
}
