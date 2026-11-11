'use client';

// L’Orbe : intro → quiz (une réponse peut ouvrir une fiche) → recommandation
// → écoute (orbe, modes, pad) ; de là, la « version maniaque » où tout se
// règle à la main. Le moteur audio est celui de la v1, partagé
// via le layout. Rien du quiz n'est enregistré : seules « prélude déjà vu » et la
// position du pad réglée à la main restent sur l'appareil (lib/prelude/store).

import { useEffect, useRef, useState } from 'react';
import { nowHour } from '@/lib/audio/circadian';
import type { ModeName, NoiseKind } from '@/lib/audio/modes';
import { modeAt, slotAt } from '@/lib/prelude/day-plan';
import { CENTER, clampPos, padPatch } from '@/lib/prelude/pad-map';
import { BRANCHES, COMMON, FIRST, MODE_LABELS } from '@/lib/prelude/quiz';
import { CARDS } from '@/lib/prelude/science';
import { useSound } from '@/lib/prelude/soundscape-context';
import { loadPads, loadSeen, savePad, saveSeen } from '@/lib/prelude/store';
import type { CardId, Option, PadPos, Question } from '@/lib/prelude/types';
import { usePomodoro } from '@/lib/prelude/use-pomodoro';
import { CardView } from './components/Card';
import { Intro } from './components/Intro';
import { Listen } from './components/Listen';
import { Manual } from './components/Manual';
import { QuestionView } from './components/Question';
import { Ready } from './components/Ready';
import { SoundOrb } from './components/SoundOrb';
import { Studies } from './components/Studies';
import { useViewport } from './components/use-viewport';

type Phase =
  | { k: 'boot' }
  | { k: 'intro' }
  | { k: 'quiz'; goal: ModeName | null; q: number; card: CardId | null }
  | { k: 'ready'; reason: string[] }
  | { k: 'listen' }
  | { k: 'studies' }
  | { k: 'manual' };

const STUDY_ORDER: CardId[] = [
  'open-space-noise', 'masking', 'steady-rhythm', 'pomodoro', 'adhd',
  'music-stress', 'restorative-sound', 'nature-recovery',
];

/** Écart (en heures) entre deux heures sur un cadran de 24 h. */
const hourGap = (a: number, b: number) => { const d = Math.abs(a - b) % 24; return Math.min(d, 24 - d); };

export default function Prelude() {
  const s = useSound();
  const vp = useViewport();
  // Pomodoro : la musique se coupe à la fin du travail et revient à la fin de la pause
  const sRef = useRef(s);
  sRef.current = s;
  const pomo = usePomodoro((next) => {
    const cur = sRef.current;
    if ((next === 'break') === cur.playing) void cur.toggle();
  });
  const [phase, setPhase] = useState<Phase>({ k: 'boot' });
  const [pads, setPads] = useState<Record<ModeName, PadPos>>({ focus: CENTER, relax: CENTER, sleep: CENTER });
  const noise = useRef<NoiseKind | undefined>(undefined);
  // réponses de la séance en cours (en mémoire seulement)
  const session = useRef<{ peak?: number | null }>({});

  /** Envoie la position du pad du mode courant au moteur (s'ajoute au preset du mode). */
  const applyPad = (mode: ModeName, pos: PadPos) => {
    const patch = padPatch(mode, pos, noise.current);
    if (patch.noiseKind) noise.current = patch.noiseKind;
    s.update(patch);
  };

  /** Change de mode (fondu du moteur) puis réapplique le pad de ce mode, dans le même geste. */
  const selectMode = (m: ModeName, pos = pads[m]) => {
    s.chooseMode(m);
    noise.current = undefined;
    applyPad(m, pos);
  };

  /** Position de départ pour la séance seulement (non enregistrée). */
  const setSessionPad = (m: ModeName, pos: PadPos) => {
    setPads((p) => ({ ...p, [m]: pos }));
    applyPad(m, pos);
  };

  // premier rendu côté client : relit l'appareil
  useEffect(() => {
    const stored = loadPads();
    setPads(stored);
    if (loadSeen()) {
      setPhase({ k: 'listen' });
      s.chooseMode('focus');
      applyPad('focus', stored.focus);
    } else {
      setPhase({ k: 'intro' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // « Suivre la journée » : le mode suit le planning (lib/prelude/day-plan)
  useEffect(() => {
    if (phase.k !== 'listen' || !s.auto) return;
    const m = modeAt(s.hour);
    if (m !== s.mode) selectMode(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.k, s.auto, s.hour, s.mode]);

  const heroOrb = Math.round(Math.max(220, Math.min(vp.w - 24, vp.h * 0.46, 440)));
  // accueil : l'orbe prend toute la hauteur laissée par le texte, les boutons et les promesses
  const introOrb = Math.round(Math.max(260, Math.min((vp.h - 400) * 1.25, vp.w, 820)));

  // ───────── quiz ─────────
  const questions = (goal: ModeName | null): Question[] => (goal ? [FIRST, ...BRANCHES[goal], ...COMMON] : [FIRST]);

  /** Construit la recommandation finale : réponses + heure actuelle. Ajuste le pad de la séance. */
  const recommend = (goal: ModeName): string[] => {
    const h = nowHour();
    const lines = [`Au vu de vos réponses et de l’heure, le mode ${MODE_LABELS[goal]} est le plus adapté.`];
    const peak = session.current.peak;
    const base = pads[goal];
    if (peak == null) {
      lines.push('Votre forme varie : activez « Suivre la journée » pour que le mode s’adapte à l’heure.');
    } else if (hourGap(h, peak) <= 2.5) {
      setSessionPad(goal, clampPos({ x: base.x, y: base.y + (goal === 'focus' ? 0.2 : 0.1) }));
      lines.push('Vous êtes dans votre meilleur créneau : nous l’avons réglé un peu plus vif.');
    } else {
      setSessionPad(goal, clampPos({ x: base.x, y: base.y - 0.15 }));
      lines.push('Ce n’est pas votre meilleur moment : nous l’avons réglé plus posé, pour vous lancer en douceur.');
    }
    const slot = slotAt(h);
    if (slot.mode !== goal) lines.push(`À cette heure (${slot.label.toLowerCase()}), le planning de la journée proposerait plutôt le mode ${MODE_LABELS[slot.mode]}.`);
    return lines;
  };

  const answer = (o: Option) => {
    if (phase.k !== 'quiz') return;
    let goal = phase.goal;
    if (o.mode) {
      goal = o.mode;
      session.current = {};
      selectMode(o.mode);
    }
    if (o.pad && goal) setSessionPad(goal, o.pad);
    const qid = questions(goal)[phase.q].id;
    if (qid === 'peak') session.current.peak = o.peak ?? null;
    if (o.card) setPhase({ ...phase, goal, card: o.card });
    else next(goal, phase.q);
  };

  const next = (goal: ModeName | null, q: number) => {
    if (q + 1 < questions(goal).length) setPhase({ k: 'quiz', goal, q: q + 1, card: null });
    else setPhase({ k: 'ready', reason: recommend(goal ?? 'focus') });
  };

  const listen = async () => {
    saveSeen();
    setPhase({ k: 'listen' });
    if (!s.playing) await s.toggle();
  };

  const skip = () => {
    selectMode('focus');
    saveSeen();
    setPhase({ k: 'listen' });
  };

  // ───────── rendu ─────────
  switch (phase.k) {
    case 'boot':
      return null;

    case 'intro':
      return (
        <Intro onStart={() => setPhase({ k: 'quiz', goal: null, q: 0, card: null })} onSkip={skip}>
          <div style={{ margin: `${Math.round(-introOrb * 0.1)}px 0` }}><SoundOrb px={introOrb} /></div>
        </Intro>
      );

    case 'quiz': {
      const q = questions(phase.goal)[phase.q];
      if (phase.card) {
        return <CardView card={CARDS[phase.card]} onContinue={() => next(phase.goal, phase.q)} />;
      }
      return <QuestionView question={q} step={phase.q + 1} total={phase.goal ? questions(phase.goal).length : undefined} onAnswer={answer} />;
    }

    case 'ready':
      return (
        <Ready reason={phase.reason} onListen={listen}>
          <SoundOrb px={Math.round(Math.max(160, Math.min(heroOrb * 0.85, vp.h - 470)))} />
        </Ready>
      );

    case 'studies':
      return <Studies order={STUDY_ORDER} onBack={() => setPhase({ k: 'listen' })} />;

    case 'listen':
      return (
        <Listen
          pad={pads[s.mode]}
          pomodoro={pomo}
          onChooseMode={(m) => { if (s.auto) s.setAuto(false); selectMode(m); }}
          onFollowDay={(on) => s.setAuto(on)}
          onPadMove={(p) => applyPad(s.mode, p)}
          onPadCommit={(p) => {
            setPads((all) => ({ ...all, [s.mode]: p }));
            savePad(s.mode, p);
          }}
          onStudies={() => setPhase({ k: 'studies' })}
          onOrient={() => setPhase({ k: 'intro' })}
          onManual={() => setPhase({ k: 'manual' })}
        />
      );

    case 'manual':
      return (
        <Manual
          pomodoro={pomo}
          // ici, choisir une ambiance remet son preset tel quel : les réglages se font ensuite à la main
          onChooseMode={(m) => { s.chooseMode(m); noise.current = undefined; }}
          // de retour au guide : figure automatique, preset du mode + position du pad
          onBack={() => { s.setFigure(null); selectMode(s.mode); setPhase({ k: 'listen' }); }}
        />
      );
  }
}
