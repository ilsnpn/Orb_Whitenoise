// Ambiance sonore → comportement de l'orbe. Le dessin vient de thinking-orbs
// (lib/orb/engine, MIT) ; ici on choisit quelle animation joue chaque ambiance,
// et comment les réglages audio la font varier.
import type { ModeName, Params } from '../audio/modes';
import type { OrbState } from './engine/orb-types';

type Rgb = [number, number, number];

export interface Mood {
  state: OrbState; // animation de thinking-orbs
  near: Rgb;       // encre des points proches
  far: Rgb;        // encre des points lointains
  description: string;
}

export const MOODS: Record<ModeName, Mood> = {
  relax: {
    state: 'composing',
    near: [255, 226, 196],
    far: [30, 18, 14],
    description: 'Ruban qui ondule doucement, teinte chaude.',
  },
  focus: {
    state: 'working',
    near: [205, 228, 255],
    far: [10, 18, 34],
    description: 'Particules en orbite, régulières et concentrées, teinte froide.',
  },
  sleep: {
    state: 'breathing',
    near: [196, 182, 255],
    far: [14, 10, 28],
    description: 'Anneau qui respire lentement, teinte violette tamisée.',
  },
};

/** Toutes les figures de thinking-orbs, avec un nom lisible. */
export const FIGURES: { state: OrbState; name: string }[] = [
  { state: 'composing', name: 'Ruban' },
  { state: 'working', name: 'Orbites' },
  { state: 'breathing', name: 'Anneau' },
  { state: 'searching', name: 'Globe' },
  { state: 'solving', name: 'Cube' },
  { state: 'listening', name: 'Vague' },
  { state: 'connecting', name: 'Toile' },
  { state: 'weaving', name: 'Tresse' },
  { state: 'shaping', name: 'Formes' },
];
export const figureName = (s: OrbState) => FIGURES.find((f) => f.state === s)?.name ?? s;

/** Ce que les réglages audio font à l'orbe. */
export function orbDrive(p: Params) {
  return {
    // le tempo pilote la vitesse de l'animation (64 BPM = vitesse de référence)
    speed: (p.tempo / 64) * 0.5,
    // le dynamisme pilote la densité de points, par paliers (chaque palier = un fondu de points)
    density: Math.round((0.35 + p.dynamism * 1.6) * 4) / 4,
    // la brillance éclaircit l'encre
    glow: 0.55 + p.brightness * 0.45,
  };
}
