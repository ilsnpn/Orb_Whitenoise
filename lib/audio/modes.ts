// Presets d'ambiance — données pures, le moteur construit le son à partir de ça.
export type NoiseKind = 'white' | 'pink' | 'brown';
export type ModeName = 'relax' | 'focus' | 'sleep';

export interface Mix {
  pad: number;
  melody: number;
  pulse: number;
  bass: number;
  noise: number;
}

export interface Params {
  tempo: number;      // BPM
  register: number;   // décalage en demi-tons (-12 grave … +12 aigu)
  dynamism: number;   // 0 statique … 1 très mouvant
  brightness: number; // 0 sombre … 1 brillant
  noiseKind: NoiseKind;
  mix: Mix;
}

export interface Mode {
  label: string;
  description: string;
  root: number;      // note MIDI de la tonique
  scale: number[];    // intervalles de la gamme (demi-tons)
  chords: number[][]; // accords, en demi-tons relatifs à la tonique
  params: Params;
}

export const MODES: Record<ModeName, Mode> = {
  relax: {
    label: 'Relax',
    description:
      'La majeur (tonalité lumineuse, apaisée), gamme pentatonique majeure (5 notes, ' +
      'aucune ne « frotte » : impossible de sonner faux). 64 BPM, accords doux avec ' +
      'septième et neuvième pour un côté flottant.',
    root: 57, // A3
    scale: [0, 2, 4, 7, 9],
    chords: [
      [0, 4, 7, 11, 14],
      [-3, 0, 4, 7, 12],
      [5, 9, 12, 16],
      [2, 5, 9, 12, 16],
    ],
    params: {
      tempo: 64, register: 0, dynamism: 0.45, brightness: 0.45, noiseKind: 'pink',
      mix: { pad: 0.7, melody: 0.55, pulse: 0.25, bass: 0.45, noise: 0.15 },
    },
  },
  focus: {
    label: 'Focus',
    description:
      'Ré, mode lydien (majeur avec une quarte augmentée : son clair, aérien, un peu ' +
      '« en suspens », qui stimule sans tendre). 92 BPM, pulsation plus présente pour ' +
      'donner un cadre régulier au travail.',
    root: 62, // D4
    scale: [0, 2, 4, 6, 7, 9, 11],
    chords: [
      [0, 7, 11, 14, 18],
      [2, 9, 14, 18],
      [-5, 2, 7, 11, 14],
      [4, 11, 14, 19],
    ],
    params: {
      tempo: 92, register: 0, dynamism: 0.6, brightness: 0.6, noiseKind: 'pink',
      mix: { pad: 0.5, melody: 0.6, pulse: 0.5, bass: 0.4, noise: 0.12 },
    },
  },
  sleep: {
    label: 'Sleep',
    description:
      'Mi mineur (tonalité plus sombre, introspective), gamme pentatonique mineure, ' +
      'transposée vers le grave. 48 BPM, quasi pas de pulsation, peu de notes, bruit ' +
      'brownien (grave et sourd, comme une pluie lointaine) plus présent.',
    root: 52, // E3
    scale: [0, 3, 5, 7, 10],
    chords: [
      [0, 7, 10, 15],
      [-4, 3, 7, 12],
      [-7, 0, 5, 10],
      [-2, 5, 10, 14],
    ],
    params: {
      tempo: 48, register: -5, dynamism: 0.2, brightness: 0.25, noiseKind: 'brown',
      mix: { pad: 0.8, melody: 0.3, pulse: 0.08, bass: 0.5, noise: 0.225 }, // bruit −25 % : la mélodie ressort
    },
  },
};
