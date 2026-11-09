// Planning de la journée : quel mode, à quelle heure. Calé sur la courbe d'énergie
// de lib/audio/circadian (creux de la nuit, coup de barre vers 14 h, pic l'après-midi).
// C'est une suggestion de rythme de travail, pas une prescription.
import type { ModeName } from '../audio/modes';

export interface Slot { from: number; to: number; mode: ModeName; label: string }

export const DAY_PLAN: Slot[] = [
  { from: 0, to: 7, mode: 'sleep', label: 'Nuit' },
  { from: 7, to: 9, mode: 'relax', label: 'Mise en route' },
  { from: 9, to: 12.5, mode: 'focus', label: 'Matinée' },
  { from: 12.5, to: 14.5, mode: 'relax', label: 'Après le repas' },
  { from: 14.5, to: 18.5, mode: 'focus', label: 'Après-midi' },
  { from: 18.5, to: 21, mode: 'relax', label: 'Soirée' },
  { from: 21, to: 24, mode: 'sleep', label: 'Fin de journée' },
];

export const slotAt = (hour: number): Slot =>
  DAY_PLAN.find((s) => hour >= s.from && hour < s.to) ?? DAY_PLAN[0];
export const modeAt = (hour: number): ModeName => slotAt(hour).mode;

/** Encre de l'orbe dans la v2 : blanc pour tous les modes (la teinte par mode est en réserve). */
export const WHITE_INK = { near: [255, 255, 255] as [number, number, number], far: [0, 0, 0] as [number, number, number] };
