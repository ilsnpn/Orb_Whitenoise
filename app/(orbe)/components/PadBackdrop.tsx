'use client';

// Fond animé du pad « Prélude » : un motif monoline noir et blanc par mode,
// dérivé des figures de l'orbe (focus = Orbites, relax = Rubans, sleep = Anneau).
// Le motif réagit à la position du palet (lue à chaque image via getPos) ;
// l’encre est plus franche près du palet et palpite sur les battements (getPulse).
// Aucune allocation lourde par image : les tirages aléatoires sont faits une fois
// (PRNG à graine fixe), seuls deux petits dégradés sont recréés par image.

import { useEffect, useRef, type JSX } from 'react';
import type { ModeName } from '@/lib/audio/modes';
import type { PadPos } from '@/lib/prelude/types';

export interface PadBackdropProps {
  mode: ModeName;
  getPos: () => PadPos;
  getPulse: () => number;
  size: number;
}

const TAU = Math.PI * 2;
const FADE_MS = 500;
/** Alpha de l'encre loin du palet (au centre du halo elle vaut 1) : les alphas nominaux sont divisés par ça. */
const INK_FAR = 0.75;
/** Les motifs sont dessinés en blanc franc : les alphas nominaux sont multipliés par ça (plus de traits gris). */
const BOOST = 2.4;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const clamp1 = (v: number) => (v < -1 ? -1 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const smooth = (p: number) => p * p * (3 - 2 * p);

// ─── Tirages aléatoires (une fois, graine fixe) ──────────────────────────────

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x5eed1e);
const range = (lo: number, hi: number) => lo + (hi - lo) * rnd();

// Orbites
const ORB_N = 6;
const ORB_DOTS = 9;
const ORB_SEG = 90;
const ORB_TILT = (-12 * Math.PI) / 180;
const ORB_COS = Math.cos(ORB_TILT);
const ORB_SIN = Math.sin(ORB_TILT);
const ORB_TICS = 48;
const orbPh = Array.from({ length: ORB_N }, () => [range(0, TAU), range(0, TAU), range(0, TAU)]);
const orbStart = Array.from({ length: ORB_N }, () => range(0, TAU));
const dotJit = Array.from({ length: ORB_N }, () => Array.from({ length: ORB_DOTS }, () => range(-0.5, 0.5)));
const dotRate = Array.from({ length: ORB_N }, () => Array.from({ length: ORB_DOTS }, () => range(0.4, 1.3)));
const dotPh = Array.from({ length: ORB_N }, () => Array.from({ length: ORB_DOTS }, () => range(0, TAU)));

// Rubans
const RIB_N = 7;
const RIB_SEG = 56;
// les premiers rubans (visibles même en bas du pad) sont au milieu, les suivants s'écartent
const RIB_Y = [0.5, 0.32, 0.68, 0.2, 0.8, 0.41, 0.59];
interface Ribbon {
  y: number; lines: number;
  k1: number; k2: number; k3: number; k4: number;
  w1: number; w2: number; w3: number; w4: number;
  p1: number; p2: number; p3: number; p4: number; drift: number;
}
const ribbons: Ribbon[] = RIB_Y.map((y) => ({
  y: y + range(-0.03, 0.03),
  lines: 4 + Math.floor(rnd() * 3), // 4 à 6 lignes
  k1: TAU * range(0.55, 1.05), k2: TAU * range(1.2, 1.9), k3: TAU * range(0.35, 0.8), k4: TAU * range(1.5, 2.4),
  w1: range(0.18, 0.34), w2: range(0.1, 0.22), w3: range(0.12, 0.25), w4: range(0.2, 0.4),
  p1: range(0, TAU), p2: range(0, TAU), p3: range(0, TAU), p4: range(0, TAU), drift: range(0, TAU),
}));
const ribC = new Float32Array(RIB_SEG + 1); // tampons réutilisés : ligne centrale, largeur, cisaillement
const ribW = new Float32Array(RIB_SEG + 1);
const ribD = new Float32Array(RIB_SEG + 1);

// Anneau
const SEED_N = 150;
const TW_N = 40;
const seeds = Array.from({ length: SEED_N }, () => [rnd(), rnd(), range(0.05, 0.11)]);
const twinkles = Array.from({ length: TW_N }, () => [range(0.06, 0.94), range(0.06, 0.94), range(0.5, 1.4), range(0, TAU)]);

// ─── Dessin des motifs ───────────────────────────────────────────────────────

interface Clock {
  t: number;              // temps d'animation (figé si reduced-motion)
  orb: Float64Array;      // angle accumulé de chaque orbite
  ring: number;           // phase accumulée des anneaux
}

interface Frame {
  ctx: CanvasRenderingContext2D;
  s: number;              // côté en px CSS
  x: number; y: number;   // palet, [-1, 1]
  pulse: number;
  fade: number;           // alpha global du fondu croisé
  clk: Clock;
}

/** Fixe l'alpha d'un trait d'alpha nominal `a` (loin du palet). */
const alpha = (f: Frame, a: number) => {
  f.ctx.globalAlpha = Math.min(1, (f.fade * a * BOOST) / INK_FAR);
};

function drawOrbits(f: Frame) {
  const { ctx, s, x, y, clk } = f;
  const t = clk.t;
  const cx = s / 2, cy = s / 2;
  const irr = smooth(clamp01((0.6 - x) / 1.6)); // 1 à gauche (Fluide), 0 dès x ≥ 0.6 (Rythmé)
  const tic = smooth(clamp01((x - 0.15) / 0.7));
  const v = (y + 1) / 2;
  const nDots = 3 + 6 * v;

  let px = 0, py = 0;
  const pt = (i: number, a: number, b: number, th: number) => {
    const ph = orbPh[i];
    const wob = irr === 0 ? 0 : irr * 0.075 * (
      0.6 * Math.sin(2 * th + ph[0] + 0.35 * t) +
      0.4 * Math.sin(3 * th + ph[1] - 0.27 * t) +
      0.2 * Math.sin(5 * th + ph[2] + 0.5 * t));
    const ex = a * Math.cos(th) * (1 + wob);
    const ey = b * Math.sin(th) * (1 + wob);
    px = cx + ex * ORB_COS - ey * ORB_SIN;
    py = cy + ex * ORB_SIN + ey * ORB_COS;
  };

  ctx.lineWidth = 1;
  for (let i = 0; i < ORB_N; i++) {
    const a = s * (0.1 + 0.068 * i);
    const b = a * 0.6;
    alpha(f, i === ORB_N - 1 ? 0.2 : 0.13);
    ctx.beginPath();
    if (irr === 0) {
      ctx.ellipse(cx, cy, a, b, ORB_TILT, 0, TAU);
    } else {
      for (let k = 0; k <= ORB_SEG; k++) {
        pt(i, a, b, (k / ORB_SEG) * TAU);
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // points en orbite
    const base = clk.orb[i];
    const r = 1.6 * (1 + 0.024 * f.pulse);
    for (let k = 0; k < ORB_DOTS; k++) {
      const vis = clamp01(nDots - k);
      if (vis <= 0) break;
      const th = base + (TAU * k) / nDots +
        irr * (dotJit[i][k] * 1.3 + 0.55 * Math.sin(t * dotRate[i][k] + dotPh[i][k]));
      pt(i, a, b, th);
      alpha(f, 0.45 * vis);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, TAU);
      ctx.fill();
    }
  }

  // graduations sur l'ellipse extérieure, côté Rythmé
  if (tic > 0.01) {
    const i = ORB_N - 1;
    const a = s * (0.1 + 0.068 * i);
    const b = a * 0.6;
    alpha(f, 0.3 * tic);
    ctx.beginPath();
    for (let j = 0; j < ORB_TICS; j++) {
      pt(i, a, b, (j / ORB_TICS) * TAU);
      const dx = px - cx, dy = py - cy;
      const inv = 1 / (Math.hypot(dx, dy) || 1);
      const len = (j % 4 === 0 ? 6 : 3.5) * tic;
      ctx.moveTo(px, py);
      ctx.lineTo(px + dx * inv * len, py + dy * inv * len);
    }
    ctx.stroke();
  }
}

function drawRibbons(f: Frame) {
  const { ctx, s, x, y, clk } = f;
  const t = clk.t;
  const v = (y + 1) / 2;
  const u = (x + 1) / 2;
  const nRib = 2 + 5 * v;
  const amp = s * (0.025 + 0.085 * v);
  const width = s * 0.04;
  const la = 0.08 + 0.27 * u;
  const lis = smooth(clamp01(x));
  const x0 = -0.04 * s;
  const dx = (1.08 * s) / RIB_SEG;

  ctx.lineWidth = 1;
  for (let j = 0; j < RIB_N; j++) {
    const vis = clamp01(nRib - j);
    if (vis <= 0) break;
    const R = ribbons[j];
    const yc = s * (R.y + 0.015 * Math.sin(0.05 * t + R.drift));
    for (let k = 0; k <= RIB_SEG; k++) {
      const xs = k / RIB_SEG;
      ribC[k] = yc + amp * (Math.sin(R.k1 * xs + R.w1 * t + R.p1) + 0.45 * Math.sin(R.k2 * xs - R.w2 * t + R.p2));
      ribW[k] = width * Math.cos(R.k3 * xs + R.w3 * t + R.p3); // passe par 0 : le ruban se tord
      ribD[k] = s * 0.006 * Math.sin(R.k4 * xs - R.w4 * t + R.p4);
    }
    const m = R.lines;
    alpha(f, la * vis);
    ctx.beginPath();
    for (let l = 0; l < m; l++) {
      const fl = l / (m - 1) - 0.5;
      const gl = l / (m - 1);
      for (let k = 0; k <= RIB_SEG; k++) {
        const yy = ribC[k] + fl * ribW[k] + gl * ribD[k];
        if (k === 0) ctx.moveTo(x0, yy); else ctx.lineTo(x0 + k * dx, yy);
      }
    }
    ctx.stroke();

    if (lis > 0.01) {
      alpha(f, 0.4 * lis * vis);
      ctx.beginPath();
      for (let k = 0; k <= RIB_SEG; k++) {
        const yy = ribC[k] + 0.5 * ribD[k];
        if (k === 0) ctx.moveTo(x0, yy); else ctx.lineTo(x0 + k * dx, yy);
      }
      ctx.stroke();
    }
  }
}

function drawRings(f: Frame) {
  const { ctx, s, x, y, pulse, clk } = f;
  const t = clk.t;
  const u = (x + 1) / 2;
  const v = (y + 1) / 2;
  const cx = s / 2, cy = s / 2;

  // semis fixe, très discret
  for (let k = 0; k < SEED_N; k++) {
    const p = seeds[k];
    alpha(f, p[2]);
    ctx.fillRect(p[0] * s - 0.6, p[1] * s - 0.6, 1.2, 1.2);
  }

  // anneaux : naissent au centre, s'élargissent, s'estompent
  const spacing = s * lerp(0.04, 0.11, u);
  const rMax = 0.72 * s;
  const fadeIn = 0.06 * s;
  const base = lerp(0.34, 0.17, u) * (1 + 0.024 * pulse * v);
  const frac = clk.ring - Math.floor(clk.ring);
  ctx.lineWidth = lerp(0.8, 1.8, u);
  for (let k = 0; ; k++) {
    const r = (k + frac) * spacing;
    if (r >= rMax) break;
    const a = base * clamp01(r / fadeIn) * Math.pow(1 - r / rMax, 1.4);
    if (a < 0.004) continue;
    alpha(f, a);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.stroke();
  }
  ctx.lineWidth = 1;

  // points qui scintillent (Mélodies)
  const nTw = TW_N * v;
  const rTw = 1.1 + 0.05 * pulse;
  for (let k = 0; k < TW_N; k++) {
    const vis = clamp01(nTw - k);
    if (vis <= 0) break;
    const p = twinkles[k];
    const tw = 0.5 + 0.5 * Math.sin(t * p[2] + p[3]);
    alpha(f, vis * (0.06 + 0.3 * tw * tw + 0.012 * pulse));
    ctx.beginPath();
    ctx.arc(p[0] * s, p[1] * s, rTw, 0, TAU);
    ctx.fill();
  }
}

const DRAW: Record<ModeName, (f: Frame) => void> = {
  focus: drawOrbits,
  relax: drawRibbons,
  sleep: drawRings,
};

// ─── Composant ───────────────────────────────────────────────────────────────

export function PadBackdrop(props: PadBackdropProps): JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef(props);
  live.current = props;
  const { size } = props;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = canvas.height = Math.round(size * dpr);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let still = mq.matches;
    const onMq = (e: MediaQueryListEvent) => { still = e.matches; };
    mq.addEventListener('change', onMq);

    // créés une fois par taille : fond, et halo centré sur l'origine (déplacé par translate)
    const bg = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.72);
    bg.addColorStop(0, '#000');
    bg.addColorStop(1, '#000');
    const haloR = size * 0.4;

    const clk: Clock = { t: 0, orb: Float64Array.from(orbStart), ring: 0.35 };
    const frame: Frame = { ctx, s: size, x: 0, y: 0, pulse: 0, fade: 1, clk };
    let shown: ModeName = live.current.mode;
    let prev: ModeName | null = null;
    let fadeStart = 0;
    let last = performance.now();
    let raf = 0;

    const loop = () => {
      const p = live.current;
      const now = performance.now();
      const dt = still ? 0 : Math.min(0.1, (now - last) / 1000);
      last = now;

      const pos = p.getPos();
      const x = clamp1(pos.x || 0);
      const y = clamp1(pos.y || 0);
      const pulse = clamp01(p.getPulse() || 0);

      // horloges (toutes avancent, pour qu'un fondu croisé reste fluide)
      clk.t += dt;
      const speedMul = 0.4 * Math.pow(5, (y + 1) / 2); // ×0.4 (Posé) → ×2 (Vif)
      for (let i = 0; i < ORB_N; i++) clk.orb[i] += dt * speedMul * (0.42 / (1 + 0.45 * i));
      const u = (x + 1) / 2;
      const breath = 1 + 0.35 * Math.sin((TAU * clk.t) / 7);
      clk.ring += (dt * breath * lerp(0.065, 0.028, u)) / lerp(0.04, 0.11, u); // en anneaux par seconde

      if (p.mode !== shown) {
        prev = shown; // un fondu en cours est remplacé par le nouveau
        shown = p.mode;
        fadeStart = now;
      }
      let e = 1;
      if (prev) {
        const raw = still ? 1 : (now - fadeStart) / FADE_MS;
        if (raw >= 1) prev = null; else e = smooth(raw);
      }

      const sx = ((x + 1) / 2) * size;
      const sy = ((1 - y) / 2) * size;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);

      // encre blanche plus lumineuse près du palet
      const ink = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloR);
      ink.addColorStop(0, '#ffffff');
      ink.addColorStop(1, `rgba(255,255,255,${INK_FAR})`);
      ctx.strokeStyle = ink;
      ctx.fillStyle = ink;
      frame.x = x; frame.y = y; frame.pulse = pulse;
      if (prev) {
        frame.fade = 1 - e;
        DRAW[prev](frame);
      }
      frame.fade = e;
      DRAW[shown](frame);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener('change', onMq);
    };
  }, [size]);

  return <canvas ref={ref} aria-hidden="true" style={{ width: size, height: size, display: 'block' }} />;
}
