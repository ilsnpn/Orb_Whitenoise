// Le mini-quiz : une question d'orientation, puis 1 ou 2 questions par mode.
// Une réponse peut ouvrir une fiche (seulement quand elle éclaire quelque chose) ; rien n'est enregistré (pas de compte, pas de profil).
import type { ModeName } from '../audio/modes';
import type { Question } from './types';

/** Libellés des modes dans la v2 (le moteur garde ses noms focus / relax / sleep). */
export const MODE_LABELS: Record<ModeName, string> = {
  focus: 'Concentration',
  relax: 'Détente',
  sleep: 'Apaisement',
};

export const FIRST: Question = {
  id: 'goal',
  title: 'Que recherchez-vous ?',
  options: [
    { label: 'Me concentrer', mode: 'focus', card: 'open-space-noise' },
    { label: 'Me détendre', mode: 'relax', card: 'music-stress' },
    { label: 'M’apaiser', mode: 'sleep', card: 'nature-recovery' },
  ],
};

export const BRANCHES: Record<ModeName, Question[]> = {
  focus: [
    {
      id: 'start-task',
      title: 'Se lancer dans une tâche, pour vous, c’est…',
      options: [
        { label: 'Plutôt simple', pad: { x: 0.2, y: 0.1 } },
        { label: 'Ça dépend des jours', card: 'steady-rhythm' },
        { label: 'Le plus dur', card: 'steady-rhythm', pad: { x: 0.45, y: 0.3 } },
      ],
    },
    {
      id: 'adhd',
      title: 'Le TDA/H, cela vous parle ?',
      note: 'Votre réponse n’est pas enregistrée.',
      options: [
        { label: 'Oui, on me l’a diagnostiqué' },
        { label: 'Je me pose la question' },
        { label: 'Pas vraiment' },
        { label: 'C’est quoi ?', card: 'adhd' },
      ],
    },
  ],
  relax: [
    {
      id: 'what-calms',
      title: 'Qu’est-ce qui vous détend le plus ?',
      options: [
        { label: 'Les sons de la nature', card: 'restorative-sound', pad: { x: -0.4, y: -0.2 } },
        { label: 'Une musique douce', card: 'restorative-sound', pad: { x: 0.25, y: 0.3 } },
        { label: 'Le calme plat', card: 'restorative-sound', pad: { x: -0.5, y: -0.7 } },
      ],
    },
  ],
  sleep: [
    {
      id: 'what-bothers',
      title: 'Autour de vous, qu’est-ce qui gêne le plus ?',
      options: [
        { label: 'Les conversations', card: 'masking', pad: { x: -0.4, y: -0.6 } },
        { label: 'Le bruit de fond (clim, machines)', card: 'masking', pad: { x: 0.5, y: -0.3 } },
        { label: 'Un peu tout', card: 'masking', pad: { x: 0, y: -0.5 } },
      ],
    },
  ],
};

/** Questions communes, posées après celles du mode : elles orientent le réglage et la séance. */
export const COMMON: Question[] = [
  {
    id: 'peak',
    title: 'Quand êtes-vous le plus en forme ?',
    note: 'Avec l’heure actuelle, cela nous aide à régler le son.',
    options: [
      { label: 'Le matin', peak: 10 },
      { label: 'En début d’après-midi', peak: 14 },
      { label: 'En fin de journée', peak: 18 },
      { label: 'Ça varie' },
    ],
  },
];
