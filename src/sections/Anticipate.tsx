import { CountUp } from '../components/CountUp';
import { Phrases } from '../components/Phrases';
import { Reveal } from '../components/Reveal';
import { ANTICIPATE, MINISTRIES, type Ministry } from '../data/content';
import './Anticipate.css';

/** 02 · Anticipate (US-06): the five ministries. Prayer Map is a link at the end of the journey (#19). */
export function Anticipate() {
  return (
    <section id="anticipate" className="chapter anticipate" tabIndex={-1} aria-labelledby="anticipate-title">
      <div className="wrap">
        <Reveal className="chapter__head">
          <p className="kicker">
            <span className="eyebrow-index">02</span> · Anticipate 期待
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
        {ministry.stats.length > 0 && (
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
        )}
        <p className="note">{ministry.pendingNote ?? ANTICIPATE.statsNote}</p>
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
