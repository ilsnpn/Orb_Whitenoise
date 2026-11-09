'use client';

// L'orbe en points, adaptée de ilsnpn/orb (moteur : thinking-orbs, MIT).
// Un changement d'ambiance ou de densité fait glisser chaque point vers son
// partenaire dans la nouvelle forme ; les battements la font palpiter.

import { useEffect, useRef } from 'react';
import type { Dot, OrbFrame } from '@/lib/orb/engine/core';
import { MODE_FRAMES } from '@/lib/orb/engine/registry';
import { resolvePreset, type Resolved } from '@/lib/orb/engine/presets';
import { scaleCounts, scaleRadii } from '@/lib/orb/engine/profiles';
import type { OrbState } from '@/lib/orb/engine/orb-types';

const BASE = 64;
const MORPH_MS = 1600;
const PULL = 0.12; // contraction vers le centre à mi-fondu
const DOT_SIZE = 0.72;

type Rgb = [number, number, number];

export interface OrbLook {
  state: OrbState;
  density: number;
}

const sameLook = (a: OrbLook, b: OrbLook) => a.state === b.state && a.density === b.density;

const cache = new Map<string, Resolved>();
function resolveLook({ state, density }: OrbLook): Resolved {
  const key = `${state}-${density}`;
  let hit = cache.get(key);
  if (!hit) {
    const base = resolvePreset(state, BASE);
    hit = { ...base, opts: scaleRadii(scaleCounts(base.opts, density), DOT_SIZE) };
    cache.set(key, hit);
  }
  return hit;
}

function frameOf(look: OrbLook, phase: number): OrbFrame {
  const { mode, speed, opts } = resolveLook(look);
  return MODE_FRAMES[mode](BASE, phase * speed, opts);
}

const angle = (d: Dot) => Math.atan2(d.y - BASE / 2, d.x - BASE / 2);

/** Apparie les points de deux images par angle autour du centre (une fois, au début du fondu). */
function pairUp(a: OrbFrame, b: OrbFrame): Array<[number, number]> {
  const sa = [...a.dots].sort((p, q) => angle(p) - angle(q));
  const sb = [...b.dots].sort((p, q) => angle(p) - angle(q));
  const n = Math.max(sa.length, sb.length);
  const pairs: Array<[number, number]> = [];
  for (let k = 0; k < n; k++) {
    pairs.push([sa[Math.floor((k * sa.length) / n)].id!, sb[Math.floor((k * sb.length) / n)].id!]);
  }
  return pairs;
}

const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const lerpRgb = (a: Rgb, b: Rgb, p: number): Rgb => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];

function blend(a: OrbFrame, b: OrbFrame, pairs: Array<[number, number]>, p: number): OrbFrame {
  const byA = new Map(a.dots.map((d) => [d.id, d]));
  const byB = new Map(b.dots.map((d) => [d.id, d]));
  const pull = 1 - PULL * Math.sin(Math.PI * p);
  const dots: Dot[] = [];
  for (const [ia, ib] of pairs) {
    const da = byA.get(ia);
    const db = byB.get(ib);
    if (!da && !db) continue;
    const from = da ?? { ...db!, a: 0 };
    const to = db ?? { ...da!, a: 0 };
    const x = lerp(from.x, to.x, p);
    const y = lerp(from.y, to.y, p);
    dots.push({
      x: BASE / 2 + (x - BASE / 2) * pull,
      y: BASE / 2 + (y - BASE / 2) * pull,
      z: lerp(from.z, to.z, p),
      r: lerp(from.r, to.r, p),
      white: lerp(from.white, to.white, p),
      a: lerp(from.a ?? 1, to.a ?? 1, p),
    });
  }
  dots.sort((d, e) => d.z - e.z);
  return { dots, lines: [] };
}

interface Ink { near: Rgb; far: Rgb; glow: number }

function paint(ctx: CanvasRenderingContext2D, frame: OrbFrame, ink: Ink, fade = 1) {
  const color = (white: number, alpha: number) => {
    const w = Math.min(1, Math.max(0, white));
    const c = (i: number) => Math.round(lerp(ink.near[i] * ink.glow, ink.far[i], w));
    return `rgba(${c(0)},${c(1)},${c(2)},${alpha})`;
  };
  for (const l of frame.lines) {
    ctx.strokeStyle = color(l.white, (l.a ?? 1) * fade);
    ctx.lineWidth = l.w;
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
  }
  for (const d of frame.dots) {
    ctx.fillStyle = color(d.white, d.a ?? 1);
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

interface Morph { from: OrbLook; to: OrbLook; start: number; pairs: Array<[number, number]> }

export interface OrbProps {
  look: OrbLook;
  speed: number;       // multiplicateur de vitesse d'animation
  near: Rgb;
  far: Rgb;
  glow: number;        // 0…1, luminosité de l'encre
  pulse: () => number; // enveloppe des battements 0…1
  px: number;
}

export function Orb(props: OrbProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef({ props, shown: props.look, morph: null as Morph | null, ink: { near: props.near, far: props.far, glow: props.glow } });
  live.current.props = props;

  useEffect(() => {
    const canvas = ref.current!;
    const dpr = Math.min(3, devicePixelRatio || 1);
    canvas.width = canvas.height = Math.round(props.px * dpr);
    const ctx = canvas.getContext('2d')!;
    const scale = (props.px / BASE) * dpr;
    let raf = 0;
    let phase = 0; // horloge d'animation accumulée : la vitesse peut changer sans saut
    let last = performance.now();
    let breath = 0;

    const loop = () => {
      const s = live.current;
      const p = s.props;
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      phase += dt * p.speed;
      breath += dt * p.speed * 0.6;

      // l'encre glisse vers la teinte de l'ambiance
      const k = 1 - Math.exp(-dt * 1.5);
      s.ink = { near: lerpRgb(s.ink.near, p.near, k), far: lerpRgb(s.ink.far, p.far, k), glow: lerp(s.ink.glow, p.glow, k) };

      if (!s.morph && !sameLook(p.look, s.shown)) {
        s.morph = { from: s.shown, to: p.look, start: now, pairs: pairUp(frameOf(s.shown, phase), frameOf(p.look, phase)) };
      }

      // respiration lente + palpitation sur les battements, autour du centre
      const zoom = 1 + 0.025 * Math.sin(breath) + 0.005 * p.pulse();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const z = scale * zoom;
      const off = (canvas.width - BASE * z) / 2;
      ctx.setTransform(z, 0, 0, z, off, off);

      if (s.morph) {
        const raw = Math.min(1, (now - s.morph.start) / MORPH_MS);
        const e = ease(raw);
        const a = frameOf(s.morph.from, phase);
        const b = frameOf(s.morph.to, phase);
        paint(ctx, { dots: [], lines: a.lines }, s.ink, 1 - e);
        paint(ctx, { dots: [], lines: b.lines }, s.ink, e);
        paint(ctx, blend(a, b, s.morph.pairs, e), s.ink);
        if (raw >= 1) {
          s.shown = s.morph.to;
          s.morph = null;
        }
      } else {
        paint(ctx, frameOf(s.shown, phase), s.ink);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [props.px]);

  return <canvas ref={ref} style={{ width: props.px, height: props.px, display: 'block', margin: '0 auto' }} />;
}
