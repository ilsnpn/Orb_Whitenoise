'use client';

import type { ReactNode } from 'react';
import { IconBook, IconLock, IconNoAccount } from './icons';
import './quiz.css';

export function Intro({ onStart, onSkip, children }: { onStart: () => void; onSkip: () => void; children?: ReactNode }) {
  return (
    <section className="pr-screen pr-q-center pr-q-intro">
      {children ? <div className="pr-q-visual pr-q-hero">{children}</div> : null}
      <div className="pr-q-copy">
        <h1 className="pr-title">Votre fond sonore</h1>
        <p className="pr-q-lead">Pour vous concentrer, même dans le bruit.</p>
      </div>
      <div className="pr-q-actions">
        <button type="button" className="pr-btn" onClick={onStart}>Découvrir</button>
        <button type="button" className="pr-link" onClick={onSkip}>Passer l’intro</button>
      </div>
      <ul className="pr-q-promises">
        <li><IconNoAccount size={16} /> Sans compte</li>
        <li><IconLock size={16} /> Aucune réponse enregistrée</li>
        <li><IconBook size={16} /> Études citées</li>
      </ul>
    </section>
  );
}
