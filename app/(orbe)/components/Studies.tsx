'use client';

// Les études : une seule grande page, toutes les fiches à la suite, séparées par un filet.
import { CARDS } from '@/lib/prelude/science';
import type { CardId } from '@/lib/prelude/types';
import { CardView } from './Card';
import { IconBack, IconBook } from './icons';
import './studies.css';

export function Studies({ order, onBack }: { order: CardId[]; onBack: () => void }) {
  return (
    <div className="pr-st">
      <header className="pr-st-bar">
        <button type="button" className="pr-st-back" onClick={onBack}><IconBack size={20} /> Retour à l’écoute</button>
        <p className="pr-kicker pr-st-kicker"><IconBook size={18} /> Les études</p>
      </header>

      <section className="pr-st-intro">
        <h1 className="pr-title">Ce que dit la recherche, et ses limites</h1>
        <p className="pr-muted">{order.length} fiches, à lire à la suite. Chacune dit ce que l’étude montre, et ce qu’elle ne montre pas.</p>
      </section>

      {order.map((id, i) => (
        <section key={id} className="pr-st-item" aria-label={CARDS[id].title}>
          <p className="pr-st-n" aria-hidden="true"><b>{String(i + 1).padStart(2, '0')}</b><span>/ {String(order.length).padStart(2, '0')}</span></p>
          <CardView card={CARDS[id]} onContinue={onBack} embedded />
        </section>
      ))}

      <footer className="pr-st-end">
        <button type="button" className="pr-btn" onClick={onBack}>Retour à l’écoute</button>
      </footer>
    </div>
  );
}
