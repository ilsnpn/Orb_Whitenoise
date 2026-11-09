// Types partagés de la v2 « Prélude » (quiz pédagogique + fiches science + pad).
import type { ModeName } from '../audio/modes';

/** Identifiants des fiches. Le contenu vit dans science.ts. */
export type CardId =
  | 'open-space-noise' // Q1 → Concentration : pourquoi les conversations gênent
  | 'steady-rhythm'    // F2 : un fond régulier et l'attention
  | 'pomodoro'         // aparté optionnel depuis steady-rhythm (méthode, pas une étude)
  | 'adhd'             // F3 : TDA/H, prudent, renvoi vers un professionnel
  | 'music-stress'     // Q1 → Détente : musique et réponse au stress
  | 'restorative-sound'// R2 : environnements sonores « restaurateurs »
  | 'nature-recovery'  // Q1 → Apaisement : sons de nature et récupération
  | 'masking';         // A2 : masquer le bruit plutôt que le couvrir

export interface Source {
  label: string; // ex. « Thaut et al., 2014 — Frontiers in Psychology »
  url: string;   // lien vers l'étude originale (DOI, PubMed ou PMC), vérifié
}

export interface Card {
  id: CardId;
  kicker: string;     // petites capitales au-dessus du titre, ex. « CE QUE DIT LA RECHERCHE »
  title: string;
  body: string[];     // 2 à 3 paragraphes courts, prudents (« des recherches suggèrent… »)
  limits: string;     // encart « Ce que ça ne dit pas »
  sources: Source[];  // au moins une, sauf la fiche méthode (pomodoro) qui cite sa référence
  care?: string;      // encart santé, ex. « Parles-en à un professionnel de santé »
}

/** Position du palet sur le pad : x gauche→droite, y bas→haut, chacun dans [-1, 1]. */
export interface PadPos { x: number; y: number }

export interface Option {
  label: string;
  card?: CardId;      // fiche ouverte après cette réponse
  mode?: ModeName;    // Q1 seulement : mode choisi pour la séance
  pad?: PadPos;       // position de départ du pad pour la séance (non enregistrée)
  peak?: number;      // heure où la personne se sent le plus en forme (oriente le réglage)
}

export interface Question {
  id: string;
  title: string;
  note?: string;      // petite ligne grise sous les options
  options: Option[];
  /** Aparté proposé en lien sur la fiche qui suit (ex. Pomodoro). */
  aside?: { card: CardId; label: string };
}
