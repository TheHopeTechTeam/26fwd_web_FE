import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { prefersReducedMotion } from '../lib/hooks';
import {
  fetchVideoTitle,
  loadYouTubeApi,
  playlistEmbedUrl,
  thumbnailUrl,
  YT_EMBED_HOST,
  YT_PLAYING,
  type YTPlayer,
} from '../lib/youtube';
import './VideoPlaylist.css';

interface Video {
  id: string;
  /** From YouTube's oEmbed; null until it arrives (or when it fails). */
  title: string | null;
}

interface VideoPlaylistProps {
  playlistId: string;
  /** Section name on the cover, e.g. 見證影片. */
  title: string;
  /** One line under it before the list arrives. */
  hint: string;
  /** Heading of the thumbnail list. */
  listLabel: string;
  note?: string;
}

/**
 * Testimony playlist (11/05): a big player with the playlist's other videos listed beside it
 * (below on phones), like the 混合版 mockup. Everything comes from Comms' YouTube playlist, so
 * a video they add there shows up here without a deploy. YouTube's player only loads when the
 * block comes near the screen (on it, on phones); until then (and until play) the cover is the
 * site's own.
 * Without the player script (blocked or offline) the cover opens a plain playlist embed.
 */
export function VideoPlaylist({ playlistId, title, hint, listLabel, note }: VideoPlaylistProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  /** A video asked for before the player was ready. */
  const pendingRef = useRef<number | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fallback, setFallback] = useState(false);
  /** The playlist has been read (or given up on); until then the list's place is held. */
  const [settled, setSettled] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  /** The list scrolls (a long playlist) and has more past the edge: fade that edge. */
  const [moreHidden, setMoreHidden] = useState(false);

  const checkMore = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setMoreHidden(
      el.scrollTop + el.clientHeight < el.scrollHeight - 4 || el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    );
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    checkMore();
    const observer = new ResizeObserver(checkMore);
    observer.observe(el);
    return () => observer.disconnect();
  }, [videos.length, checkMore]);

  // Keeps the video in the big player in sight inside the list (e.g. after it moves on by
  // itself); only the list scrolls, never the page.
  useEffect(() => {
    const el = listRef.current;
    const item = el?.children[current] as HTMLElement | undefined;
    if (!el || !item) return;
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    if (el.scrollHeight > el.clientHeight + 1) {
      const top = item.offsetTop;
      if (top < el.scrollTop || top + item.offsetHeight > el.scrollTop + el.clientHeight) el.scrollTo({ top, behavior });
    } else if (el.scrollWidth > el.clientWidth + 1) {
      const left = item.offsetLeft;
      if (left < el.scrollLeft || left + item.offsetWidth > el.scrollLeft + el.clientWidth) el.scrollTo({ left, behavior });
    }
  }, [current]);

  const startAt = useCallback((index: number) => {
    const player = playerRef.current;
    if (!player || !readyRef.current) {
      pendingRef.current = index;
      return;
    }
    if (index === player.getPlaylistIndex()) player.playVideo();
    else player.playVideoAt(index);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const mount = mountRef.current;
    if (!root || !mount) return;
    let cancelled = false;
    let player: YTPlayer | null = null;
    const titles = new AbortController();

    const readPlaylist = (tries = 0) => {
      if (cancelled || !player) return;
      const ids = player.getPlaylist();
      if (!ids?.length) {
        if (tries < 40) window.setTimeout(() => readPlaylist(tries + 1), 100);
        else setSettled(true);
        return;
      }
      setVideos(ids.map((id) => ({ id, title: null })));
      setSettled(true);
      ids.forEach((id) => {
        void fetchVideoTitle(id, titles.signal).then((t) => {
          if (!cancelled && t) setVideos((list) => list.map((v) => (v.id === id ? { ...v, title: t } : v)));
        });
      });
    };

    const start = () => {
      loadYouTubeApi()
        .then((YT) => {
          if (cancelled) return;
          // The player replaces this element with its iframe; React never owns it.
          const host = document.createElement('div');
          mount.append(host);
          player = new YT.Player(host, {
            host: YT_EMBED_HOST,
            width: '100%',
            height: '100%',
            playerVars: { listType: 'playlist', list: playlistId, rel: 0, playsinline: 1 },
            events: {
              onReady: () => {
                readyRef.current = true;
                readPlaylist();
                if (pendingRef.current !== null) {
                  const index = pendingRef.current;
                  pendingRef.current = null;
                  startAt(index);
                }
              },
              // Follows the player when it moves on to the next video by itself.
              onStateChange: ({ data }) => {
                const index = player?.getPlaylistIndex() ?? -1;
                if (index >= 0) setCurrent(index);
                if (data === YT_PLAYING) setPlaying(true);
              },
            },
          });
          playerRef.current = player;
        })
        .catch(() => {
          if (cancelled) return;
          setFallback(true);
          setSettled(true);
        });
    };

    // Wide screens get the player a little before the block scrolls in. Phones wait until
    // it is on screen: loading YouTube's player mid-scroll made scrolling stutter there.
    const touch = window.matchMedia('(pointer: coarse)').matches;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          start();
        }
      },
      touch ? { threshold: 0.3 } : { rootMargin: '300px 0px' },
    );
    observer.observe(root);

    return () => {
      cancelled = true;
      observer.disconnect();
      titles.abort();
      player?.destroy();
      playerRef.current = null;
      readyRef.current = false;
      mount.replaceChildren();
    };
  }, [playlistId, startAt]);

  const play = (index: number) => {
    setCurrent(index);
    setPlaying(true);
    if (!fallback) startAt(index);
  };

  const shown = videos[current];
  const hasList = videos.length > 1;
  // Until the playlist arrives, blank cards hold the list's place (11/06): the list appearing
  // later pushed everything under it down, and iPhone Safari (no scroll anchoring) jumped the
  // page under the reader.
  const waiting = !settled;
  const label = (v: Video, i: number) => v.title ?? `${title} ${i + 1}`;

  return (
    <div ref={rootRef} className={`video-playlist${hasList || waiting ? ' has-list' : ''}`}>
      <div className="video-playlist__body">
        <div className="video-playlist__frame">
          {/* Not reachable by keyboard while the cover sits on top. */}
          <div ref={mountRef} className="video-playlist__player" inert={!playing} />
          {playing && fallback && (
            <iframe
              key={shown?.id ?? 'list'}
              src={playlistEmbedUrl(playlistId, shown?.id)}
              title={shown ? label(shown, current) : title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
          {!playing && (
            <button
              type="button"
              className="video-playlist__cover"
              onClick={() => play(current)}
              aria-label={`播放${shown ? `：${label(shown, current)}` : title}`}
            >
              {shown && <CoverImage key={shown.id} videoId={shown.id} />}
              <span className="video-playlist__play" aria-hidden="true" />
              <span className="video-playlist__caption">
                <span className="video-playlist__kicker">
                  {title}
                  {hasList && ` · ${current + 1}／${videos.length}`}
                </span>
                <span className="video-playlist__title">{shown ? label(shown, current) : hint}</span>
              </span>
            </button>
          )}
        </div>

        {waiting && (
          <div className="video-playlist__aside" aria-hidden="true">
            <p className="video-playlist__list-head">{listLabel}</p>
            <ul className="video-playlist__list">
              {[0, 1, 2].map((i) => (
                <li key={i}>
                  <span className="video-playlist__item is-placeholder">
                    <span className="video-playlist__thumb" />
                    <span className="video-playlist__item-text">
                      <span className="video-playlist__item-title" />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasList && (
          <div className="video-playlist__aside">
            <p className="video-playlist__list-head">
              {listLabel}
              <span>共 {videos.length} 支</span>
            </p>
            <ul
              ref={listRef}
              className={`video-playlist__list${moreHidden ? ' has-more' : ''}`}
              aria-label={listLabel}
              onScroll={checkMore}
            >
              {videos.map((v, i) => {
                const isCurrent = i === current;
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      className={`video-playlist__item${isCurrent ? ' is-current' : ''}`}
                      onClick={() => play(i)}
                      aria-current={isCurrent ? 'true' : undefined}
                    >
                      <span className="video-playlist__thumb">
                        <img src={thumbnailUrl(v.id)} alt="" loading="lazy" decoding="async" />
                        <span className="video-playlist__play video-playlist__play--sm" aria-hidden="true" />
                      </span>
                      <span className="video-playlist__item-text">
                        <span className="video-playlist__item-title">{label(v, i)}</span>
                        {isCurrent && playing && <span className="video-playlist__now">播放中</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      {note && <p className="note video-playlist__note">{note}</p>}
    </div>
  );
}

/** The video's own still behind the cover: the large one when YouTube has it, else the 480px one. */
function CoverImage({ videoId }: { videoId: string }) {
  const [size, setSize] = useState<'maxres' | 'hq'>('maxres');
  // YouTube answers a missing large still with a 120px placeholder rather than an error.
  const onLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    if (size === 'maxres' && e.currentTarget.naturalWidth <= 120) setSize('hq');
  };
  return (
    <img
      className="video-playlist__still"
      src={thumbnailUrl(videoId, size)}
      alt=""
      decoding="async"
      onLoad={onLoad}
      onError={() => setSize('hq')}
    />
  );
}
