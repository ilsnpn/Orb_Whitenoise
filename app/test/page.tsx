'use client';

import { useEffect, useState } from 'react';
import { MODES, type Mix, type NoiseKind } from '@/lib/audio/modes';
import { FIGURES, MOODS, figureName } from '@/lib/orb/moods';
import { MODE_MORPH_SECONDS, MODE_NAMES, useSoundscape } from '@/lib/ui/use-soundscape';
import { AUTO_HINT, HINTS, MIX_HINTS, MIX_LABELS, NOISE_HINT, fmtHour, pct } from '@/lib/ui/texts';
import { Orb } from '../orb';

const NOISE_KINDS: NoiseKind[] = ['white', 'pink', 'brown'];
const PANEL_WIDTH = 400;

const hintStyle = { fontSize: 12, opacity: 0.55, lineHeight: 1.4, margin: 0 } as const;
const fieldsetStyle = { display: 'grid', gap: 14, border: '1px solid #333', borderRadius: 8 } as const;

// Panneau à gauche, orbe au centre ; empilés sur petit écran.
const LAYOUT_CSS = `
  .wn-layout { display: flex; height: 100dvh; }
  .wn-panel { width: ${PANEL_WIDTH}px; flex-shrink: 0; overflow-y: auto; box-sizing: border-box;
    padding: 24px; display: grid; gap: 22px; align-content: start; border-right: 1px solid #222; }
  .wn-stage { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 24px; padding: 24px; min-width: 0; }
  .no-hints .wn-hint { display: none; }
  @media (max-width: 800px) {
    .wn-layout { flex-direction: column-reverse; height: auto; }
    .wn-panel { width: 100%; border-right: none; border-top: 1px solid #222; }
    .wn-stage { min-height: 90dvh; }
  }
`;

function Slider(props: {
  label: string; value: number; min: number; max: number; step?: number;
  display?: string; hint?: string; onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
        {props.label}
        <span style={{ opacity: 0.6 }}>{props.display ?? props.value}</span>
      </span>
      <input
        type="range" min={props.min} max={props.max} step={props.step ?? 0.01} value={props.value}
        onChange={(e) => props.onChange(+e.target.value)}
      />
      {props.hint && <p className="wn-hint" style={hintStyle}>{props.hint}</p>}
    </label>
  );
}

/** Taille de l'orbe : la plus grande qui tient dans la zone centrale. */
function useOrbSize() {
  const [px, setPx] = useState(400);
  useEffect(() => {
    const measure = () => {
      const narrow = innerWidth <= 800;
      const w = narrow ? innerWidth : innerWidth - PANEL_WIDTH;
      setPx(Math.round(Math.max(220, Math.min(w * 0.85, innerHeight * 0.7, 820))));
    };
    measure();
    addEventListener('resize', measure);
    return () => removeEventListener('resize', measure);
  }, []);
  return px;
}

export default function Home() {
  const s = useSoundscape();
  const { base, effective, mode, drive, playing } = s;
  const orbPx = useOrbSize();

  const shifted = (k: 'tempo' | 'dynamism' | 'brightness') =>
    s.auto && effective[k] !== base[k]
      ? ` → ${k === 'tempo' ? `${effective.tempo} BPM` : pct(effective[k])} avec l'heure`
      : '';

  return (
    <div className={`wn-layout${s.showHints ? '' : ' no-hints'}`}>
      <style>{LAYOUT_CSS}</style>

      <aside className="wn-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontWeight: 500, margin: 0 }}>Whitenoise</h1>
          <button onClick={s.toggleHints} style={{ padding: '6px 10px', fontSize: 12 }}>
            {s.showHints ? 'Masquer les explications' : 'Afficher les explications'}
          </button>
        </div>
        <a href="/hairline" style={{ ...hintStyle, color: 'inherit' }}>→ Version hairline</a>

        <section style={{ display: 'grid', gap: 8 }}>
          <strong style={{ fontSize: 14 }}>Ambiance : {MODES[mode].label}</strong>
          <p className="wn-hint" style={hintStyle}>
            {MODES[mode].description} Changer d&apos;ambiance pendant la lecture fait un fondu de {MODE_MORPH_SECONDS} s.
          </p>
          <p className="wn-hint" style={hintStyle}>Orbe : {MOODS[mode].description} {HINTS.orb}</p>
        </section>

        <fieldset style={fieldsetStyle}>
          <legend>Figure de l&apos;orbe</legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            <button onClick={() => s.setFigure(null)}
              style={{ padding: 6, fontSize: 12, fontWeight: s.figure === null ? 700 : 400 }}>Auto</button>
            {FIGURES.map((f) => (
              <button key={f.state} onClick={() => s.setFigure(f.state)}
                style={{ padding: 6, fontSize: 12, fontWeight: s.figure === f.state ? 700 : 400 }}>{f.name}</button>
            ))}
          </div>
          <p className="wn-hint" style={hintStyle}>
            Auto = la figure liée à l&apos;ambiance ({figureName(MOODS[mode].state)}). Les autres l&apos;imposent quelle que soit l&apos;ambiance.
          </p>
        </fieldset>

        <fieldset style={fieldsetStyle}>
          <legend>Heure de la journée</legend>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
            <input type="checkbox" checked={s.auto} onChange={(e) => s.setAuto(e.target.checked)} />
            Suivre l&apos;heure — énergie {pct(s.energy)} à {fmtHour(s.hour)}
          </label>
          <p className="wn-hint" style={hintStyle}>{AUTO_HINT}</p>
          {s.auto && (
            <>
              <Slider label="Simuler une heure" min={0} max={23.75} step={0.25} value={s.hour}
                display={s.simHour === null ? `maintenant (${fmtHour(s.hour)})` : fmtHour(s.hour)}
                onChange={(v) => s.setSimHour(v)} hint={HINTS.simHour} />
              {s.simHour !== null && (
                <button onClick={() => s.setSimHour(null)} style={{ padding: 8 }}>Revenir à l&apos;heure réelle</button>
              )}
            </>
          )}
        </fieldset>

        <fieldset style={fieldsetStyle}>
          <legend>Son</legend>
          <Slider label="Tempo" min={40} max={130} step={1} value={base.tempo}
            display={`${base.tempo} BPM${shifted('tempo')}`} onChange={(v) => s.update({ tempo: v })}
            hint={HINTS.tempo} />
          <Slider label="Grave ↔ Aigu" min={-12} max={12} step={1} value={base.register}
            display={`${base.register > 0 ? '+' : ''}${base.register} demi-tons`}
            onChange={(v) => s.update({ register: v })} hint={HINTS.register} />
          <Slider label="Statique ↔ Dynamique" min={0} max={1} value={base.dynamism}
            display={`${pct(base.dynamism)}${shifted('dynamism')}`} onChange={(v) => s.update({ dynamism: v })}
            hint={HINTS.dynamism} />
          <Slider label="Sombre ↔ Brillant" min={0} max={1} value={base.brightness}
            display={`${pct(base.brightness)}${shifted('brightness')}`} onChange={(v) => s.update({ brightness: v })}
            hint={HINTS.brightness} />
        </fieldset>

        <fieldset style={fieldsetStyle}>
          <legend>Couches</legend>
          {(Object.keys(MIX_LABELS) as (keyof Mix)[]).map((k) => (
            <Slider key={k} label={MIX_LABELS[k]} min={0} max={1} value={base.mix[k]}
              display={pct(base.mix[k])} hint={MIX_HINTS[k]}
              onChange={(v) => s.update({ mix: { ...base.mix, [k]: v } })} />
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            {NOISE_KINDS.map((k) => (
              <button key={k} onClick={() => s.update({ noiseKind: k })}
                style={{ flex: 1, padding: 8, fontWeight: k === base.noiseKind ? 700 : 400 }}>
                {k}
              </button>
            ))}
          </div>
          <p className="wn-hint" style={hintStyle}>{NOISE_HINT}</p>
        </fieldset>
      </aside>

      <main className="wn-stage">
        <Orb
          look={{ state: s.orbState, density: drive.density }}
          speed={playing ? drive.speed : drive.speed * 0.3}
          near={MOODS[mode].near}
          far={MOODS[mode].far}
          glow={playing ? drive.glow : drive.glow * 0.6}
          pulse={s.pulse}
          px={orbPx}
        />

        <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 420 }}>
          {MODE_NAMES.map((m) => (
            <button key={m} onClick={() => s.chooseMode(m)}
              style={{ flex: 1, padding: 12, fontWeight: m === mode ? 700 : 400 }}>
              {MODES[m].label}
            </button>
          ))}
        </div>

        <button onClick={s.toggle} style={{ padding: '14px 48px', fontSize: 18 }}>
          {playing ? 'Stop' : 'Play'}
        </button>

        <div style={{ width: '100%', maxWidth: 320 }}>
          <Slider label="Volume" min={0} max={1} value={s.volume} display={pct(s.volume)}
            onChange={s.setVolume} />
        </div>
      </main>
    </div>
  );
}
