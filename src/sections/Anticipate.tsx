import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { CountUp } from '../components/CountUp';
import { Phrases } from '../components/Phrases';
import { Reveal } from '../components/Reveal';
import { asset } from '../config/env';
import { ANTICIPATE, MINISTRIES, OUTREACH_PARTNERS, type Ministry } from '../data/content';
import { prefersReducedMotion, useInView, useMediaQuery, usePrefersReducedMotion } from '../lib/hooks';
import './Anticipate.css';

/** 02 · Anticipate (US-06): the five ministries. Prayer Map is a link at the end of the journey (#19). */
export function Anticipate() {
  return (
    <section id="anticipate" className="chapter anticipate" tabIndex={-1} aria-labelledby="anticipate-title">
      <div className="wrap">
        <Reveal className="chapter__head">
          <p className="kicker">
            <span className="chapter-step">第二步</span>Anticipate 2027 我和神一起期待…
          </p>
          <h2 id="anticipate-title" className="chapter__title display-zh">
            <Phrases text={ANTICIPATE.title} />
          </h2>
          <p className="lead">{ANTICIPATE.lead}</p>
        </Reveal>

        <div className="ministries">
          {MINISTRIES.map((m, i) => (
            <MinistryBlock key={m.id} ministry={m} order={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MinistryBlock({ ministry, order }: { ministry: Ministry; order: number }) {
  return (
    <article className={`ministry ${order % 2 === 1 ? 'ministry--flip' : ''}`} aria-labelledby={`ministry-${ministry.id}`}>
      <Reveal className="ministry__media">
        <PhotoCarousel
          label={`${ministry.zh}照片`}
          photos={ministry.photos ?? []}
          placeholder={(i) => <MinistryArt kind={ministry.art} style={ART_GROUNDS[(order + i) % ART_GROUNDS.length]} />}
        />
      </Reveal>
      <Reveal className="ministry__text" delay={0.08}>
        <p className="ministry__index">{ministry.index}</p>
        <h3 id={`ministry-${ministry.id}`} className="ministry__title">
          <span className="display-zh">{ministry.zh}</span>
          <span className="ministry__en">{ministry.en}</span>
        </h3>
        <p className="ministry__headline display-zh">
          <Phrases text={ministry.headline} />
        </p>
        {ministry.body.split(/\n\s*\n/).map((paragraph) => (
          <p key={paragraph} className="ministry__body">
            {paragraph}
          </p>
        ))}
        {ministry.stats.length > 0 && (
          // Four figures sit two by two; two or three share one row (11/04). A one-line label gets a
          // column as wide as its line, so it never runs into the next figure (11/06).
          <dl
            className="ministry__stats"
            style={
              {
                '--stat-cols': ministry.stats.length === 4 ? 2 : ministry.stats.length,
                '--stat-tracks': ministry.stats.some((s) => s.oneLine)
                  ? ministry.stats.map((s) => (s.oneLine ? 'max-content' : 'minmax(0, 1fr)')).join(' ')
                  : undefined,
              } as CSSProperties
            }
          >
            {ministry.stats.map((s) => (
              <div key={s.label} className="ministry__stat">
                <dt className={s.oneLine ? 'is-one-line' : undefined}>{s.label}</dt>
                <dd>
                  <CountUp value={s.value} suffix={s.suffix} />
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Reveal>
      {ministry.id === 'outreach' && <Partners />}
    </article>
  );
}

/** Phones get the partners as bars that open downwards; wider screens keep the tabs. */
const PARTNERS_PHONE = '(max-width: 759px)';

type PartnerTone = 'gold' | 'navy';
type Partner = (typeof OUTREACH_PARTNERS)[number];

/** The printed panels' 金黃 and 深藍, in turn down the list (11/06, team choice), with the
 *  matching text colour. */
const toneOf = (i: number): PartnerTone => (i % 2 === 0 ? 'gold' : 'navy');
const groundOf = (tone: PartnerTone) =>
  ({
    '--partner-ground': `var(--rgb-print-${tone})`,
    '--partner-ink': tone === 'navy' ? 'rgb(var(--rgb-white))' : 'var(--ink)',
  }) as CSSProperties;

/**
 * 外展憐憫事工's partner stories (#26, plan C). One story at a time; nothing rotates on its own.
 * Wide screens: tabs (arrow keys, Home and End move between them). Phones (11/06, the user's
 * choice): a full-width bar per partner that opens its story under it; opening one closes the
 * other, and tapping the open one closes it.
 */
function Partners() {
  const phone = useMediaQuery(PARTNERS_PHONE);
  // Shared, so turning a tablet keeps the story that was open.
  const [active, setActive] = useState(0);
  return phone ? <PartnerAccordion active={active} setActive={setActive} /> : <PartnerTabs active={Math.max(active, 0)} setActive={setActive} />;
}

function PartnerTabs({ active, setActive }: { active: number; setActive: (i: number) => void }) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const count = OUTREACH_PARTNERS.length;
  const at = (i: number) => OUTREACH_PARTNERS[(i + count) % count]!;

  const select = (i: number, focus = false) => {
    const next = (i + count) % count;
    setActive(next);
    if (focus) tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const target = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: count - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    select(target, true);
  };

  const partner = at(active);
  const tone = toneOf(active);
  return (
    <Reveal className="partners">
      <p id="partners-label" className="partners__label">
        合作機構
      </p>
      <div className="partners__tabs" role="tablist" aria-labelledby="partners-label" style={groundOf(tone)}>
        {OUTREACH_PARTNERS.map((p, i) => (
          <button
            key={p.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${p.id}-tab`}
            aria-selected={i === active}
            aria-controls="partners-panel"
            tabIndex={i === active ? 0 : -1}
            className={`partners__tab ${i === active ? 'is-on' : ''}`}
            onClick={() => select(i)}
            onKeyDown={onKeyDown}
          >
            {p.name}
          </button>
        ))}
      </div>
      <PartnerPanel partner={partner} tone={tone} id="partners-panel" role="tabpanel" labelledBy={`${partner.id}-tab`} />
    </Reveal>
  );
}

function PartnerAccordion({ active, setActive }: { active: number; setActive: (i: number) => void }) {
  const barRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const opened = useRef(false);

  // After opening one (the one above may just have closed), bring its bar to the top.
  useEffect(() => {
    if (!opened.current || active < 0) return;
    opened.current = false;
    barRefs.current[active]?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [active]);

  const toggle = (i: number) => {
    opened.current = i !== active;
    setActive(i === active ? -1 : i);
  };

  return (
    <Reveal className="partners partners--accordion">
      <p id="partners-label" className="partners__label">
        合作機構
      </p>
      <ul className="partners__list" aria-labelledby="partners-label">
        {OUTREACH_PARTNERS.map((p, i) => {
          const open = i === active;
          const tone = toneOf(i);
          return (
            <li key={p.id} className={`partners__entry${open ? ' is-open' : ''}`} style={groundOf(tone)}>
              <button
                ref={(el) => {
                  barRefs.current[i] = el;
                }}
                type="button"
                id={`${p.id}-bar`}
                className="partners__bar"
                aria-expanded={open}
                aria-controls={`${p.id}-panel`}
                onClick={() => toggle(i)}
              >
                {p.name}
                <span className="partners__bar-icon" aria-hidden="true">
                  ＋
                </span>
              </button>
              {/* Only the open story is in the page, so the others' photos never load. */}
              {open && <PartnerPanel partner={p} tone={tone} id={`${p.id}-panel`} role="region" labelledBy={`${p.id}-bar`} />}
            </li>
          );
        })}
      </ul>
    </Reveal>
  );
}

function PartnerPanel({ partner, tone, id, role, labelledBy }: { partner: Partner; tone: PartnerTone; id: string; role: 'tabpanel' | 'region'; labelledBy: string }) {
  return (
    <div
      id={id}
      style={groundOf(tone)}
      className={`partners__panel partners__panel--${tone}${partner.markUnder === 'story' ? ' partners__panel--mark-story' : ''}${partner.markAlign === 'end' ? ' partners__panel--mark-end' : ''}`}
      role={role}
      aria-labelledby={labelledBy}
    >
      <div className="partners__media">
        {/* Several photos turn like the ministries' (11/06); a single one keeps its own shape, so a
            tall picture is not cut; the previous / next links went. */}
        {partner.photos && partner.photos.length > 1 ? (
          <PhotoCarousel
            key={partner.id}
            label={`${partner.name}照片`}
            photos={partner.photos}
            indicator="dots"
            className="ministry-carousel--partner"
          />
        ) : partner.photos?.[0] ? (
          <img className="partners__img" src={asset(partner.photos[0].src)} alt={partner.photos[0].alt} loading="lazy" decoding="async" />
        ) : (
          <div className="partners__photo" aria-hidden="true">
            機構照片（待提供）
          </div>
        )}
      </div>
      <div className="partners__text">
        <p className="partners__title display-zh">{partner.title}</p>
        <div className="partners__body">
          {partner.body.split(/\n\s*\n/).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
      {/* The name as large faint lettering, like the printed panels (11/06): one line, smaller
          for a longer name. */}
      <p
        className="partners__mark"
        aria-hidden="true"
        style={{ '--mark-chars': Math.max(...(partner.markLines ?? [partner.name]).map((line) => [...line].length)) } as CSSProperties}
      >
        {(partner.markLines ?? [partner.name]).map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
    </div>
  );
}

/** Abstract placeholder art — no people — until COMMS delivers real imagery. */
/** The placeholder frames take turns in the three art grounds, starting from the block's own. */
const ART_GROUNDS: CSSProperties[] = [
  { '--art-ground': 'var(--accent)', '--art-ink': 'var(--ink)' } as CSSProperties,
  { '--art-ground': 'rgb(var(--rgb-tint))', '--art-ink': 'initial' } as CSSProperties,
  { '--art-ground': 'var(--paper)', '--art-ink': 'var(--ink)' } as CSSProperties,
];

const PLACEHOLDER_FRAMES = 3;
/** Each photo stays 5 s (team choice; 3 s was tried on 11/06 and felt too fast). */
const SLIDE_MS = 5000;

interface CarouselPhoto {
  src: string;
  alt: string;
}

interface PhotoCarouselProps {
  label: string;
  photos: CarouselPhoto[];
  /** Frames to cycle while there are no photos yet; without it, nothing is shown. */
  placeholder?: (index: number) => ReactNode;
  /** 「3／18」 (the ministries) or a dot per photo (the partners' short sets), 11/06. */
  indicator?: 'count' | 'dots';
  className?: string;
}

/**
 * Photos as a crossfading carousel (11/05), for the ministries and, since 11/06, the outreach
 * partners. It moves on every 5 s while on screen, holds while the pointer or focus is on it, and
 * never moves by itself under reduced motion or after 暫停. Arrows and a sideways swipe change the
 * photo; a 「3／18」 count (or, for the partners' two or three photos, dots) shows where you are.
 * Without photos it cycles the placeholder frames.
 */
function PhotoCarousel({ label, photos, placeholder, indicator = 'count', className = '' }: PhotoCarouselProps) {
  const count = photos.length || (placeholder ? PLACEHOLDER_FRAMES : 0);
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [stopped, setStopped] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const swipeFrom = useRef<number | null>(null);
  const inView = useInView(rootRef, { threshold: 0.4 }, false);
  const reduced = usePrefersReducedMotion();
  const auto = count > 1 && !reduced && !stopped;

  // A fresh timer per photo, so a manual change also restarts the wait.
  useEffect(() => {
    if (!auto || held || !inView) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [auto, held, inView, index, count]);

  // Photos load as they come up (the one on show and the next), not all at once.
  const [loaded, setLoaded] = useState(() => new Set([0, 1 % count]));
  useEffect(() => {
    setLoaded((prev) => (prev.has(index) && prev.has((index + 1) % count) ? prev : new Set([...prev, index, (index + 1) % count])));
  }, [index, count]);

  const go = (step: number) => setIndex((i) => (i + step + count) % count);
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false);
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') swipeFrom.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const from = swipeFrom.current;
    swipeFrom.current = null;
    if (from !== null && Math.abs(e.clientX - from) > 40) go(e.clientX < from ? 1 : -1);
  };

  return (
    <div
      ref={rootRef}
      className={`ministry-carousel ${className}`.trim()}
      role="group"
      aria-roledescription="輪播"
      aria-label={label}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={onBlur}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (swipeFrom.current = null)}
    >
      <div className="ministry-carousel__slides">
        {Array.from({ length: count }, (_, i) => {
          const photo = photos[i];
          return (
            <div
              key={photo?.src ?? i}
              className={`ministry-carousel__slide${i === index ? ' is-active' : ''}`}
              role="group"
              aria-roledescription="照片"
              aria-label={`${i + 1}／${count}`}
              aria-hidden={i !== index}
            >
              {photo ? loaded.has(i) && <img src={asset(photo.src)} alt={photo.alt} decoding="async" /> : placeholder?.(i)}
            </div>
          );
        })}
      </div>
      {photos.length === 0 && placeholder && <span className="ministry__art-note">{ANTICIPATE.artNote}</span>}
      {count > 1 && (
        <>
          <button type="button" className="ministry-carousel__arrow ministry-carousel__arrow--prev" onClick={() => go(-1)} aria-label="上一張">
            <span aria-hidden="true">‹</span>
          </button>
          <button type="button" className="ministry-carousel__arrow ministry-carousel__arrow--next" onClick={() => go(1)} aria-label="下一張">
            <span aria-hidden="true">›</span>
          </button>
          <div className="ministry-carousel__bar">
            {indicator === 'dots' ? (
              Array.from({ length: count }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`ministry-carousel__dot${i === index ? ' is-active' : ''}`}
                  onClick={() => setIndex(i)}
                  aria-label={`第 ${i + 1} 張`}
                  aria-current={i === index ? 'true' : undefined}
                />
              ))
            ) : (
              <span className="ministry-carousel__count" aria-hidden="true">
                {index + 1}／{count}
              </span>
            )}
            {!reduced && (
              <button
                type="button"
                className="ministry-carousel__pause"
                onClick={() => setStopped((s) => !s)}
                aria-label={stopped ? '繼續輪播' : '暫停輪播'}
              >
                <span aria-hidden="true">{stopped ? '▶' : '❚❚'}</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MinistryArt({ kind, style }: { kind: Ministry['art']; style?: CSSProperties }) {
  const common = { viewBox: '0 0 400 300', className: `ministry-art ministry-art--${kind}`, style, 'aria-hidden': true } as const;
  switch (kind) {
    case 'building':
      return (
        <svg {...common}>
          <rect width="400" height="300" className="art-bg" />
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={40 + i * 38} y={90 - (i % 3) * 14} width="14" height={210} className="art-light" opacity={0.04 + (i % 3) * 0.02} />
          ))}
          <path d="M120 300V150a80 80 0 0 1 160 0v150" fill="none" className="art-line" strokeWidth="3" opacity=".9" />
          <path d="M150 300V160a50 50 0 0 1 100 0v140z" className="art-fill" opacity=".22" />
          <path d="M0 300l400-300" className="art-line-bright" strokeWidth="80" opacity=".05" />
        </svg>
      );
    case 'missions':
      return (
        <svg {...common}>
          <rect width="400" height="300" className="art-bg" />
          <g fill="none" className="art-line-light" opacity=".18">
            <circle cx="200" cy="150" r="110" />
            <ellipse cx="200" cy="150" rx="50" ry="110" />
            <ellipse cx="200" cy="150" rx="90" ry="110" />
            <path d="M90 150h220M104 95h192M104 205h192" />
          </g>
          <path d="M70 230C140 120 250 110 330 70" fill="none" className="art-line" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
          <circle cx="70" cy="230" r="7" className="art-fill" />
          <circle cx="330" cy="70" r="7" className="art-fill" />
        </svg>
      );
    case 'outreach':
      return (
        <svg {...common}>
          <rect width="400" height="300" className="art-bg" />
          {[
            [110, 120], [200, 90], [290, 130], [150, 200], [250, 205], [200, 150],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 5 ? 26 : 16} className={i === 5 ? 'art-fill' : 'art-light'} opacity={i === 5 ? 0.9 : 0.16} />
          ))}
          <g className="art-line" strokeWidth="2" opacity=".5">
            <path d="M200 150L110 120M200 150L200 90M200 150L290 130M200 150L150 200M200 150L250 205" />
          </g>
          <circle cx="200" cy="150" r="80" fill="none" className="art-line" opacity=".25" strokeDasharray="4 8" />
        </svg>
      );
    case 'cities':
      return (
        <svg {...common}>
          <rect width="400" height="300" className="art-bg" />
          <g className="art-light" opacity=".1">
            {Array.from({ length: 7 }, (_, i) => (
              <path key={i} d={`M0 ${60 + i * 30}h400`} strokeWidth="1" className="art-line-light" />
            ))}
          </g>
          <g fill="none" className="art-line" strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" opacity=".55">
            <path d="M200 150L95 95M200 150L310 85M200 150L120 225M200 150L300 215M310 85L300 215" />
          </g>
          {[
            [95, 95], [310, 85], [120, 225], [300, 215],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="18" className="art-light" opacity=".14" />
              <circle cx={x} cy={y} r="6" className="art-fill" opacity=".7" />
            </g>
          ))}
          <path d="M200 120c-14 0-24 10-24 23 0 18 24 39 24 39s24-21 24-39c0-13-10-23-24-23z" className="art-fill" />
          <circle cx="200" cy="143" r="8" className="art-bg" />
        </svg>
      );
    case 'online':
    default:
      return (
        <svg {...common}>
          <rect width="400" height="300" className="art-bg" />
          <g fill="none" className="art-line" strokeLinecap="round">
            <path d="M150 190a70 70 0 0 1 100 0" strokeWidth="3" opacity=".9" />
            <path d="M120 160a110 110 0 0 1 160 0" strokeWidth="3" opacity=".55" />
            <path d="M90 130a150 150 0 0 1 220 0" strokeWidth="3" opacity=".3" />
          </g>
          <circle cx="200" cy="215" r="10" className="art-fill" />
          <g className="art-light" opacity=".12">
            {Array.from({ length: 24 }, (_, i) => (
              <circle key={i} cx={20 + (i % 12) * 33} cy={i < 12 ? 40 : 270} r="3" />
            ))}
          </g>
        </svg>
      );
  }
}
