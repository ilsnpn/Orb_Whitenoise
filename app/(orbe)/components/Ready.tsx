'use client';

import type { ReactNode } from 'react';
import './quiz.css';

export function Ready({
  reason,
  onListen,
  children,
}: {
  reason: string[];
  onListen: () => void;
  children?: ReactNode;
}) {
  return (
    <section className="pr-screen pr-q-center">
      {children ? <div className="pr-q-visual pr-q-hero">{children}</div> : null}
      <div className="pr-q-copy">
        <p className="pr-kicker">Notre suggestion</p>
        <h2 className="pr-title pr-q-reco">{reason[0]}</h2>
        {reason.slice(1).map((r) => <p key={r} className="pr-muted">{r}</p>)}
        <p className="pr-muted">Vous êtes libre de changer à tout moment.</p>
      </div>
      <div className="pr-q-actions">
        <button type="button" className="pr-btn" onClick={onListen}>Écouter</button>
        <p className="pr-muted">En open space, un casque fait toute la différence.</p>
      </div>
    </section>
  );
}
