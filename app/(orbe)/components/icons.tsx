// Petites icônes au trait (currentColor), 24×24, pour les repères visuels de la v2.
import type { ReactNode } from 'react';

const I = ({ children, size = 18 }: { children: ReactNode; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
    strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

type P = { size?: number };
export const IconNoAccount = (p: P) => (
  <I {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1-3.5 3.8-5 7-5s6 1.5 7 5" /><path d="M4 4l16 16" /></I>
);
export const IconLock = (p: P) => (
  <I {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></I>
);
export const IconBook = (p: P) => (
  <I {...p}><path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z" /><path d="M12 6v13.5" /></I>
);
export const IconCompass = (p: P) => (
  <I {...p}><circle cx="12" cy="12" r="8.5" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></I>
);
export const IconBack = (p: P) => (
  <I {...p}><path d="M10 6l-6 6 6 6" /><path d="M4 12h16" /></I>
);
export const IconSpeaker = (p: P) => (
  <I {...p}><path d="M4 10v4h3.5L12 18V6L7.5 10z" /><path d="M15.5 9a4 4 0 0 1 0 6" /><path d="M18 6.5a7.5 7.5 0 0 1 0 11" /></I>
);
export const IconClock = (p: P) => (
  <I {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></I>
);
export const IconPlay = (p: P) => (
  <I {...p}><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></I>
);
export const IconPause = (p: P) => (
  <I {...p}><path d="M8.5 5.5v13M15.5 5.5v13" strokeWidth={2.4} /></I>
);
/** Icône de mode : cible (concentration), vagues (détente), feuille (apaisement). */
export const IconMode = ({ mode, size }: { mode: 'focus' | 'relax' | 'sleep'; size?: number }) =>
  mode === 'focus' ? (
    <I size={size}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></I>
  ) : mode === 'relax' ? (
    <I size={size}><path d="M3 10c2.2-2.5 4-2.5 6 0s3.8 2.5 6 0 4-2.5 6 0" /><path d="M3 15c2.2-2.5 4-2.5 6 0s3.8 2.5 6 0 4-2.5 6 0" /></I>
  ) : (
    <I size={size}><path d="M5 19C5 10 11 5 19.5 4.5 19.5 13 14 19 5 19z" /><path d="M5 19l8.5-8.5" /></I>
  );
export const IconTimer = (p: P) => (
  <I {...p}><circle cx="12" cy="13.5" r="7.5" /><path d="M12 13.5V9.5M9.5 2.5h5M18.5 6.5l1.5-1.5" /></I>
);
export const IconSliders = (p: P) => (
  <I {...p}><path d="M5 4v16M12 4v16M19 4v16" /><circle cx="5" cy="15" r="2" fill="var(--pr-bg, #000)" /><circle cx="12" cy="8" r="2" fill="var(--pr-bg, #000)" /><circle cx="19" cy="13" r="2" fill="var(--pr-bg, #000)" /></I>
);

// Panneau latéral : flèche vers l'autre côté, repli contre le bord, réouverture.
const Flip = ({ flip, children }: { flip: boolean; children: ReactNode }) =>
  flip ? <g transform="translate(24 0) scale(-1 1)">{children}</g> : <g>{children}</g>;
export const IconArrow = ({ dir, size }: { dir: 'left' | 'right'; size?: number }) => (
  <I size={size}><Flip flip={dir === 'left'}><path d="M4 12h16M14 6l6 6-6 6" /></Flip></I>
);
/** Replier le panneau : flèche vers le bord où il se trouve. */
export const IconFold = ({ side, size }: { side: 'left' | 'right'; size?: number }) => (
  <I size={size}><Flip flip={side === 'right'}><path d="M4 5v14M20 12H9M13 7l-5 5 5 5" /></Flip></I>
);
/** Rouvrir le panneau : flèche qui s'éloigne du bord. */
export const IconUnfold = ({ side, size }: { side: 'left' | 'right'; size?: number }) => (
  <I size={size}><Flip flip={side === 'right'}><path d="M4 5v14M9 12h11M15 7l5 5-5 5" /></Flip></I>
);

/** Logo GitHub (octocat), plein, 16×16 d'origine. */
export const IconGithub = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
  </svg>
);
