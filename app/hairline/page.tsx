'use client';

// Habillage alternatif, d'après le thème hairline de DEVIAN : une feuille de lecture
// (les réglages) à gauche, la figure (l'orbe) sur une planche technique au centre.

import { useEffect, useRef, useState } from 'react';
import { Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { MODES, type Mix, type NoiseKind } from '@/lib/audio/modes';
import { FIGURES, MOODS, figureName } from '@/lib/orb/moods';
import { MODE_MORPH_SECONDS, MODE_NAMES, useSoundscape } from '@/lib/ui/use-soundscape';
import { AUTO_HINT, HINTS, MIX_HINTS, MIX_LABELS, NOISE_HINT, fmtHour, pct } from '@/lib/ui/texts';
import { Orb } from '../orb';
import './hairline.css';

const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-jetbrains' });
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-instrument' });

const NOISE_KINDS: NoiseKind[] = ['white', 'pink', 'brown'];
const INK: [number, number, number] = [22, 22, 26];
const PAPER: [number, number, number] = [243, 242, 238];


function Control(props: {
  label: string; value: number; min: number; max: number; step?: number;
  display: React.ReactNode; hint?: string; onChange: (v: number) => void;
}) {
  return (
    <label className="hl-ctl">
      <span className="hl-ctl-head">
        <b>{props.label}</b>
        <span>{props.display}</span>
      </span>
      <input
        type="range" min={props.min} max={props.max} step={props.step ?? 0.01} value={props.value}
        onChange={(e) => props.onChange(+e.target.value)}
      />
      {props.hint && <p className="hl-hint">{props.hint}</p>}
    </label>
  );
}

/** Pastille orange qui palpite sur les battements (mise à jour hors React). */
function BeatDot({ pulse }: { pulse: () => number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const p = pulse();
      if (ref.current) ref.current.style.transform = `scale(${1 + p * 1.6})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pulse]);
  return <span ref={ref} className="hl-beat" />;
}

/** Taille de l'orbe : la plus grande qui tient dans la planche. */
function useFit(ref: React.RefObject<HTMLElement | null>) {
  const [px, setPx] = useState(400);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setPx(Math.round(Math.max(220, Math.min(width, height, 820))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return px;
}

export default function Hairline() {
  const s = useSoundscape();
  const { base, effective, mode, drive, playing } = s;
  const plate = useRef<HTMLElement>(null);
  const orbPx = useFit(plate);
  const modeIndex = MODE_NAMES.indexOf(mode) + 1;
  const mood = MOODS[mode];

  const shifted = (k: 'tempo' | 'dynamism' | 'brightness') =>
    s.auto && effective[k] !== base[k]
      ? <i> → {k === 'tempo' ? `${effective.tempo}` : pct(effective[k])}</i>
      : null;

  return (
    <div className={`hl ${mono.variable} ${serif.variable}${s.showHints ? '' : ' no-hints'}`}>
      <header className="hl-head">
        <div className="hl-brand">WHITENOISE<span>/hairline</span></div>
        <nav className="hl-nav">
          {MODE_NAMES.map((m, i) => (
            <button key={m} className={m === mode ? 'on' : ''} onClick={() => s.chooseMode(m)}>
              <span>0{i + 1}</span>{MODES[m].label}
            </button>
          ))}
        </nav>
        <div className="hl-tools">
          <a href="/">Version sombre</a>
          <button className={`hl-btn play${playing ? ' on' : ''}`} onClick={s.toggle}>
            {playing ? 'Stop' : 'Play'}
          </button>
        </div>
      </header>

      <div className="hl-main">
        <aside className="hl-sheet">
          <button className={`hl-btn hl-hints-toggle${s.showHints ? '' : ' on'}`} onClick={s.toggleHints}>
            {s.showHints ? 'Masquer les explications' : 'Afficher les explications'}
          </button>
          <div key={mode} className="hl-swap">
            <div className="hl-kicker">Ambiance {String(modeIndex).padStart(2, '0')} / {String(MODE_NAMES.length).padStart(2, '0')}</div>
            <h1 className="hl-name">{MODES[mode].label}</h1>
            <p className="hl-desc">{MODES[mode].description}</p>
            <div className="hl-meta">
              <b>{effective.tempo} BPM</b>·<span>fondu {MODE_MORPH_SECONDS} s</span>·<span>{base.noiseKind}</span>
            </div>
            <p className="hl-hint" style={{ marginTop: 12 }}>Orbe : {mood.description} {HINTS.orb}</p>
          </div>

          <div className="hl-group"><span>Figure de l&apos;orbe</span><span>{FIGURES.length}</span></div>
          <div className="hl-ctl">
            <span className="hl-ctl-head"><b>Figure</b><span>{s.figure === null ? `auto · ${figureName(s.orbState)}` : figureName(s.orbState)}</span></span>
            <div className="hl-chips hl-chips-grid">
              <button className={s.figure === null ? 'on' : ''} onClick={() => s.setFigure(null)}>Auto</button>
              {FIGURES.map((f) => (
                <button key={f.state} className={s.figure === f.state ? 'on' : ''} onClick={() => s.setFigure(f.state)}>
                  {f.name}
                </button>
              ))}
            </div>
            <p className="hl-hint">
              Auto = la figure liée à l&apos;ambiance ({figureName(mood.state)}). Les autres l&apos;imposent quelle que soit l&apos;ambiance.
            </p>
          </div>

          <div className="hl-group"><span>Heure de la journée</span><span>{pct(s.energy)}</span></div>
          <div className="hl-ctl">
            <label className="hl-check">
              <input type="checkbox" checked={s.auto} onChange={(e) => s.setAuto(e.target.checked)} />
              Suivre l&apos;heure — {fmtHour(s.hour)}
            </label>
            <p className="hl-hint">{AUTO_HINT}</p>
          </div>
          {s.auto && (
            <>
              <Control label="Simuler une heure" min={0} max={23.75} step={0.25} value={s.hour}
                display={s.simHour === null ? `maintenant · ${fmtHour(s.hour)}` : fmtHour(s.hour)}
                onChange={(v) => s.setSimHour(v)} hint={HINTS.simHour} />
              {s.simHour !== null && (
                <div className="hl-ctl">
                  <button className="hl-btn" onClick={() => s.setSimHour(null)}>Revenir à l&apos;heure réelle</button>
                </div>
              )}
            </>
          )}

          <div className="hl-group"><span>Son</span><span>4</span></div>
          <Control label="Tempo" min={40} max={130} step={1} value={base.tempo}
            display={<>{base.tempo} BPM{shifted('tempo')}</>} onChange={(v) => s.update({ tempo: v })}
            hint={HINTS.tempo} />
          <Control label="Grave ↔ Aigu" min={-12} max={12} step={1} value={base.register}
            display={`${base.register > 0 ? '+' : ''}${base.register} demi-tons`}
            onChange={(v) => s.update({ register: v })} hint={HINTS.register} />
          <Control label="Statique ↔ Dynamique" min={0} max={1} value={base.dynamism}
            display={<>{pct(base.dynamism)}{shifted('dynamism')}</>} onChange={(v) => s.update({ dynamism: v })}
            hint={HINTS.dynamism} />
          <Control label="Sombre ↔ Brillant" min={0} max={1} value={base.brightness}
            display={<>{pct(base.brightness)}{shifted('brightness')}</>} onChange={(v) => s.update({ brightness: v })}
            hint={HINTS.brightness} />

          <div className="hl-group"><span>Couches</span><span>5</span></div>
          {(Object.keys(MIX_LABELS) as (keyof Mix)[]).map((k) => (
            <Control key={k} label={MIX_LABELS[k]} min={0} max={1} value={base.mix[k]}
              display={pct(base.mix[k])} hint={MIX_HINTS[k]}
              onChange={(v) => s.update({ mix: { ...base.mix, [k]: v } })} />
          ))}
          <div className="hl-ctl">
            <span className="hl-ctl-head"><b>Couleur du bruit</b><span>{base.noiseKind}</span></span>
            <div className="hl-chips">
              {NOISE_KINDS.map((k) => (
                <button key={k} className={k === base.noiseKind ? 'on' : ''} onClick={() => s.update({ noiseKind: k })}>
                  {k}
                </button>
              ))}
            </div>
            <p className="hl-hint">{NOISE_HINT}</p>
          </div>
        </aside>

        <figure className="hl-plate" ref={plate}>
          <i className="hl-tick tl" /><i className="hl-tick tr" /><i className="hl-tick bl" /><i className="hl-tick br" />
          <span className="hl-axis">{playing ? 'en lecture' : 'à l\'arrêt'}</span>
          <Orb
            look={{ state: s.orbState, density: drive.density }}
            speed={playing ? drive.speed : drive.speed * 0.3}
            near={INK}
            far={PAPER}
            glow={1}
            pulse={s.pulse}
            px={orbPx}
          />
          <figcaption>
            <span className="hl-fno">Fig. {String(modeIndex).padStart(2, '0')}</span>
            <span>{figureName(s.orbState)} — {MODES[mode].label}</span>
            <span className="hl-cap"><BeatDot pulse={s.pulse} />{effective.tempo} BPM</span>
          </figcaption>
        </figure>
      </div>

      <footer className="hl-foot">
        <label className="hl-vol">
          Vol.
          <input type="range" min={0} max={1} step={0.01} value={s.volume}
            onChange={(e) => s.setVolume(+e.target.value)} />
          <span style={{ color: 'var(--hl-ink)' }}>{pct(s.volume)}</span>
        </label>
        <span>Énergie {pct(s.energy)} · {fmtHour(s.hour)}</span>
        <span className="hl-credit">Orbe : thinking-orbs (MIT) · Habillage : hairline</span>
      </footer>
    </div>
  );
}
