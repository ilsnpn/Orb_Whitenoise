'use client';

// Version maniaque : plus de guide, tout se règle à la main. Même disposition que
// l'écoute (panneau repliable à gauche ou à droite, orbe au centre) et même moteur ;
// on retrouve ici les trois orbes du début, cliquables pour choisir l'ambiance.
// Ce que fait chaque curseur est expliqué dessous (masquable). La couleur du bruit
// (white / pink / brown) n'est plus proposée : tout reste blanc.
import type { ReactNode } from 'react';
import type { Mix, ModeName } from '@/lib/audio/modes';
import { useSound } from '@/lib/prelude/soundscape-context';
import type { Pomodoro } from '@/lib/prelude/use-pomodoro';
import { MODE_MORPH_SECONDS } from '@/lib/ui/use-soundscape';
import { AUTO_HINT, HINTS, MIX_HINTS, MIX_LABELS, fmtHour, pct } from '@/lib/ui/texts';
import { DayStrip } from './DayStrip';
import { IconBack, IconClock, IconSpeaker } from './icons';
import { PANEL_W, SidePanel } from './SidePanel';
import { PomoRow, Stage } from './Stage';
import { ModeOrbs } from './ModeOrbs';
import { useViewport } from './use-viewport';
import './listen.css';
import './manual.css';


export function Manual(props: {
  pomodoro: Pomodoro;
  onChooseMode: (m: ModeName) => void;
  onBack: () => void;
}) {
  const vp = useViewport();
  const wide = vp.w >= 900 && vp.h >= 560;
  const panel = <Controls {...props} wide={wide} vp={vp} />;

  if (wide) {
    return (
      <SidePanel panel={panel}>
        {(open) => (
          <Stage px={Math.round(Math.max(320, Math.min((vp.h - 40) * 1.2, (vp.w - (open ? PANEL_W : 0)) * 1.05, 1300)))} pomodoro={props.pomodoro} />
        )}
      </SidePanel>
    );
  }
  const orbPx = Math.round(Math.max(260, Math.min(vp.w - 8, vp.h * 0.5, 520)));
  return (
    <section className="pr-screen pr-l pr-m-narrow">
      <Stage px={orbPx} pomodoro={props.pomodoro} />
      {panel}
    </section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pr-m-sec">
      <h3 className="pr-kicker">{title}</h3>
      {children}
    </section>
  );
}

function Field(props: {
  label: string; value: number; min: number; max: number; step?: number;
  display: string; hint?: string; show: boolean; onChange: (v: number) => void;
}) {
  return (
    <label className="pr-m-field">
      <span className="pr-m-field-head">{props.label}<b>{props.display}</b></span>
      <input type="range" min={props.min} max={props.max} step={props.step ?? 0.01} value={props.value}
        onChange={(e) => props.onChange(+e.target.value)} />
      {props.show && props.hint ? <small className="pr-m-hint">{props.hint}</small> : null}
    </label>
  );
}

function Controls({ wide, vp, pomodoro, onChooseMode, onBack }: {
  wide: boolean; vp: { w: number; h: number };
  pomodoro: Pomodoro; onChooseMode: (m: ModeName) => void; onBack: () => void;
}) {
  const s = useSound();
  const { base, effective, mode } = s;
  const orbPx = Math.round(wide ? 96 : Math.max(100, Math.min((Math.min(vp.w, 440) - 40) / 3, 140)));
  const shifted = (k: 'tempo' | 'dynamism' | 'brightness') =>
    s.auto && effective[k] !== base[k]
      ? ` → ${k === 'tempo' ? `${effective.tempo} BPM` : pct(effective[k])}`
      : '';

  return (
    <div className="pr-m">
      <header className="pr-m-head">
        <button type="button" className="pr-m-back" onClick={onBack}><IconBack size={16} /> Retour au guide</button>
        <h2 className="pr-title">Version maniaque</h2>
      </header>

      <Section title="Ambiance">
        <ModeOrbs px={orbPx} onChoose={onChooseMode} />
        {s.showHints ? (
          <small className="pr-m-hint">Changer d’ambiance pendant la lecture fait un fondu de {MODE_MORPH_SECONDS} s et remet les réglages du mode. {HINTS.orb}</small>
        ) : null}
      </Section>

      <Section title="Son">
        <Field label="Tempo" min={40} max={130} step={1} value={base.tempo} show={s.showHints}
          display={`${base.tempo} BPM${shifted('tempo')}`} onChange={(v) => s.update({ tempo: v })} hint={HINTS.tempo} />
        <Field label="Grave ↔ Aigu" min={-12} max={12} step={1} value={base.register} show={s.showHints}
          display={`${base.register > 0 ? '+' : ''}${base.register} demi-tons`}
          onChange={(v) => s.update({ register: v })} hint={HINTS.register} />
        <Field label="Statique ↔ Dynamique" min={0} max={1} value={base.dynamism} show={s.showHints}
          display={`${pct(base.dynamism)}${shifted('dynamism')}`} onChange={(v) => s.update({ dynamism: v })} hint={HINTS.dynamism} />
        <Field label="Sombre ↔ Brillant" min={0} max={1} value={base.brightness} show={s.showHints}
          display={`${pct(base.brightness)}${shifted('brightness')}`} onChange={(v) => s.update({ brightness: v })} hint={HINTS.brightness} />
      </Section>

      <Section title="Couches">
        {(Object.keys(MIX_LABELS) as (keyof Mix)[]).map((k) => (
          <Field key={k} label={MIX_LABELS[k]} min={0} max={1} value={base.mix[k]} show={s.showHints}
            display={pct(base.mix[k])} hint={MIX_HINTS[k]}
            onChange={(v) => s.update({ mix: { ...base.mix, [k]: v } })} />
        ))}
      </Section>

      <Section title="Pomodoro">
        <PomoRow pomodoro={pomodoro} />
      </Section>

      <Section title="Heure de la journée">
        <label className="pr-l-switch">
          <IconClock />
          <span>Suivre l’heure · énergie {pct(s.energy)} à {fmtHour(s.hour)}</span>
          <input type="checkbox" role="switch" checked={s.auto} onChange={(e) => s.setAuto(e.target.checked)} />
          <span className="pr-l-switch-track" aria-hidden="true" />
        </label>
        {s.showHints ? <small className="pr-m-hint">{AUTO_HINT}</small> : null}
        <DayStrip hour={s.hour} active={s.auto} />
        {s.auto ? (
          <>
            <Field label="Simuler une heure" min={0} max={23.75} step={0.25} value={s.hour} show={s.showHints}
              display={s.simHour === null ? `maintenant (${fmtHour(s.hour)})` : fmtHour(s.hour)}
              onChange={(v) => s.setSimHour(v)} hint={HINTS.simHour} />
            {s.simHour !== null ? (
              <button type="button" className="pr-link" onClick={() => s.setSimHour(null)}>Revenir à l’heure réelle</button>
            ) : null}
          </>
        ) : null}
      </Section>

      <Section title="Volume">
        <label className="pr-l-row">
          <IconSpeaker />
          <input type="range" min={0} max={1} step={0.01} value={s.volume}
            onChange={(e) => s.setVolume(+e.target.value)} aria-label="Volume" aria-valuetext={pct(s.volume)} />
        </label>
      </Section>

      <button type="button" className="pr-link pr-m-hints" onClick={s.toggleHints}>
        {s.showHints ? 'Masquer les explications' : 'Afficher les explications'}
      </button>
    </div>
  );
}
