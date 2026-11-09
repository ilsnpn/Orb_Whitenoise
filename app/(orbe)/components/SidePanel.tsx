'use client';

// Écran à panneau latéral (écoute, version maniaque) : le panneau se place à gauche
// ou à droite (flèche en bas), et se replie pour laisser l'orbe seule, au centre
// de la fenêtre (bouton de repli en bas ; une petite languette le rouvre).
// Le choix est gardé sur l'appareil (lib/prelude/store).
import { useEffect, useState, type ReactNode } from 'react';
import { loadPanel, savePanel, type PanelPrefs } from '@/lib/prelude/store';
import { IconArrow, IconFold, IconUnfold } from './icons';
import './sidepanel.css';

export const PANEL_W = 380;

export function usePanelPrefs() {
  // l'écran n'est monté que côté client, après lecture de l'appareil
  const [prefs, setPrefs] = useState<PanelPrefs>(() => loadPanel());
  useEffect(() => { savePanel(prefs); }, [prefs]);
  return {
    ...prefs,
    toggleSide: () => setPrefs((p) => ({ ...p, side: p.side === 'left' ? 'right' : 'left' })),
    setOpen: (open: boolean) => setPrefs((p) => ({ ...p, open })),
  };
}

/** `children` peut être une fonction de l'état ouvert / replié (l'orbe en profite pour grandir). */
export function SidePanel({ panel, children }: { panel: ReactNode; children: ReactNode | ((open: boolean) => ReactNode) }) {
  const { side, open, toggleSide, setOpen } = usePanelPrefs();
  const other = side === 'left' ? 'right' : 'left';
  return (
    <section className="pr-sp" data-side={side} data-open={open}>
      <aside className="pr-sp-panel" aria-label="Réglages" inert={!open}>
        <div className="pr-sp-inner" style={{ width: PANEL_W }}>
          <div className="pr-sp-body">{panel}</div>
          <div className="pr-sp-foot">
            <button type="button" className="pr-sp-btn" onClick={toggleSide}
              aria-label={`Placer le panneau à ${other === 'left' ? 'gauche' : 'droite'}`}
              title={`Placer le panneau à ${other === 'left' ? 'gauche' : 'droite'}`}>
              <IconArrow dir={other} size={18} />
            </button>
            <button type="button" className="pr-sp-btn" onClick={() => setOpen(false)}
              aria-label="Replier le panneau" title="Replier le panneau, l’orbe prend toute la place">
              <IconFold side={side} size={18} />
            </button>
          </div>
        </div>
      </aside>
      <main className="pr-sp-main">{typeof children === 'function' ? children(open) : children}</main>
      <button type="button" className="pr-sp-tab" onClick={() => setOpen(true)} tabIndex={open ? -1 : 0}
        aria-label="Afficher le panneau" aria-hidden={open} title="Afficher le panneau">
        <IconUnfold side={side} size={18} />
      </button>
    </section>
  );
}
