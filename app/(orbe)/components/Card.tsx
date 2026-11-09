'use client';

import type { Card } from '@/lib/prelude/types';
import { CardFigure, SectionIcon } from './CardFigure';
import './quiz.css';
import './card.css';

export function CardView({
  card,
  onContinue,
  continueLabel = 'Continuer',
  aside,
  embedded = false,
}: {
  card: Card;
  onContinue: () => void;
  continueLabel?: string;
  aside?: { label: string; onOpen: () => void };
  /** Fiche posée dans la page des études : hauteur libre, pas de bouton « Continuer ». */
  embedded?: boolean;
}) {
  return (
    <article key={card.id} className={`pr-screen pr-q-card${embedded ? ' pr-q-card--flow' : ''}`}>
      {/* Deux colonnes en mode large (voir card.css). Sur téléphone, les wrappers
          sont en display: contents et `order` rétablit l'ordre en colonne unique. */}
      <div className="pr-c-col pr-c-col--a">
        <header className="pr-q-copy">
          <p className="pr-kicker">{card.kicker}</p>
          <h2 className="pr-title">{card.title}</h2>
        </header>

        <div className="pr-c-frame">
          <CardFigure id={card.id} />
        </div>

        <aside className="pr-q-box">
          <p className="pr-kicker pr-c-kicker">
            <SectionIcon kind="limits" />
            Ce que ça ne dit pas
          </p>
          <p>{card.limits}</p>
        </aside>

        {card.care ? (
          <aside className="pr-q-box pr-q-box--care">
            <p className="pr-kicker pr-c-kicker">
              <SectionIcon kind="care" />
              Santé
            </p>
            <p>{card.care}</p>
          </aside>
        ) : null}
      </div>

      <div className="pr-c-col pr-c-col--b">
        <div className="pr-q-body">
          {card.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {card.sources.length > 0 ? (
          <section className="pr-q-sources">
            <p className="pr-kicker pr-c-kicker">
              <SectionIcon kind="sources" />
              {card.sources.length > 1 ? 'Sources' : 'Source'}
            </p>
            <ul>
              {card.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label}
                    <span className="pr-q-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {embedded ? null : (
        <div className="pr-q-footer">
          {aside ? (
            <button type="button" className="pr-link" onClick={aside.onOpen}>
              {aside.label} →
            </button>
          ) : null}
          <button type="button" className="pr-btn" onClick={onContinue}>
            {continueLabel}
          </button>
        </div>
        )}
      </div>
    </article>
  );
}
