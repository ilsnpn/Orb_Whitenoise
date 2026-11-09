'use client';

// Frise de la journée : une fenêtre de 6 heures (un quart de journée) qui suit l'heure,
// avec la courbe d'énergie (lib/audio/circadian) au-dessus des créneaux du planning
// (lib/prelude/day-plan), chacun avec l'icône de son mode.
// Un trait marque l'heure actuelle ; le créneau en cours est mis en avant.
import { energyAt } from '@/lib/audio/circadian';
import { DAY_PLAN, slotAt, type Slot } from '@/lib/prelude/day-plan';
import { MODE_LABELS } from '@/lib/prelude/quiz';
import { fmtHour } from '@/lib/ui/texts';
import { IconMode } from './icons';

const W = 480, H = 54;
const SPAN = 6;     // heures affichées
const BEFORE = 1.5; // heures passées visibles à gauche du trait « maintenant »
const STEPS = SPAN * 12;
const mod24 = (h: number) => ((h % 24) + 24) % 24;

export function DayStrip({ hour, active }: { hour: number; active: boolean }) {
  const now = slotAt(hour);
  const start = hour - BEFORE;
  const end = start + SPAN;
  const pct = (t: number) => `${((t - start) / SPAN) * 100}%`;

  const line = Array.from({ length: STEPS + 1 }, (_, i) => {
    const e = energyAt(mod24(start + (i / STEPS) * SPAN));
    return `${i ? 'L' : 'M'}${((i / STEPS) * W).toFixed(1)},${(4 + (1 - e) * (H - 8)).toFixed(1)}`;
  }).join('');

  // créneaux du planning vus à travers la fenêtre (elle peut enjamber minuit)
  const slots: { slot: Slot; a: number; b: number }[] = [];
  for (const off of [-24, 0, 24]) {
    for (const slot of DAY_PLAN) {
      const a = Math.max(slot.from + off, start);
      const b = Math.min(slot.to + off, end);
      if (b > a) slots.push({ slot, a, b });
    }
  }
  const ticks: number[] = [];
  for (let t = Math.ceil(start); t <= end; t++) ticks.push(t);

  return (
    <figure className={`pr-day${active ? ' is-active' : ''}`}
      aria-label={`Planning des prochaines heures. Il est ${fmtHour(hour)} : ${now.label}, mode ${MODE_LABELS[now.mode]}.`}>
      <div className="pr-day-chart">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={line} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="pr-day-slots" aria-hidden="true">
          {slots.map(({ slot, a, b }) => (
            <div key={`${slot.from}-${a}`} className={`pr-day-slot${slot === now && a <= hour && hour < b ? ' is-now' : ''}`}
              style={{ left: pct(a), width: `${((b - a) / SPAN) * 100}%` }} title={`${slot.label} · ${MODE_LABELS[slot.mode]}`}>
              <IconMode mode={slot.mode} size={16} />
            </div>
          ))}
        </div>
        <div className="pr-day-now" style={{ left: pct(hour) }} aria-hidden="true">
          <span>{fmtHour(hour).replace(/ /g, ' ')}</span>
        </div>
      </div>
      <div className="pr-day-ticks" aria-hidden="true">
        {ticks.map((t) => <span key={t} style={{ left: pct(t) }}>{mod24(t)} h</span>)}
      </div>
      <figcaption>
        {active
          ? <>Maintenant : <b>{now.label.toLowerCase()}</b>, le son passe en {MODE_LABELS[now.mode]}.</>
          : <>Le mode changera tout seul selon l’heure.</>}
      </figcaption>
    </figure>
  );
}
