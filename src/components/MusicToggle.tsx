import { useEffect, useRef, useState } from 'react';
import { asset } from '../config/env';
import { MUSIC } from '../data/content';

type PlayerState = 'paused' | 'loading' | 'playing' | 'error';

/**
 * Header background-music switch (#17 interim, GLB-02): replaces the player that lived in the
 * removed Transition chapter. Music only ever starts from the visitor's own tap (no autoplay)
 * and can be stopped from anywhere on the page. #25 decides the final songs and behaviour.
 */
export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<PlayerState>('paused');
  const { track } = MUSIC;
  const playing = state === 'playing' || state === 'loading';

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      return;
    }
    // src is set on first play, so the page never downloads audio nobody asked for.
    if (!audio.getAttribute('src')) audio.src = asset(track.src);
    setState('loading');
    try {
      await audio.play();
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') setState('error');
    }
  };

  useEffect(() => () => audioRef.current?.pause(), []);

  const label =
    state === 'error' ? `背景音樂暫時無法播放，再試一次：${track.title}` : playing ? `暫停背景音樂：${track.title}` : `播放背景音樂：${track.title}`;

  return (
    <>
      <button
        type="button"
        className={`music-toggle ${playing ? 'is-on' : ''} ${state === 'error' ? 'has-error' : ''}`}
        onClick={toggle}
        aria-pressed={playing}
        aria-label={label}
        title={label}
      >
        {state === 'loading' ? (
          <span className="spinner" />
        ) : playing ? (
          // Moving bars while music plays (still under reduced motion, see SiteHeader.css).
          <span className="music-toggle__bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M9 18V6l11-2v12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6.5" cy="18" r="2.5" fill="currentColor" />
            <circle cx="17.5" cy="16" r="2.5" fill="currentColor" />
          </svg>
        )}
      </button>
      <audio
        ref={audioRef}
        preload="none"
        loop
        onPlaying={() => setState('playing')}
        onPause={() => setState((s) => (s === 'error' ? s : 'paused'))}
        onWaiting={() => setState('loading')}
        onError={() => setState('error')}
      />
    </>
  );
}
