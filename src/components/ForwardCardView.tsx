import type { PublicCard } from '../api/types';
import { PROMPTS } from '../lib/canvasCard';
import { relativeTime } from '../lib/format';
import './ForwardCardView.css';

const TINTS = ['gold', 'paper', 'mist', 'sand'] as const;

/** One card on the public wall. All user text renders as plain text (no innerHTML). */
export function ForwardCardView({ card, index, now }: { card: PublicCard; index: number; now: number }) {
  const tint = TINTS[index % TINTS.length];
  return (
    <article className={`fcard fcard--${tint}`}>
      <p className="fcard__prompt">{PROMPTS.gratitude}</p>
      <p className="fcard__text">{card.text_gratitude}</p>
      <p className="fcard__prompt">{PROMPTS.anticipate}</p>
      <p className="fcard__text">{card.text_anticipate}</p>
      <footer className="fcard__footer">
        <span className="fcard__name">— {card.nickname}</span>
        <time dateTime={card.created_at}>{relativeTime(card.created_at, now)}</time>
      </footer>
    </article>
  );
}

export function ForwardCardSkeleton() {
  return (
    <div className="fcard fcard--skeleton" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
