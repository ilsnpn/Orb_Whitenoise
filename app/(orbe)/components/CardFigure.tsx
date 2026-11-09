// Schémas illustratifs des fiches « Prélude » : SVG inline, monochrome, dessinés à la main.
// Ce ne sont PAS des données : les courbes montrent l'idée, pas des mesures.
import type { ReactNode } from 'react';
import type { CardId } from '@/lib/prelude/types';

type Pt = [number, number];

const W = 320;
const H = 140;

/** Chemin lissé (Catmull-Rom → Bézier) passant par les points. */
function smooth(pts: Pt[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Chemin polyligne. */
function poly(pts: Pt[]): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
}

/** Pseudo-aléatoire déterministe dans [-1, 1] (même rendu serveur et client). */
function jitter(i: number): number {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

function sample(x0: number, x1: number, step: number, f: (x: number) => number): Pt[] {
  const out: Pt[] = [];
  for (let x = x0; x <= x1 + 0.001; x += step) out.push([x, f(x)]);
  return out;
}

const T = { fontSize: 10, fill: 'currentColor' } as const;

function Label({ x, y, children, anchor = 'start', dim = 0.6 }: {
  x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; dim?: number;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} opacity={dim} {...T}>
      {children}
    </text>
  );
}

/** Axes discrets (temps → droite, grandeur ↑). */
function Axes({ y }: { y: string }) {
  return (
    <g opacity={0.35}>
      <path d={`M28 18 V118 H${W - 12}`} fill="none" stroke="currentColor" strokeWidth={1} />
      <path d={`M${W - 16} 115 L${W - 12} 118 L${W - 16} 121`} fill="none" stroke="currentColor" strokeWidth={1} />
      <text x={22} y={20} textAnchor="end" {...T} fontSize={9} transform="rotate(-90 22 20)">
        {y}
      </text>
      <text x={W - 14} y={132} textAnchor="end" {...T} fontSize={9}>temps</text>
    </g>
  );
}

/** Légende : échantillon de trait + libellé. */
function Key({ x, y, dashed, children }: { x: number; y: number; dashed?: boolean; children: ReactNode }) {
  return (
    <g>
      <path
        d={`M${x} ${y - 3} h16`}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeDasharray={dashed ? '3 3' : undefined}
        opacity={dashed ? 0.55 : 0.95}
      />
      <Label x={x + 22} y={y}>{children}</Label>
    </g>
  );
}

function Heart({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 2.5 C-1.5 -1 -7 -0.5 -7 3.5 C-7 7 -2 9.5 0 12 C2 9.5 7 7 7 3.5 C7 -0.5 1.5 -1 0 2.5 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinejoin="round"
    />
  );
}

/** Tracé de pouls : ligne plate + `beats` battements entre x0 et x1. */
function pulse(x0: number, x1: number, y: number, beats: number): string {
  const step = (x1 - x0) / beats;
  let d = `M${x0} ${y}`;
  for (let b = 0; b < beats; b++) {
    const c = x0 + step * (b + 0.5);
    d += ` L${c - 5} ${y} L${c - 2} ${y - 9} L${c + 1} ${y + 5} L${c + 3} ${y}`;
  }
  return `${d} L${x1} ${y}`;
}

function Bubble({ x, y, w, tail }: { x: number; y: number; w: number; tail: 'l' | 'r' }) {
  const h = 20;
  const tx = tail === 'r' ? x + w - 8 : x + 8;
  const dir = tail === 'r' ? 6 : -6;
  return (
    <g opacity={0.7}>
      <rect x={x} y={y} width={w} height={h} rx={7} fill="none" stroke="currentColor" strokeWidth={1} />
      <path d={`M${tx - 3} ${y + h} L${tx + dir} ${y + h + 6} L${tx + 3} ${y + h}`} fill="var(--pr-surface, #1a1a1a)" stroke="currentColor" strokeWidth={1} strokeLinejoin="round" />
      <path d={`M${x + 7} ${y + 8} h${w - 18} M${x + 7} ${y + 13} h${w - 26}`} stroke="currentColor" strokeWidth={1} opacity={0.6} />
    </g>
  );
}

const FIGURES: Record<CardId, { label: string; draw: () => ReactNode }> = {
  'open-space-noise': {
    label:
      'Schéma : une personne au centre fixe un point de concentration ; autour d’elle, quatre bulles de parole envoient de petits traits qui brouillent ce point.',
    draw: () => (
      <g>
        {/* point de focus, contour brouillé */}
        <circle cx={160} cy={38} r={3} fill="currentColor" />
        <circle cx={160} cy={38} r={10} fill="none" stroke="currentColor" strokeWidth={1} strokeDasharray="2 3" opacity={0.7} />
        <Label x={160} y={18} anchor="middle">concentration</Label>
        {/* regard */}
        <path d="M160 80 V52" stroke="currentColor" strokeWidth={1} strokeDasharray="1.5 3" opacity={0.5} />
        {/* personne */}
        <circle cx={160} cy={94} r={11} fill="none" stroke="currentColor" strokeWidth={1.5} />
        <path d="M134 132 C136 116 147 109 160 109 C173 109 184 116 186 132" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        {/* bulles */}
        <Bubble x={34} y={22} w={58} tail="r" />
        <Bubble x={232} y={16} w={54} tail="l" />
        <Bubble x={24} y={84} w={50} tail="r" />
        <Bubble x={246} y={80} w={58} tail="l" />
        {/* interférences vers le focus */}
        <g stroke="currentColor" strokeWidth={1} fill="none" opacity={0.45} strokeLinecap="round">
          <path d="M96 40 q8 -6 16 0 t16 0 t14 -2" />
          <path d="M228 32 q-8 6 -16 0 t-16 2 t-12 4" />
          <path d="M78 88 q10 -8 20 -14 t22 -16 t22 -14" />
          <path d="M242 86 q-10 -8 -20 -14 t-22 -16 t-22 -14" />
        </g>
      </g>
    ),
  },

  masking: {
    label:
      'Schéma avant / après : à gauche, des ondes de parole irrégulières bien nettes ; à droite, une bande de bruit continu les recouvre et les mêmes ondes deviennent plus faibles.',
    draw: () => {
      const env = (x: number) =>
        [[34, 9, 1], [66, 8, 0.6], [102, 11, 0.95], [132, 7, 0.7]].reduce(
          (s, [c, w, a]) => s + a * Math.exp(-(((x - c) / w) ** 2)),
          0,
        );
      const speech = (x0: number, amp: number) =>
        poly(sample(x0, x0 + 132, 1.5, (x) => 70 - amp * env(x - x0 + 16) * Math.sin(x * 0.9) * (0.65 + 0.35 * Math.sin(x * 0.23))));
      const noise = poly(sample(172, 304, 2, (x) => 70 + 11 * jitter(x)));
      return (
        <g>
          <Label x={16} y={18}>avant : parole seule</Label>
          <Label x={172} y={18}>après : avec fond continu</Label>
          <path d="M160 26 V124" stroke="currentColor" strokeWidth={1} strokeDasharray="2 4" opacity={0.35} />
          <path d={`M16 70 H148`} stroke="currentColor" strokeWidth={1} opacity={0.2} />
          <path d={speech(16, 36)} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round" />
          <rect x={172} y={54} width={132} height={32} rx={6} fill="currentColor" opacity={0.08} />
          <path d={noise} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.35} />
          <path d={speech(172, 16)} fill="none" stroke="currentColor" strokeWidth={1.2} opacity={0.55} strokeLinejoin="round" />
          <Label x={82} y={128} anchor="middle" dim={0.45}>mots intelligibles</Label>
          <Label x={238} y={128} anchor="middle" dim={0.45}>mots estompés</Label>
        </g>
      );
    },
  },

  'steady-rhythm': {
    label:
      'Schéma : deux courbes d’attention au fil du temps. En pointillés, « silence » : la courbe vagabonde beaucoup. En trait plein, « avec fond » : elle reste plus stable.',
    draw: () => {
      const silence: Pt[] = [[30, 52], [62, 36], [94, 86], [124, 48], [156, 100], [190, 54], [222, 92], [256, 40], [300, 82]];
      const fond: Pt[] = [[30, 52], [62, 46], [94, 58], [124, 50], [156, 60], [190, 52], [222, 58], [256, 50], [300, 56]];
      return (
        <g>
          <Axes y="attention" />
          <path d={smooth(silence)} fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.55} />
          <path d={smooth(fond)} fill="none" stroke="currentColor" strokeWidth={1.5} />
          <Key x={196} y={18} dashed>silence</Key>
          <Key x={196} y={30}>avec fond</Key>
        </g>
      );
    },
  },

  pomodoro: {
    label:
      'Schéma : une frise de quatre blocs de travail de 25 minutes, séparés par trois pauses de 5 minutes.',
    draw: () => {
      const total = 4 * 25 + 3 * 5;
      const x0 = 16;
      const k = (W - 32) / total;
      const blocks: ReactNode[] = [];
      let x = x0;
      for (let i = 0; i < 7; i++) {
        const work = i % 2 === 0;
        const w = (work ? 25 : 5) * k;
        blocks.push(
          work ? (
            <rect key={i} x={x + 1} y={52} width={w - 2} height={34} rx={5} fill="currentColor" fillOpacity={0.12} stroke="currentColor" strokeWidth={1.2} />
          ) : (
            <rect key={i} x={x + 2} y={60} width={w - 4} height={18} rx={4} fill="none" stroke="currentColor" strokeWidth={1} strokeDasharray="2 2" opacity={0.6} />
          ),
        );
        x += w;
      }
      const w25 = 25 * k;
      const w5 = 5 * k;
      return (
        <g>
          {blocks}
          <path d={`M${x0} 102 H${W - 16}`} stroke="currentColor" strokeWidth={1} opacity={0.3} />
          {Array.from({ length: 8 }, (_, i) => {
            const tx = x0 + [0, 25, 30, 55, 60, 85, 90, 115][i] * k;
            return <path key={i} d={`M${tx.toFixed(1)} 99 V105`} stroke="currentColor" strokeWidth={1} opacity={0.3} />;
          })}
          <Label x={x0 + w25 / 2} y={42} anchor="middle">25 min</Label>
          <Label x={x0 + w25 + w5 / 2} y={42} anchor="middle">5 min</Label>
          <Label x={x0 + w25 / 2} y={120} anchor="middle" dim={0.45}>travail</Label>
          <Label x={x0 + w25 + w5 / 2} y={120} anchor="middle" dim={0.45}>pause</Label>
          <Label x={W - 16} y={120} anchor="end" dim={0.45}>et on recommence</Label>
        </g>
      );
    },
  },

  adhd: {
    label:
      'Schéma : une même source sonore, deux flèches. Vers le premier groupe, avec TDA/H, l’effet observé est positif ; vers le second, sans TDA/H, il est négatif.',
    draw: () => (
      <g>
        {/* source sonore */}
        <circle cx={46} cy={70} r={5} fill="currentColor" />
        <g fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round">
          <path d="M56 60 a14 14 0 0 1 0 20" opacity={0.8} />
          <path d="M62 54 a22 22 0 0 1 0 32" opacity={0.5} />
        </g>
        <Label x={46} y={104} anchor="middle">un même son</Label>
        {/* flèches */}
        <g fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M82 64 C118 48 140 38 178 36" />
          <path d="M172 31 L178 36 L172 41" />
          <path d="M82 76 C118 92 140 102 178 104" />
          <path d="M172 99 L178 104 L172 109" />
        </g>
        {/* groupes */}
        {[36, 104].map((cy, g) => (
          <g key={cy}>
            {[0, 1, 2].map((j) => (
              <circle key={j} cx={196 + j * 12} cy={cy} r={4} fill="none" stroke="currentColor" strokeWidth={1.2} />
            ))}
            {g === 0 ? (
              <path d={`M246 ${cy + 7} V${cy - 7} M241 ${cy - 2} L246 ${cy - 7} L251 ${cy - 2}`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d={`M246 ${cy - 7} V${cy + 7} M241 ${cy + 2} L246 ${cy + 7} L251 ${cy + 2}`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
            )}
          </g>
        ))}
        <Label x={190} y={22}>avec TDA/H : aide</Label>
        <Label x={190} y={126}>sans TDA/H : gêne</Label>
      </g>
    ),
  },

  'music-stress': {
    label:
      'Schéma : deux courbes de stress pendant une épreuve. En pointillés, « silence » : la courbe monte. En trait plein, « musique calme » : elle reste basse.',
    draw: () => {
      const silence: Pt[] = [[30, 100], [80, 98], [130, 86], [180, 60], [230, 44], [300, 40]];
      const musique: Pt[] = [[30, 100], [80, 100], [130, 98], [180, 94], [230, 92], [300, 93]];
      return (
        <g>
          <Axes y="stress" />
          <rect x={110} y={20} width={190} height={98} fill="currentColor" opacity={0.05} />
          <Label x={116} y={114} dim={0.45}>préparation de l’épreuve</Label>
          <path d={smooth(silence)} fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.55} />
          <path d={smooth(musique)} fill="none" stroke="currentColor" strokeWidth={1.5} />
          <Key x={40} y={30} dashed>silence</Key>
          <Key x={40} y={42}>musique calme</Key>
        </g>
      );
    },
  },

  'restorative-sound': {
    label:
      'Schéma comparatif : à gauche, une feuille et une onde douce, avec un cœur au pouls plus lent ; à droite, des immeubles et une onde heurtée, avec un pouls un peu plus rapide.',
    draw: () => (
      <g>
        <path d="M160 14 V128" stroke="currentColor" strokeWidth={1} strokeDasharray="2 4" opacity={0.3} />
        {/* forêt */}
        <g fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M26 46 C30 26 48 18 62 18 C62 34 50 48 30 48 Z" />
          <path d="M26 50 L52 26" opacity={0.6} />
        </g>
        <path d={smooth(sample(72, 148, 6, (x) => 34 + 6 * Math.sin((x - 72) / 12)) as Pt[])} fill="none" stroke="currentColor" strokeWidth={1.2} />
        <Label x={16} y={74}>forêt</Label>
        <Heart x={26} y={94} />
        <path d={pulse(40, 148, 104, 2)} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round" />
        <Label x={40} y={126} dim={0.45}>pouls plus lent</Label>
        {/* ville */}
        <g fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round" opacity={0.75}>
          <path d="M172 50 V30 H182 V22 H192 V50 M192 50 V34 H204 V50 M204 50 V26 H214 V50 Z" />
        </g>
        <path d={poly(sample(222, 304, 3, (x) => 36 + 9 * jitter(x * 0.7)))} fill="none" stroke="currentColor" strokeWidth={1.2} opacity={0.75} strokeLinejoin="round" />
        <Label x={172} y={74}>ville</Label>
        <Heart x={182} y={94} />
        <path d={pulse(196, 304, 104, 3)} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round" opacity={0.75} />
        <Label x={196} y={126} dim={0.45}>pouls un peu plus rapide</Label>
      </g>
    ),
  },

  'nature-recovery': {
    label:
      'Schéma : une courbe d’activation monte pendant un stress puis redescend. En trait plein, avec sons de nature, elle redescend plus vite ; en pointillés, avec bruit de circulation, plus lentement.',
    draw: () => {
      const rise: Pt[] = [[30, 104], [60, 100], [90, 60], [116, 40]];
      const nature: Pt[] = [[116, 40], [150, 72], [190, 92], [240, 100], [300, 102]];
      const trafic: Pt[] = [[116, 40], [150, 52], [190, 66], [240, 80], [300, 90]];
      return (
        <g>
          <Axes y="activation" />
          <rect x={60} y={20} width={56} height={98} fill="currentColor" opacity={0.06} />
          <Label x={88} y={114} anchor="middle" dim={0.45}>stress</Label>
          <Label x={208} y={114} anchor="middle" dim={0.45}>récupération</Label>
          <path d={smooth(rise)} fill="none" stroke="currentColor" strokeWidth={1.5} />
          <path d={smooth(trafic)} fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.55} />
          <path d={smooth(nature)} fill="none" stroke="currentColor" strokeWidth={1.5} />
          <Key x={196} y={24}>nature</Key>
          <Key x={196} y={36} dashed>circulation</Key>
        </g>
      );
    },
  },
};

export function CardFigure({ id }: { id: CardId }) {
  const fig = FIGURES[id];
  if (!fig) return null;
  return (
    <figure className="pr-c-figure">
      <svg
        className="pr-c-svg"
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        role="img"
        aria-label={fig.label}
        focusable="false"
      >
        {fig.draw()}
      </svg>
      <figcaption className="pr-c-caption">Schéma illustratif, pas des données.</figcaption>
    </figure>
  );
}

/** Petites icônes 16 px devant les titres de section de la fiche. */
export function SectionIcon({ kind }: { kind: 'limits' | 'care' | 'sources' }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: 'false' as const,
    className: 'pr-c-icon',
  };
  if (kind === 'limits') {
    return (
      <svg {...common}>
        <circle cx={8} cy={8} r={6.25} />
        <path d="M8 7.2 V11.2" />
        <circle cx={8} cy={4.9} r={0.6} fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (kind === 'care') {
    return (
      <svg {...common}>
        <path d="M8 13.5 C5 11.4 2 9.2 2 6.1 C2 4.2 3.4 2.8 5.1 2.8 C6.4 2.8 7.4 3.5 8 4.6 C8.6 3.5 9.6 2.8 10.9 2.8 C12.6 2.8 14 4.2 14 6.1 C14 9.2 11 11.4 8 13.5 Z" />
        <path d="M8 6.2 V9.8 M6.2 8 H9.8" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M8 4.2 C6.6 3.2 4.6 2.8 2.2 3 V12.6 C4.6 12.4 6.6 12.8 8 13.8 C9.4 12.8 11.4 12.4 13.8 12.6 V3 C11.4 2.8 9.4 3.2 8 4.2 Z" />
      <path d="M8 4.2 V13.8" />
    </svg>
  );
}
