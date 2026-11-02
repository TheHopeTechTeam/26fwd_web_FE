import { useState } from 'react';
import { Modal } from '../components/Modal';
import { Phrases } from '../components/Phrases';
import { Reveal } from '../components/Reveal';
import { asset } from '../config/env';
import { APPRECIATE } from '../data/content';
import { JOURNEY_TAGS, TESTIMONIES, type JourneyTagId, type Testimony } from '../data/testimonies';
import './Appreciate.css';

const TAG_LABEL = Object.fromEntries(JOURNEY_TAGS.map((t) => [t.id, t])) as Record<JourneyTagId, (typeof JOURNEY_TAGS)[number]>;

/** 01 · Appreciate (US-03 / US-04): every testimony portrait in one same-size grid (#20). */
export function Appreciate() {
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = TESTIMONIES.find((t) => t.id === openId) ?? null;

  return (
    <section id="appreciate" className="chapter appreciate tone-light" tabIndex={-1} aria-labelledby="appreciate-title">
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
          <PortraitGrid onOpen={setOpenId} />
        </Reveal>
        <p className="note appreciate__note">{APPRECIATE.note}</p>
      </div>

      <Modal open={opened !== null} onClose={() => setOpenId(null)} labelledBy="testimony-name" className="testimony-modal">
        {({ closing }) => opened && <TestimonyDetail testimony={opened} playVideo={!closing} />}
      </Modal>
    </section>
  );
}

/** Every testimony at the same size (#20): no tag focus, no drift, name always visible. */
function PortraitGrid({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <ul className="portrait-grid" aria-label="見證人物">
      {TESTIMONIES.map((t) => (
        <li key={t.id}>
          <button type="button" className="portrait" onClick={() => onOpen(t.id)} aria-label={`開啟 ${t.name} 的見證：${t.quote}`}>
            <img className="portrait__img" src={asset(t.avatar_url)} alt="" width="240" height="240" loading="lazy" decoding="async" />
            <span className="portrait__name" aria-hidden="true">
              {t.name}
            </span>
          </button>
        </li>
      ))}
    </ul>
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
