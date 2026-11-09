'use client';

// Écran d'écoute de la v2.
// Ordinateur : panneau à gauche (ou à droite, repliable), l'orbe occupe le centre ; rien ne défile.
// Téléphone : tout en colonne, l'orbe en tête.
import { useState } from 'react';
import type { ModeName } from '@/lib/audio/modes';
import { useSound } from '@/lib/prelude/soundscape-context';
import type { PadPos } from '@/lib/prelude/types';
import type { Pomodoro } from '@/lib/prelude/use-pomodoro';
import { pct } from '@/lib/ui/texts';
import { DayStrip } from './DayStrip';
import { REPO_URL } from '@/lib/prelude/links';
import { IconBook, IconClock, IconCompass, IconGithub, IconSliders, IconSpeaker } from './icons';
import { ModeOrbs } from './ModeOrbs';
import { Pad } from './Pad';
import { PANEL_W, SidePanel } from './SidePanel';
import { PomoRow, Stage } from './Stage';
import { useViewport } from './use-viewport';
import './listen.css';

interface ListenProps {
  pad: PadPos;
  pomodoro: Pomodoro;
  onChooseMode: (m: ModeName) => void;
  onFollowDay: (on: boolean) => void;
  onPadMove: (p: PadPos) => void;
  onPadCommit: (p: PadPos) => void;
  onStudies: () => void;
  onOrient: () => void;
  onManual: () => void;
}
type Inner = ListenProps & { vp: { w: number; h: number }; openManual: () => void };

export function Listen(props: ListenProps) {
  const vp = useViewport();
  const [maniac, setManiac] = useState(false);

  const wide = vp.w >= 900 && vp.h >= 560;
  return (
    <>
      {wide
        ? <Wide {...props} vp={vp} openManual={() => setManiac(true)} />
        : <Narrow {...props} vp={vp} openManual={() => setManiac(true)} />}

      {maniac ? (
        <div className="pr-l-modal" role="dialog" aria-modal="true" aria-labelledby="pr-maniac-title"
          onClick={(e) => e.target === e.currentTarget && setManiac(false)}>
          <div className="pr-l-modal-box">
            <IconSliders size={36} />
            <h2 id="pr-maniac-title" className="pr-title">Version maniaque</h2>
            <p>Ici, vous n’êtes plus guidé. Vous êtes maître de tout : chaque réglage du moteur est à portée de main, et vous voyez ce que fait chacun.</p>
            <button type="button" className="pr-btn" onClick={() => { setManiac(false); props.onManual(); }}>
              Ouvrir la version maniaque
            </button>
            <button type="button" className="pr-link" onClick={() => setManiac(false)} autoFocus>Rester guidé</button>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Les blocs du panneau, dans l'ordre : ambiance, explication + pad + volume, Pomodoro, journée, liens. */
function Blocks({ props, padPx, orbPx }: { props: Inner; padPx: number; orbPx: number }) {
  const s = useSound();
  return (
    <>
      {/* en haut : les trois ambiances, collées en haut */}
      <div className="pr-pn-top"><ModeOrbs px={orbPx} onChoose={props.onChooseMode} /></div>

      {/* au milieu : trois blocs qui se répartissent la hauteur restante */}
      <div className="pr-pn-mid">
        <section className="pr-sec">
          <Pad mode={s.mode} pos={props.pad} size={padPx} onMove={props.onPadMove} onCommit={props.onPadCommit} />
          <label className="pr-l-row">
            <IconSpeaker size={22} />
            <input type="range" min={0} max={1} step={0.01} value={s.volume}
              onChange={(e) => s.setVolume(+e.target.value)} aria-label="Volume" aria-valuetext={pct(s.volume)} />
          </label>
        </section>

        <section className="pr-sec"><PomoRow pomodoro={props.pomodoro} /></section>

        <section className="pr-sec">
          <label className="pr-l-switch">
            <IconClock size={20} />
            <span>Suivre la journée</span>
            <input type="checkbox" role="switch" checked={s.auto} onChange={(e) => props.onFollowDay(e.target.checked)} />
            <span className="pr-l-switch-track" aria-hidden="true" />
          </label>
          <DayStrip hour={s.hour} active={s.auto} />
        </section>
      </div>

      {/* en bas : les liens, collés en bas */}
      <nav className="pr-pn-bot pr-l-links">
        <button type="button" className="pr-l-link" onClick={props.onStudies}><IconBook size={26} /> Les études</button>
        <button type="button" className="pr-l-link" onClick={props.onOrient}><IconCompass size={26} /> M’orienter</button>
        <button type="button" className="pr-l-link" onClick={props.openManual}><IconSliders size={26} /> Version maniaque</button>
        <a className="pr-l-link" href={REPO_URL} target="_blank" rel="noopener noreferrer">
          <IconGithub size={26} /> Projet open source
        </a>
      </nav>
    </>
  );
}

function Wide(props: Inner) {
  const { vp } = props;
  const padPx = Math.round(Math.max(170, Math.min(PANEL_W - 64, vp.h - 855)));
  return (
    <SidePanel panel={<Blocks props={props} padPx={padPx} orbPx={88} />}>
      {(open) => (
        // l'orbe prend toute la place laissée par le panneau (toute la fenêtre s'il est replié)
        <Stage px={Math.round(Math.max(320, Math.min((vp.h - 40) * 1.2, (vp.w - (open ? PANEL_W : 0)) * 1.05, 1300)))} pomodoro={props.pomodoro} />
      )}
    </SidePanel>
  );
}

function Narrow(props: Inner) {
  const { vp } = props;
  const orbPx = Math.round(Math.max(260, Math.min(vp.w - 8, vp.h * 0.55, 520)));
  const padPx = Math.round(Math.max(220, Math.min(Math.min(vp.w, 440) - 40, 400)));
  const modePx = Math.round(Math.max(100, Math.min((Math.min(vp.w, 440) - 40) / 3, 140)));
  return (
    <section className="pr-screen pr-l">
      <Stage px={orbPx} pomodoro={props.pomodoro} />
      <Blocks props={props} padPx={padPx} orbPx={modePx} />
    </section>
  );
}
