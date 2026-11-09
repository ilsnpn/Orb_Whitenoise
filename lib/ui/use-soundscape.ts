'use client';

// État de l'app (ambiance, réglages, heure, lecture) relié au moteur audio.
// Partagé par les habillages : chaque page ne fait que l'affichage.

import { useEffect, useRef, useState } from 'react';
import { SoundscapeEngine } from '../audio/engine';
import { applyEnergy, energyAt, nowHour } from '../audio/circadian';
import { MODES, type ModeName, type Params } from '../audio/modes';
import { MOODS, orbDrive } from '../orb/moods';
import type { OrbState } from '../orb/engine/orb-types';

export const MODE_NAMES = Object.keys(MODES) as ModeName[];
export const MODE_MORPH_SECONDS = 8;
const HINTS_KEY = 'whitenoise.hints';

export function useSoundscape() {
  const engine = useRef<SoundscapeEngine | null>(null);
  const morphNext = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<ModeName>('relax');
  const [base, setBase] = useState<Params>(structuredClone(MODES.relax.params));
  const [volume, setVolumeState] = useState(0.7);
  const [auto, setAuto] = useState(false);
  const [simHour, setSimHour] = useState<number | null>(null); // null = heure réelle
  const [clockHour, setClockHour] = useState(12);
  const [showHints, setShowHints] = useState(true);
  const [figure, setFigure] = useState<OrbState | null>(null); // null = figure de l'ambiance

  // affichage des explications, mémorisé dans le navigateur
  useEffect(() => {
    try {
      if (localStorage.getItem(HINTS_KEY) === 'off') setShowHints(false);
    } catch {}
  }, []);
  const toggleHints = () =>
    setShowHints((v) => {
      try {
        localStorage.setItem(HINTS_KEY, v ? 'off' : 'on');
      } catch {}
      return !v;
    });

  const getEngine = () => (engine.current ??= new SoundscapeEngine());

  useEffect(() => {
    setClockHour(nowHour());
    const id = setInterval(() => setClockHour(nowHour()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hour = simHour ?? clockHour;
  const energy = energyAt(hour);
  const effective = auto ? applyEnergy(base, energy) : base;
  const drive = orbDrive(effective);

  // pousse les paramètres effectifs vers le moteur (en fondu après un changement d'ambiance)
  useEffect(() => {
    getEngine().setParams(effective, morphNext.current);
    morphNext.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(effective)]);

  const update = (patch: Partial<Params>) =>
    setBase((b) => ({ ...b, ...patch, mix: { ...b.mix, ...patch.mix } }));

  const chooseMode = (m: ModeName) => {
    setMode(m);
    morphNext.current = MODE_MORPH_SECONDS;
    getEngine().setMode(m);
    setBase(structuredClone(MODES[m].params));
  };

  const toggle = async () => {
    const e = getEngine();
    if (playing) await e.stop();
    else await e.play();
    setPlaying(!playing);
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
    getEngine().setVolume(v);
  };

  // contrôles écran verrouillé / casque (Media Session)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: MODES[mode].label, artist: 'L’Orbe' });
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    navigator.mediaSession.setActionHandler('play', () => { if (!playing) void toggle(); });
    navigator.mediaSession.setActionHandler('pause', () => { if (playing) void toggle(); });
  });

  return {
    playing, toggle, mode, chooseMode, base, update, effective, drive,
    showHints, toggleHints,
    figure, setFigure, orbState: figure ?? MOODS[mode].state,
    volume, setVolume, auto, setAuto, simHour, setSimHour, hour, energy,
    pulse: () => engine.current?.pulse() ?? 0,
  };
}
