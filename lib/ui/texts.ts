// Explications temporaires affichées dans l'interface, communes aux deux habillages.
import type { Mix } from '../audio/modes';

export const MIX_LABELS: Record<keyof Mix, string> = {
  pad: 'Nappe', melody: 'Mélodie', pulse: 'Pulsation', bass: 'Basse', noise: 'Bruit',
};

export const MIX_HINTS: Record<keyof Mix, string> = {
  pad: 'Accords tenus qui changent toutes les 2 à 4 mesures, avec de longs fondus. Le « lit » harmonique.',
  melody: 'Notes isolées, type cloche douce, tirées de l\'accord ou de la gamme, avec écho calé sur le tempo et réverbe.',
  pulse: 'Battement sourd sur les temps + petits ticks légers entre les temps. C\'est le rythme.',
  bass: 'Note grave tenue sur la fondamentale de chaque accord. Donne l\'assise.',
  noise: 'Bruit de fond filtré qui « respire » lentement. Texture, comme un souffle ou une pluie.',
};

export const NOISE_HINT =
  'white = toutes les fréquences à égalité (soufflant, aigu) · pink = plus doux, naturel (vent, cascade) · brown = grave et sourd (orage lointain).';

export const AUTO_HINT =
  'Module le son selon l\'heure : énergie basse la nuit (creux vers 4 h), qui monte le matin, petit coup de mou vers 14 h, pic vers 16 h, puis redescend le soir. ' +
  'Une petite vague toutes les 90 min s\'y ajoute. L\'énergie accélère/ralentit le tempo (±15 %), et pousse dynamisme, brillance et pulsation. ' +
  'Tes curseurs restent la base ; l\'heure les décale.';

export const HINTS = {
  tempo: 'Vitesse de tout le morceau (battements par minute) : pulsation, notes, écho. ~50 = très lent, ~90 = marche tranquille.',
  register: 'Transpose tout vers le grave ou l\'aigu. 12 demi-tons = une octave. Prend effet au prochain changement d\'accord.',
  dynamism: '0 % = nappe quasi immobile, très peu de notes. 100 % = plus de notes et de battements, accords qui changent vite et dans le désordre, timbre qui ondule fort.',
  brightness: 'Ouvre ou ferme les filtres : sombre = étouffé, feutré ; brillant = plus d\'aigus, plus clair.',
  simHour: 'Pour tester : fais glisser pour entendre le son de 4 h du matin ou de 16 h.',
  orb: 'Sa vitesse suit le tempo, sa densité de points suit le dynamisme, sa luminosité la brillance ; elle palpite sur les battements et les notes. Changer d\'ambiance la fait se transformer point par point.',
};

export const fmtHour = (h: number) => `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
export const pct = (v: number) => `${Math.round(v * 100)}%`;
