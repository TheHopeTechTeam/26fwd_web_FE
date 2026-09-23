import { useEffect, useRef, useState } from 'react';
import { Phrases } from '../components/Phrases';
import { Reveal } from '../components/Reveal';
import { asset } from '../config/env';
import { MOODS, TRANSITION, type Mood } from '../data/content';
import { formatDuration } from '../lib/format';
import './Transition.css';

type PlayerState = 'paused' | 'loading' | 'playing' | 'error';

/**
 * 02 · Transition (US-05): pick a mood, the people-free backdrop and track info change
 * together, and music only ever starts from the visitor's own tap (no autoplay).
 */
export function Transition() {
  const [moodId, setMoodId] = useState<Mood['id']>('still');
  const mood = MOODS.find((m) => m.id === moodId) ?? MOODS[0]!;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<PlayerState>('paused');
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(mood.track.duration);

  // Switching mood stops the previous track; if music was already playing, the new
  // track continues from the same tap rather than starting on its own.
  const selectMood = (next: Mood) => {
    if (next.id === moodId) return;
    const audio = audioRef.current;
    const wasPlaying = state === 'playing' || state === 'loading';
    setMoodId(next.id);
    setTime(0);
    setDuration(next.track.duration);
    setState('paused');
    if (!audio) return;
    audio.pause();
    // src is managed here, not as a React prop: re-assigning it on render would
    // restart the media load and cut off the track that just started.
    audio.src = asset(next.track.src);
    if (wasPlaying) void play(audio);
  };

  const play = async (audio: HTMLAudioElement) => {
    setState('loading');
    try {
      await audio.play();
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') setState('error');
    }
  };

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (state === 'playing' || state === 'loading') audio.pause();
    else void play(audio);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && !audio.getAttribute('src')) audio.src = asset(mood.track.src);
    return () => audio?.pause();
    // Only the initial track; later changes go through selectMood.
  }, []);

  const progress = duration > 0 ? Math.min(1, time / duration) : 0;
  const playing = state === 'playing' || state === 'loading';

  return (
    <section id="transition" className="chapter transition" tabIndex={-1} aria-labelledby="transition-title" data-mood={mood.id}>
      <div className="transition__backdrops" aria-hidden="true">
        {MOODS.map((m) => (
          <div key={m.id} className={`transition__backdrop transition__backdrop--${m.id} ${m.id === mood.id ? 'is-on' : ''}`} />
        ))}
      </div>

      <div className="wrap transition__inner">
        <Reveal className="chapter__head">
          <p className="kicker">
            <span className="eyebrow-index">02</span> · Transition 轉身
          </p>
          <h2 id="transition-title" className="chapter__title display-zh">
            <Phrases text={TRANSITION.title} />
          </h2>
          <p className="lead">{TRANSITION.lead}</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="moods" role="radiogroup" aria-label="選擇此刻的心情">
            {MOODS.map((m, i) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={m.id === mood.id}
                className={`mood ${m.id === mood.id ? 'is-on' : ''}`}
                onClick={() => selectMood(m)}
              >
                <span className="mood__index">0{i + 1}</span>
                <span className="mood__zh display-zh">{m.zh}</span>
                <span className="mood__en">{m.en}</span>
                <span className="mood__desc">{m.description}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.18}>
          <div className={`player ${state === 'error' ? 'has-error' : ''}`}>
            <button
              type="button"
              className="player__toggle"
              onClick={toggle}
              aria-label={playing ? `暫停 ${mood.track.title}` : `播放 ${mood.track.title}`}
              aria-pressed={playing}
            >
              {state === 'loading' ? (
                <span className="spinner" />
              ) : playing ? (
                <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
                  <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
                </svg>
              )}
            </button>
            <div className="player__meta">
              <p className="player__title">
                {mood.track.title}
                <span className="player__mood">・{mood.zh}</span>
              </p>
              <p className="player__artist">{mood.track.artist}</p>
              <p className="player__desc">{mood.description}</p>
              <div className="player__bar" aria-hidden="true">
                <span style={{ transform: `scaleX(${progress})` }} />
              </div>
              <p className="player__time">
                <span>{formatDuration(time)}</span>
                <span>{formatDuration(duration)}</span>
              </p>
            </div>
            {state === 'error' && (
              <p className="player__error" role="alert">
                音訊暫時無法播放。可稍後再試，或查看
                <a href={asset(mood.track.sourceUrl)} target="_blank" rel="noopener noreferrer">
                  音樂來源說明
                </a>
                。
              </p>
            )}
            <audio
              ref={audioRef}
              preload="none"
              loop
              onPlaying={() => setState('playing')}
              onPause={() => setState((s) => (s === 'error' ? s : 'paused'))}
              onWaiting={() => setState('loading')}
              onError={() => setState('error')}
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => {
                if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration);
              }}
            />
          </div>
          <p className="note transition__note">
            {TRANSITION.note} 授權：{mood.track.license}・
            <a href={asset(mood.track.sourceUrl)} target="_blank" rel="noopener noreferrer">
              來源說明
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
