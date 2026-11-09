'use client';

// Le pad, intégré à l'écran d'écoute : un carré où l'on fait glisser un palet.
// Chaîne : geste → position (x, y) → padPatch() → moteur audio (via onMove)
//          → paramètres effectifs → orbDrive → grande orbe.
// Le palet est déplacé hors React (style direct) ; le moteur est mis à jour au
// plus une fois par image.

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import type { ModeName } from '@/lib/audio/modes';
import { CENTER, PAD_HINT, PAD_LABELS, clampPos } from '@/lib/prelude/pad-map';
import { useSound } from '@/lib/prelude/soundscape-context';
import type { PadPos } from '@/lib/prelude/types';
import { PadBackdrop } from './PadBackdrop';
import './pad.css';

const PUCK = 34;          // diamètre du palet (px) : un gros point blanc
const KEY_STEP = 0.1;

export interface PadProps {
  mode: ModeName;
  pos: PadPos;
  onMove: (p: PadPos) => void;   // en continu pendant le geste (≤ 1 fois par image)
  onCommit: (p: PadPos) => void; // en fin de geste : c'est là qu'on mémorise
  size: number;                  // côté du pad (px)
}

export function Pad({ mode, pos, onMove, onCommit, size }: PadProps) {
  const s = useSound();

  const padRef = useRef<HTMLDivElement>(null);
  const puckRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(pos);
  const cb = useRef({ onMove, onCommit });
  cb.current = { onMove, onCommit };
  const frame = useRef(0);
  const dragging = useRef(false);

  /** Place le palet. Il grossit vers le haut (plus d'énergie), son anneau s'épaissit vers la droite. */
  const place = (p: PadPos) => {
    const el = puckRef.current;
    if (!el) return;
    const px = ((p.x + 1) / 2) * size;
    const py = ((1 - p.y) / 2) * size;
    el.style.transform = `translate(${px - PUCK / 2}px, ${py - PUCK / 2}px)`;
  };

  const flush = () => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    cb.current.onMove(posRef.current);
  };

  const move = (p: PadPos) => {
    posRef.current = p;
    place(p);
    if (!frame.current) {
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        cb.current.onMove(posRef.current);
      });
    }
  };

  const commit = () => {
    flush();
    cb.current.onCommit(posRef.current);
  };

  // position imposée par le parent (changement de mode, recentrage, taille)
  useEffect(() => {
    posRef.current = pos;
    place(pos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos.x, pos.y, size]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const fromEvent = (e: PointerEvent) => {
    const r = padRef.current!.getBoundingClientRect();
    return clampPos({
      x: ((e.clientX - r.left) / r.width) * 2 - 1,
      y: 1 - ((e.clientY - r.top) / r.height) * 2,
    });
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    move(fromEvent(e));
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) move(fromEvent(e));
  };

  const onPointerEnd = () => {
    if (!dragging.current) return;
    dragging.current = false;
    commit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? KEY_STEP * 2.5 : KEY_STEP;
    const p = posRef.current;
    const next =
      e.key === 'ArrowUp' ? { x: p.x, y: p.y + step } :
      e.key === 'ArrowDown' ? { x: p.x, y: p.y - step } :
      e.key === 'ArrowLeft' ? { x: p.x - step, y: p.y } :
      e.key === 'ArrowRight' ? { x: p.x + step, y: p.y } :
      e.key === 'Home' || e.key === '0' ? CENTER : null;
    if (!next) return;
    e.preventDefault();
    move(clampPos(next));
    commit();
  };

  const labels = PAD_LABELS[mode];

  return (
    <div className="pr-pad-wrap">
      <p className="pr-muted pr-pad-tip" id="pr-pad-hint">
        {PAD_HINT[mode]}
      </p>
      <div
        ref={padRef}
        className="pr-pad"
        style={{ width: size, height: size }}
        tabIndex={0}
        role="group"
        aria-label={`Pad : de ${labels.bottom} à ${labels.top} en hauteur, de ${labels.left} à ${labels.right} en largeur. Flèches pour déplacer, 0 pour recentrer.`}
        aria-describedby="pr-pad-hint"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
      >
        <PadBackdrop mode={mode} getPos={() => posRef.current} getPulse={s.pulse} size={size} />
        <span className="pr-pad-label pr-pad-label--top" aria-hidden="true">{labels.top}</span>
        <span className="pr-pad-label pr-pad-label--bottom" aria-hidden="true">{labels.bottom}</span>
        <span className="pr-pad-label pr-pad-label--left" aria-hidden="true">{labels.left}</span>
        <span className="pr-pad-label pr-pad-label--right" aria-hidden="true">{labels.right}</span>
        <div ref={puckRef} className="pr-pad-puck" aria-hidden="true" />
      </div>

    </div>
  );
}
