'use client';

// L'orbe centrale (clic = lecture / pause, sans bouton : en pause elle est à 50 % d'opacité, en lecture pleinement blanche ; anneau du Pomodoro autour) et la ligne
// Pomodoro du panneau (interrupteur + compteur). Partagées par l'écoute et la version maniaque.
import { useSound } from '@/lib/prelude/soundscape-context';
import { fmtLeft, type Pomodoro } from '@/lib/prelude/use-pomodoro';
import { IconTimer } from './icons';
import { SoundOrb } from './SoundOrb';
import './listen.css';

export function Stage({ px, pomodoro: p }: { px: number; pomodoro: Pomodoro }) {
  const s = useSound();
  // l'anneau suit le bord visible de l'orbe (ses points couvrent environ 80 % du canevas)
  const R = px * 0.42, C = 2 * Math.PI * R;
  return (
    // les points n'occupent qu'environ 80 % du canevas : ses marges transparentes sont rognées de la mise en page
    <div className="pr-l-stage" style={{ margin: `${Math.round(-px * 0.1)}px 0` }}>
      <button type="button" className="pr-l-orb" onClick={s.toggle} data-playing={s.playing}
        aria-label={s.playing ? 'Mettre en pause' : 'Écouter'} aria-pressed={s.playing}>
        <SoundOrb px={px} />
        {p.running ? (
          <svg className="pr-l-ring" width={px} height={px} aria-hidden="true">
            <circle cx={px / 2} cy={px / 2} r={R} fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
            <circle cx={px / 2} cy={px / 2} r={R} fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - p.progress)}
              transform={`rotate(-90 ${px / 2} ${px / 2})`} />
          </svg>
        ) : null}
      </button>
    </div>
  );
}

/** Session Pomodoro : un interrupteur dans le panneau, et le compteur juste dessous quand elle tourne. */
export function PomoRow({ pomodoro: p }: { pomodoro: Pomodoro }) {
  const s = useSound();
  const toggle = (on: boolean) => {
    if (on) { p.start(); if (!s.playing) void s.toggle(); } else p.stop();
  };
  return (
    <div className="pr-pomo">
      <label className="pr-l-switch">
        <IconTimer size={20} />
        <span>Session Pomodoro</span>
        <input type="checkbox" role="switch" checked={p.running} onChange={(e) => toggle(e.target.checked)} />
        <span className="pr-l-switch-track" aria-hidden="true" />
      </label>
      {p.running ? (
        <div className="pr-pomo-count" aria-live="polite">
          <span className="pr-pomo-time">{fmtLeft(p.left)}</span>
          <span className="pr-pomo-phase">{p.phase === 'work' ? `Travail · cycle ${p.cycle}` : 'Pause'}</span>
          <span className="pr-pomo-bar" aria-hidden="true"><i style={{ width: `${Math.round(p.progress * 100)}%` }} /></span>
        </div>
      ) : null}
    </div>
  );
}
