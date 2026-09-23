import { useState } from 'react';
import { CountUp } from '../components/CountUp';
import { Phrases } from '../components/Phrases';
import { Reveal } from '../components/Reveal';
import { config } from '../config/env';
import { ANTICIPATE, MINISTRIES, ONE_WALL, type Ministry } from '../data/content';
import './Anticipate.css';

/** 03 · Anticipate (US-06): four ministries plus The One Wall / Prayer Map as item 05. */
export function Anticipate() {
  return (
    <section id="anticipate" className="chapter anticipate" tabIndex={-1} aria-labelledby="anticipate-title">
      <div className="wrap">
        <Reveal className="chapter__head">
          <p className="kicker">
            <span className="eyebrow-index">03</span> · Anticipate 期待
          </p>
          <h2 id="anticipate-title" className="chapter__title display-zh">
            <Phrases text={ANTICIPATE.title} />
          </h2>
          <p className="lead">{ANTICIPATE.lead}</p>
        </Reveal>

        <div className="ministries">
          {MINISTRIES.map((m, i) => (
            <MinistryBlock key={m.id} ministry={m} flip={i % 2 === 1} />
          ))}
        </div>

        <OneWall />
      </div>
    </section>
  );
}

function MinistryBlock({ ministry, flip }: { ministry: Ministry; flip: boolean }) {
  return (
    <article className={`ministry ${flip ? 'ministry--flip' : ''}`} aria-labelledby={`ministry-${ministry.id}`}>
      <Reveal className="ministry__media">
        <MinistryArt kind={ministry.art} />
        <span className="ministry__art-note">{ANTICIPATE.artNote}</span>
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
        <p className="ministry__body">{ministry.body}</p>
        <dl className="ministry__stats">
          {ministry.stats.map((s) => (
            <div key={s.label} className="ministry__stat">
              <dt>{s.label}</dt>
              <dd>
                <CountUp value={s.value} suffix={s.suffix} />
              </dd>
            </div>
          ))}
        </dl>
        <p className="note">{ANTICIPATE.statsNote}</p>
      </Reveal>
    </article>
  );
}

/** Abstract placeholder art — no people — until COMMS delivers real imagery. */
function MinistryArt({ kind }: { kind: Ministry['art'] }) {
  const common = { viewBox: '0 0 400 300', className: `ministry-art ministry-art--${kind}`, 'aria-hidden': true } as const;
  switch (kind) {
    case 'building':
      return (
        <svg {...common}>
          <rect width="400" height="300" fill="#22323a" />
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={40 + i * 38} y={90 - (i % 3) * 14} width="14" height={210} fill="#ffffff" opacity={0.04 + (i % 3) * 0.02} />
          ))}
          <path d="M120 300V150a80 80 0 0 1 160 0v150" fill="none" stroke="#ffc946" strokeWidth="3" opacity=".9" />
          <path d="M150 300V160a50 50 0 0 1 100 0v140z" fill="#ffc946" opacity=".22" />
          <path d="M0 300l400-300" stroke="#ffd873" strokeWidth="80" opacity=".05" />
        </svg>
      );
    case 'missions':
      return (
        <svg {...common}>
          <rect width="400" height="300" fill="#1f2c35" />
          <g fill="none" stroke="#ffffff" opacity=".18">
            <circle cx="200" cy="150" r="110" />
            <ellipse cx="200" cy="150" rx="50" ry="110" />
            <ellipse cx="200" cy="150" rx="90" ry="110" />
            <path d="M90 150h220M104 95h192M104 205h192" />
          </g>
          <path d="M70 230C140 120 250 110 330 70" fill="none" stroke="#ffc946" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
          <circle cx="70" cy="230" r="7" fill="#ffc946" />
          <circle cx="330" cy="70" r="7" fill="#ffc946" />
        </svg>
      );
    case 'outreach':
      return (
        <svg {...common}>
          <rect width="400" height="300" fill="#26332f" />
          {[
            [110, 120], [200, 90], [290, 130], [150, 200], [250, 205], [200, 150],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 5 ? 26 : 16} fill={i === 5 ? '#ffc946' : '#ffffff'} opacity={i === 5 ? 0.9 : 0.16} />
          ))}
          <g stroke="#ffc946" strokeWidth="2" opacity=".5">
            <path d="M200 150L110 120M200 150L200 90M200 150L290 130M200 150L150 200M200 150L250 205" />
          </g>
          <circle cx="200" cy="150" r="80" fill="none" stroke="#ffc946" opacity=".25" strokeDasharray="4 8" />
        </svg>
      );
    case 'online':
    default:
      return (
        <svg {...common}>
          <rect width="400" height="300" fill="#1d2a36" />
          <g fill="none" stroke="#ffc946" strokeLinecap="round">
            <path d="M150 190a70 70 0 0 1 100 0" strokeWidth="3" opacity=".9" />
            <path d="M120 160a110 110 0 0 1 160 0" strokeWidth="3" opacity=".55" />
            <path d="M90 130a150 150 0 0 1 220 0" strokeWidth="3" opacity=".3" />
          </g>
          <circle cx="200" cy="215" r="10" fill="#ffc946" />
          <g fill="#ffffff" opacity=".12">
            {Array.from({ length: 24 }, (_, i) => (
              <circle key={i} cx={20 + (i % 12) * 33} cy={i < 12 ? 40 : 270} r="3" />
            ))}
          </g>
        </svg>
      );
  }
}

/**
 * Item 05 (US-06 / US-11). Prayer Map currently sends frame-ancestors 'none' and
 * X-Frame-Options: DENY, so the iframe stays behind VITE_PRAYER_MAP_EMBED_ENABLED
 * and the default is a clear fallback with a new-tab link. No data from this site is
 * sent to Prayer Map (no query params, no-referrer).
 */
function OneWall() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const embed = config.prayerMapEmbedEnabled;

  return (
    <article className="one-wall" aria-labelledby="one-wall-title">
      <Reveal className="one-wall__head">
        <p className="ministry__index">{ONE_WALL.index}</p>
        <h3 id="one-wall-title" className="ministry__title">
          <span className="one-wall__en">{ONE_WALL.en}</span>
          <span className="display-zh one-wall__zh">{ONE_WALL.zh}</span>
        </h3>
        <p className="ministry__headline display-zh">{ONE_WALL.headline}</p>
        <p className="ministry__body">{ONE_WALL.body}</p>
      </Reveal>

      <Reveal className="one-wall__frame" delay={0.08}>
        {embed ? (
          <div className="one-wall__embed">
            {!iframeLoaded && (
              <div className="one-wall__loading">
                <span className="spinner" /> 載入 Prayer Map…
              </div>
            )}
            <iframe
              src={config.prayerMapUrl}
              title="Prayer Map 代禱地圖"
              loading="lazy"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              onLoad={() => setIframeLoaded(true)}
            />
          </div>
        ) : (
          <div className="one-wall__fallback">
            <div className="one-wall__map" aria-hidden="true">
              {Array.from({ length: 14 }, (_, i) => (
                <span key={i} style={{ left: `${(i * 37) % 92 + 4}%`, top: `${(i * 53) % 80 + 10}%`, animationDelay: `${-i * 0.7}s` }} />
              ))}
            </div>
            <div className="one-wall__fallback-text">
              <p className="one-wall__blocked">{ONE_WALL.blocked}</p>
            </div>
          </div>
        )}
        <div className="one-wall__actions">
          <a className="btn btn--gold" href={config.prayerMapUrl} target="_blank" rel="noopener noreferrer">
            開啟 Prayer Map
            <span aria-hidden="true">↗</span>
            <span className="sr-only">（在新分頁開啟）</span>
          </a>
          <a className="one-wall__privacy" href={config.prayerMapPrivacyUrl} target="_blank" rel="noopener noreferrer">
            Prayer Map 隱私權政策
          </a>
        </div>
        <p className="note">{ONE_WALL.privacy}</p>
      </Reveal>
    </article>
  );
}
