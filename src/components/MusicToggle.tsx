import { MUSIC } from '../data/content';
import { useMusic } from '../lib/music';

/**
 * Header background-music switch (#17 interim, GLB-02). The player itself lives in lib/music,
 * shared with the Hero prompt, so the music can be stopped from either place.
 */
export function MusicToggle() {
  const { state, playing, toggle } = useMusic();
  const { track } = MUSIC;

  const label =
    state === 'error' ? `背景音樂暫時無法播放，再試一次：${track.title}` : playing ? `暫停背景音樂：${track.title}` : `播放背景音樂：${track.title}`;

  return (
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
  );
}
