// Ce que la v2 garde sur l'appareil, et rien d'autre : « prélude déjà vu », la
// position du pad par mode et la disposition du panneau (côté, replié ou non).
// Aucune réponse du quiz n'est enregistrée.
import type { ModeName } from '../audio/modes';
import { CENTER, clampPos } from './pad-map';
import type { PadPos } from './types';

const KEY = 'prelude.v1';

export interface PanelPrefs { side: 'left' | 'right'; open: boolean }

interface Stored {
  seen?: boolean;
  pad?: Partial<Record<ModeName, PadPos>>;
  panel?: Partial<PanelPrefs>;
}

function read(): Stored {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Stored;
  } catch {
    return {};
  }
}

function write(patch: Stored) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch }));
  } catch {}
}

export const loadSeen = () => read().seen === true;
export const saveSeen = (seen = true) => write({ seen });

export function loadPads(): Record<ModeName, PadPos> {
  const p = read().pad ?? {};
  const get = (m: ModeName) => (p[m] && Number.isFinite(p[m]!.x) && Number.isFinite(p[m]!.y) ? clampPos(p[m]!) : CENTER);
  return { focus: get('focus'), relax: get('relax'), sleep: get('sleep') };
}

/** Enregistre la position d'un seul mode : celle que l'utilisateur vient de régler à la main. */
export const savePad = (mode: ModeName, pos: PadPos) => write({ pad: { ...read().pad, [mode]: clampPos(pos) } });

/** Disposition du panneau de réglages : à gauche et ouvert par défaut. */
export function loadPanel(): PanelPrefs {
  const p = read().panel ?? {};
  return { side: p.side === 'right' ? 'right' : 'left', open: p.open !== false };
}
export const savePanel = (panel: PanelPrefs) => write({ panel });
