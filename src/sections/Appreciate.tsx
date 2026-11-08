import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Modal } from '../components/Modal';
import { VideoPlaylist } from '../components/VideoPlaylist';
import { Phrases } from '../components/Phrases';
import { Reveal } from '../components/Reveal';
import { asset } from '../config/env';
import { APPRECIATE, TESTIMONY_VIDEOS } from '../data/content';
import { isIllustration, TESTIMONIES, type Testimony } from '../data/testimonies';
import { firstBatch, nextBatch, resizeBatch, shuffle } from '../lib/batches';
import './Appreciate.css';

/** What the testimony dialog shows: everyone (「看全部」) or one story. */
type View = { kind: 'all'; focusId?: string } | { kind: 'story'; id: string; fromAll: boolean };

const ALL_IDS = TESTIMONIES.map((t) => t.id);

/** Which of the printed book's five page grounds an opened story gets: in turn down the list. */
const STORY_GROUNDS = 5;
const storyGround = (id: string) => Math.max(0, ALL_IDS.indexOf(id)) % STORY_GROUNDS;
const BY_ID = new Map(TESTIMONIES.map((t) => [t.id, t]));

/**
 * 01 · Appreciate (US-03 / US-04, #26): a polaroid wall of testimonies. Each page load shows a
 * random batch: two rows of 5 on desktop (10), 8 on tablets and phones; 「看其他故事」
 * swaps in others, and 「看全部故事」 lists everyone in a dialog, so the page stays short.
 */
export function Appreciate() {
  const [view, setView] = useState<View | null>(null);
  // 「看全部」 order, random per page load but steady while the visitor goes back and forth.
  const [allOrder] = useState(() => shuffle(ALL_IDS));
  const story = view?.kind === 'story' ? (BY_ID.get(view.id) ?? null) : null;

  return (
    <section id="appreciate" className="chapter appreciate tone-light" tabIndex={-1} aria-labelledby="appreciate-title">
      <div className="wrap">
        <Reveal className="chapter__head">
          <p className="kicker">
            <span className="chapter-step">第一步</span>
            <span className="chapter-label">
              <span className="chapter-en">Appreciate</span>
              2026 我感謝神…
            </span>
          </p>
          <h2 id="appreciate-title" className="chapter__title display-zh">
            <Phrases text={APPRECIATE.title} />
          </h2>
          <p className="lead">{APPRECIATE.lead}</p>
        </Reveal>

        <Reveal delay={0.05}>
          <VideoPlaylist
            playlistId={TESTIMONY_VIDEOS.playlistId}
            title={TESTIMONY_VIDEOS.title}
            hint={TESTIMONY_VIDEOS.hint}
            listLabel={TESTIMONY_VIDEOS.listLabel}
          />
        </Reveal>

        <Reveal delay={0.1}>
          <PolaroidWall onOpen={(id) => setView({ kind: 'story', id, fromAll: false })} onShowAll={() => setView({ kind: 'all' })} />
        </Reveal>
      </div>

      <Modal
        open={view !== null}
        onClose={() => setView(null)}
        // Each story opens at its top, also when picked from a scrolled 「看全部故事」 list.
        scrollKey={view?.kind === 'story' ? view.id : undefined}
        labelledBy={view?.kind === 'all' ? 'testimony-all-title' : 'testimony-name'}
        className={view?.kind === 'all' ? 'testimony-all-modal' : `testimony-modal story-ground-${storyGround(story?.id ?? '')}`}
      >
        {({ closing }) =>
          view?.kind === 'all' ? (
            <AllTestimonies order={allOrder} focusId={view.focusId} onOpen={(id) => setView({ kind: 'story', id, fromAll: true })} />
          ) : (
            story && (
              <TestimonyDetail
                key={story.id}
                testimony={story}
                playVideo={!closing}
                onBack={view?.kind === 'story' && view.fromAll ? () => setView({ kind: 'all', focusId: story.id }) : undefined}
              />
            )
          )
        }
      </Modal>
    </section>
  );
}

/** People on the wall at once: two rows of 5 from 900px (11/04), else 8 (4 or 2 per row). */
const WIDE = '(min-width: 900px)';
const sizeNow = () => (typeof window !== 'undefined' && window.matchMedia?.(WIDE).matches ? 10 : 8);

function useBatchSize(): number {
  const [size, setSize] = useState(sizeNow);
  useEffect(() => {
    const list = window.matchMedia?.(WIDE);
    if (!list) return;
    const update = () => setSize(sizeNow());
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, []);
  return size;
}

/** Slight, fixed tilts so the wall looks pinned up by hand but never moves on its own. */
const TILTS = [-2.4, 1.8, -1.2, 2.6, -1.8, 1.2, -2.2, 2.2, -0.8, 1.5];

function Polaroid({ testimony, index, onOpen }: { testimony: Testimony; index: number; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      className="polaroid"
      data-testimony={testimony.id}
      style={{ '--tilt': `${TILTS[index % TILTS.length]}deg` } as CSSProperties}
      onClick={() => onOpen(testimony.id)}
      aria-label={`開啟 ${testimony.name} 的見證：${testimony.quote}`}
    >
      <img className="polaroid__img" src={asset(testimony.avatar_url)} alt="" width="240" height="240" loading="lazy" decoding="async" />
      <span className="polaroid__caption" aria-hidden="true">
        <span className="polaroid__name">{testimony.name}</span>
        <span className="polaroid__quote">{testimony.quote}</span>
      </span>
    </button>
  );
}

function PolaroidWall({ onOpen, onShowAll }: { onOpen: (id: string) => void; onShowAll: () => void }) {
  const size = useBatchSize();
  // A new random batch on every page load (#26); nothing is stored.
  const [batch, setBatch] = useState(() => firstBatch(ALL_IDS, size));
  const [round, setRound] = useState(0);

  useEffect(() => {
    setBatch((b) => (b.shown.length === Math.min(size, ALL_IDS.length) ? b : resizeBatch(b, size)));
  }, [size]);

  const another = () => {
    setBatch((b) => nextBatch(b, size));
    setRound((r) => r + 1);
  };
  const more = ALL_IDS.length > size;

  return (
    <div className="polaroid-block">
      <ul key={round} className="polaroid-wall" aria-label="見證人物">
        {batch.shown.map((id, i) => {
          const t = BY_ID.get(id);
          return (
            t && (
              <li key={id} style={{ '--i': i } as CSSProperties}>
                <Polaroid testimony={t} index={i} onOpen={onOpen} />
              </li>
            )
          );
        })}
      </ul>
      {more && (
        <div className="polaroid-wall__actions">
          <button type="button" className="btn btn--outline" onClick={another}>
            看其他 {Math.min(size, ALL_IDS.length)} 則故事
          </button>
          <button type="button" className="polaroid-wall__all" onClick={onShowAll}>
            看全部故事 →
          </button>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {round > 0 ? `已換成另一批見證，共 ${batch.shown.length} 位` : ''}
      </p>
    </div>
  );
}

/** 「看全部」: everyone in the dialog; a story opens in place, with 「返回全部」 back here. */
function AllTestimonies({ order, focusId, onOpen }: { order: string[]; focusId?: string; onOpen: (id: string) => void }) {
  const listRef = useRef<HTMLUListElement>(null);

  // Back from a story: return to the person just read.
  useEffect(() => {
    if (focusId) listRef.current?.querySelector<HTMLElement>(`[data-testimony="${focusId}"]`)?.focus();
  }, [focusId]);

  return (
    <div className="testimony-all">
      {/* The label also names the dialog (no separate heading, 11/04). */}
      <p id="testimony-all-title" className="kicker">
        Appreciate 2026 我感謝神…
      </p>
      <ul ref={listRef} className="polaroid-wall polaroid-wall--all" aria-label="全部見證人物">
        {order.map((id, i) => {
          const t = BY_ID.get(id);
          return (
            t && (
              <li key={id}>
                <Polaroid testimony={t} index={i} onOpen={onOpen} />
              </li>
            )
          );
        })}
      </ul>
    </div>
  );
}

interface TestimonyDetailProps {
  testimony: Testimony;
  playVideo: boolean;
  /** Set when the story was opened from 「看全部」. */
  onBack?: () => void;
}

function TestimonyDetail({ testimony, playVideo, onBack }: TestimonyDetailProps) {
  const paragraphs = testimony.story_full.split(/\n\s*\n/);
  const backRef = useRef<HTMLButtonElement>(null);
  const fromAll = onBack !== undefined;

  // Opened from the list inside the dialog: the clicked polaroid is gone, so focus moves here.
  useEffect(() => {
    if (fromAll) backRef.current?.focus();
  }, [fromAll]);

  return (
    <article className="testimony">
      {/* Opened from 「看全部故事」: a way back at the top left, level with the close button at the
          top right (11/08). The ✕ still closes it all. */}
      {onBack && (
        <button ref={backRef} type="button" className="testimony__back" onClick={onBack}>
          <span aria-hidden="true">←</span> 全部故事
        </button>
      )}
      <div className="testimony__media">
        <img
          src={asset(testimony.avatar_url)}
          alt={isIllustration(testimony) ? `${testimony.name}（照片待補，暫以插畫代替）` : `${testimony.name} 的照片`}
          width="240"
          height="240"
        />
      </div>
      <div className="testimony__body tone-light">
        <p className="kicker">Appreciate 2026 我感謝神…</p>
        <h3 id="testimony-name" className="testimony__name">
          {testimony.name}
        </h3>
        <blockquote className="testimony__quote display-zh">
          <Phrases text={testimony.quote} />
        </blockquote>
        <div className="testimony__story">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {testimony.video_id && (
          <div className="testimony__video">
            {playVideo ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(testimony.video_id)}?rel=0&playsinline=1`}
                title={`${testimony.name} 的見證影片`}
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
              />
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
