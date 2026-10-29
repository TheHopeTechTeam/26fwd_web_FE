import { useSyncExternalStore } from 'react';
import { asset } from '../config/env';
import { MUSIC } from '../data/content';

export type PlayerState = 'paused' | 'loading' | 'playing' | 'error';

/**
 * One background-music player for the whole page (GLB-02, #25 interim), shared by the header
 * switch and the Hero prompt so either one starts or stops the same audio. Music only ever
 * starts from the visitor's own tap (no autoplay).
 */
let audio: HTMLAudioElement | null = null;
let state: PlayerState = 'paused';
let fadeFrame = 0;
/** What the visitor last asked for; audio events never override it. */
let wanted = false;
const listeners = new Set<() => void>();

/** Starting and stopping ease in and out over this long, so the sound never jumps (#25). */
const FADE_MS = 500;
/** Playback level: a background bed, kept below full volume. */
const VOLUME = 0.7;

function setState(next: PlayerState) {
  if (state === next) return;
  state = next;
  listeners.forEach((listener) => listener());
}

function player(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.preload = 'none';
    audio.loop = true;
    audio.addEventListener('playing', () => {
      if (wanted) setState('playing');
    });
    audio.addEventListener('pause', () => setState(state === 'error' ? state : 'paused'));
    audio.addEventListener('waiting', () => {
      if (wanted) setState('loading');
    });
    audio.addEventListener('error', () => {
      wanted = false;
      setState('error');
    });
  }
  return audio;
}

/** Ramps the volume; a new fade cancels the one in progress. iOS ignores volume, so there it just plays or stops. */
function fadeTo(el: HTMLAudioElement, target: number, done?: () => void) {
  cancelAnimationFrame(fadeFrame);
  const from = el.volume;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / FADE_MS);
    el.volume = from + (target - from) * t;
    if (t < 1) fadeFrame = requestAnimationFrame(step);
    else done?.();
  };
  fadeFrame = requestAnimationFrame(step);
}

export async function toggleMusic(): Promise<void> {
  const el = player();
  if (wanted) {
    // The switch shows "off" at once; the sound fades out, then pauses.
    wanted = false;
    setState('paused');
    fadeTo(el, 0, () => el.pause());
    return;
  }
  // src is set on first play, so the page never downloads audio nobody asked for.
  if (!el.getAttribute('src')) el.src = asset(MUSIC.track.src);
  wanted = true;
  if (!el.paused) {
    // Turned back on mid fade-out: it never stopped, so just fade back up.
    setState('playing');
    fadeTo(el, VOLUME);
    return;
  }
  setState('loading');
  el.volume = 0;
  try {
    await el.play();
    // Turned off while it was still loading: stay off.
    if (!wanted) {
      el.pause();
      return;
    }
    fadeTo(el, VOLUME);
  } catch (error) {
    wanted = false;
    if ((error as DOMException)?.name !== 'AbortError') setState('error');
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMusic() {
  const current = useSyncExternalStore(subscribe, () => state, () => 'paused' as PlayerState);
  return { state: current, playing: current === 'playing' || current === 'loading', toggle: toggleMusic };
}
