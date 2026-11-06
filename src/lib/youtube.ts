/**
 * YouTube helpers for the testimony playlist (11/05). No API key and no backend: the list of
 * videos comes from the IFrame player itself (getPlaylist) and each title from YouTube's
 * public oEmbed. The hosts used here are allowed in the page's CSP (public/_headers).
 */
export const YT_EMBED_HOST = 'https://www.youtube-nocookie.com';

const API_SRC = 'https://www.youtube.com/iframe_api';

/** The part of the IFrame player API this site uses. */
export interface YTPlayer {
  getPlaylist(): string[] | null;
  getPlaylistIndex(): number;
  playVideo(): void;
  playVideoAt(index: number): void;
  destroy(): void;
}

interface YTPlayerOptions {
  host?: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: () => void;
    onStateChange?: (event: { data: number }) => void;
    onError?: (event: { data: number }) => void;
  };
}

export interface YTNamespace {
  Player: new (element: HTMLElement, options: YTPlayerOptions) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** `YT.PlayerState.PLAYING` */
export const YT_PLAYING = 1;

export function thumbnailUrl(videoId: string, size: 'hq' | 'maxres' = 'hq'): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/${size}default.jpg`;
}

/** A plain embed of the playlist, from `videoId` when given: used when the player script cannot load. */
export function playlistEmbedUrl(playlistId: string, videoId?: string): string {
  const query = new URLSearchParams({ list: playlistId, autoplay: '1', rel: '0', playsinline: '1' });
  const path = videoId ? encodeURIComponent(videoId) : 'videoseries';
  return `${YT_EMBED_HOST}/embed/${path}?${query}`;
}

let apiPromise: Promise<YTNamespace> | null = null;

/** Loads the IFrame player API once per page; rejects when it is blocked or too slow. */
export function loadYouTubeApi(timeoutMs = 10_000): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise<YTNamespace>((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        if (window.YT) resolve(window.YT);
      };
      const script = document.createElement('script');
      script.src = API_SRC;
      script.async = true;
      script.onerror = () => reject(new Error('YouTube player API blocked'));
      document.head.append(script);
      window.setTimeout(() => reject(new Error('YouTube player API timed out')), timeoutMs);
    }).catch((error: unknown) => {
      apiPromise = null;
      throw error;
    });
  }
  return apiPromise;
}

/** The video's title from YouTube's oEmbed (works for unlisted videos), or null. */
export async function fetchVideoTitle(videoId: string, signal?: AbortSignal): Promise<string | null> {
  const watch = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`, { signal });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const title = (data as { title?: unknown }).title;
    return typeof title === 'string' && title.trim() ? title.trim() : null;
  } catch {
    return null;
  }
}
