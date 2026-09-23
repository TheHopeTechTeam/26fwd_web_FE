import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Modal } from '../components/Modal';
import { Phrases } from '../components/Phrases';
import { Reveal } from '../components/Reveal';
import { asset } from '../config/env';
import { APPRECIATE } from '../data/content';
import { JOURNEY_TAGS, TESTIMONIES, type JourneyTagId, type Testimony } from '../data/testimonies';
import { computeFloatLayout } from '../lib/floatLayout';
import { useInView } from '../lib/hooks';
import './Appreciate.css';

const TAG_LABEL = Object.fromEntries(JOURNEY_TAGS.map((t) => [t.id, t])) as Record<JourneyTagId, (typeof JOURNEY_TAGS)[number]>;

/** 01 · Appreciate (US-03 / US-04): free-floating testimony portraits with tag focus. */
export function Appreciate() {
  const [focusTag, setFocusTag] = useState<JourneyTagId | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = TESTIMONIES.find((t) => t.id === openId) ?? null;

  const counts = useMemo(() => {
    const map = new Map<JourneyTagId, number>();
    for (const t of TESTIMONIES) for (const tag of t.tags) map.set(tag, (map.get(tag) ?? 0) + 1);
    return map;
  }, []);

  return (
    <section id="appreciate" className="chapter appreciate" tabIndex={-1} aria-labelledby="appreciate-title">
      <div className="wrap">
        <Reveal className="chapter__head">
          <p className="kicker">
            <span className="eyebrow-index">01</span> · Appreciate 感謝
          </p>
          <h2 id="appreciate-title" className="chapter__title display-zh">
            <Phrases text={APPRECIATE.title} />
          </h2>
          <p className="lead">{APPRECIATE.lead}</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="journey-tags" role="group" aria-label="依信仰歷程聚焦">
            <button
              type="button"
              className={`journey-tags__all ${focusTag === null ? 'is-on' : ''}`}
              aria-pressed={focusTag === null}
              onClick={() => setFocusTag(null)}
            >
              全部 <span className="journey-tags__count">{TESTIMONIES.length}</span>
            </button>
            <ol className="journey-tags__path">
              {JOURNEY_TAGS.map((tag, i) => (
                <li key={tag.id}>
                  <button
                    type="button"
                    className={`journey-tags__step ${focusTag === tag.id ? 'is-on' : ''}`}
                    aria-pressed={focusTag === tag.id}
                    onClick={() => setFocusTag(focusTag === tag.id ? null : tag.id)}
                  >
                    <span className="journey-tags__num" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span>
                      {tag.zh} <span className="journey-tags__en">{tag.en}</span>
                    </span>
                    <span className="journey-tags__count">{counts.get(tag.id) ?? 0}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        <FloatingPortraits focusTag={focusTag} onOpen={setOpenId} />
        <p className="note appreciate__note">{APPRECIATE.note}</p>
      </div>

      <Modal open={opened !== null} onClose={() => setOpenId(null)} labelledBy="testimony-name" className="testimony-modal">
        {({ closing }) => opened && <TestimonyDetail testimony={opened} playVideo={!closing} />}
      </Modal>
    </section>
  );
}

function FloatingPortraits({ focusTag, onOpen }: { focusTag: JourneyTagId | null; onOpen: (id: string) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  // Pause the drift animations while the stage is off screen.
  const visible = useInView(stageRef, { rootMargin: '120px 0px' }, false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => (width ? computeFloatLayout(TESTIMONIES.length, width) : null), [width]);

  return (
    <div
      ref={stageRef}
      className={`float-stage ${focusTag ? 'has-focus' : ''} ${visible ? '' : 'is-paused'}`}
      style={{ height: layout ? layout.height : undefined }}
    >
      <ul className="float-stage__list" aria-label="見證人物">
        {layout &&
          TESTIMONIES.map((t, i) => {
            const slot = layout.slots[i];
            if (!slot) return null;
            const match = focusTag !== null && t.tags.includes(focusTag);
            const state = focusTag === null ? '' : match ? 'is-match' : 'is-muted';
            const style = {
              left: `${slot.x}px`,
              top: `${slot.y}px`,
              width: `${slot.size}px`,
              '--dx1': `${slot.dx1}px`,
              '--dy1': `${slot.dy1}px`,
              '--dx2': `${slot.dx2}px`,
              '--dy2': `${slot.dy2}px`,
              animationDuration: `${slot.duration}s`,
              animationDelay: `${slot.delay}s`,
            } as CSSProperties;
            return (
              <li key={t.id} className={`floater ${state}`} style={style}>
                <button
                  type="button"
                  className="floater__button"
                  onClick={() => onOpen(t.id)}
                  aria-label={`開啟 ${t.name} 的見證：${t.quote}`}
                >
                  <img className="floater__img" src={asset(t.avatar_url)} alt="" width="240" height="240" loading="lazy" decoding="async" />
                  <span className="floater__name" aria-hidden="true">
                    {t.name}
                  </span>
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

function TestimonyDetail({ testimony, playVideo }: { testimony: Testimony; playVideo: boolean }) {
  const paragraphs = testimony.story_full.split(/\n\s*\n/);
  return (
    <article className="testimony">
      <div className="testimony__media">
        <img src={asset(testimony.avatar_url)} alt={`${testimony.name} 的示意肖像`} width="240" height="240" />
        {testimony.synthetic && <span className="testimony__synthetic">SYNTHETIC · 合成示意</span>}
      </div>
      <div className="testimony__body">
        <p className="kicker">Testimony · 見證</p>
        <h3 id="testimony-name" className="testimony__name">
          {testimony.name}
        </h3>
        <ul className="testimony__tags" aria-label="信仰歷程">
          {testimony.tags.map((tag) => (
            <li key={tag}>
              {TAG_LABEL[tag].zh} <span>{TAG_LABEL[tag].en}</span>
            </li>
          ))}
        </ul>
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
            {testimony.synthetic && <p className="note">測試影片：Big Buck Bunny（Blender Foundation，CC BY 3.0）</p>}
          </div>
        )}
      </div>
    </article>
  );
}
