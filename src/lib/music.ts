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
const listeners = new Set<() => void>();

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
    audio.addEventListener('playing', () => setState('playing'));
    audio.addEventListener('pause', () => setState(state === 'error' ? state : 'paused'));
    audio.addEventListener('waiting', () => setState('loading'));
    audio.addEventListener('error', () => setState('error'));
  }
  return audio;
}

export async function toggleMusic(): Promise<void> {
  const el = player();
  if (state === 'playing' || state === 'loading') {
    el.pause();
    return;
  }
  // src is set on first play, so the page never downloads audio nobody asked for.
  if (!el.getAttribute('src')) el.src = asset(MUSIC.track.src);
  setState('loading');
  try {
    await el.play();
  } catch (error) {
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
