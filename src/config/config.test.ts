import { describe, expect, it } from 'vitest';
import { DEFAULT_PRAYER_MAP_URL, parseHttpsUrl, readConfig } from './env';
import { buildGiveUrl } from './give';

describe('readConfig', () => {
  it('defaults to a safe, mock-only setup', () => {
    const config = readConfig({});
    expect(config.apiMode).toBe('mock');
    expect(config.giveUrl).toBeNull();
    expect(config.ga4MeasurementId).toBeNull();
    expect(config.prayerMapEmbedEnabled).toBe(false);
    expect(config.prayerMapUrl).toBe(DEFAULT_PRAYER_MAP_URL);
    expect(config.prayerMapPrivacyUrl).toBe('https://prayer-map-omega.vercel.app/privacy');
  });

  it('keeps Give disabled unless the URL is https', () => {
    expect(readConfig({ VITE_GIVE_URL: 'http://thehope.co/give' }).giveUrl).toBeNull();
    expect(readConfig({ VITE_GIVE_URL: 'javascript:alert(1)' }).giveUrl).toBeNull();
    expect(readConfig({ VITE_GIVE_URL: 'https://thehope.co/give' }).giveUrl).toBe('https://thehope.co/give');
  });

  it('only accepts well-formed GA4 IDs', () => {
    expect(readConfig({ VITE_GA4_MEASUREMENT_ID: 'UA-1234' }).ga4MeasurementId).toBeNull();
    expect(readConfig({ VITE_GA4_MEASUREMENT_ID: 'G-ABC1234' }).ga4MeasurementId).toBe('G-ABC1234');
  });

  it('parses boolean flags', () => {
    expect(readConfig({ VITE_PRAYER_MAP_EMBED_ENABLED: 'true' }).prayerMapEmbedEnabled).toBe(true);
    expect(readConfig({ VITE_SHOW_PREVIEW_BADGE: 'false' }).showPreviewBadge).toBe(false);
  });

  it('switches to live mode only when asked', () => {
    const config = readConfig({ VITE_API_MODE: 'live', VITE_API_BASE_URL: 'https://api.example.org/' });
    expect(config.apiMode).toBe('live');
    expect(config.apiBaseUrl).toBe('https://api.example.org');
  });
});

describe('parseHttpsUrl', () => {
  it('rejects blanks and relative paths', () => {
    expect(parseHttpsUrl('')).toBeNull();
    expect(parseHttpsUrl('/give')).toBeNull();
  });
});

describe('buildGiveUrl', () => {
  it('adds the FORWARD UTM set and keeps existing params', () => {
    const url = new URL(buildGiveUrl('https://thehope.co/give?fund=forward', 'respond_finale'));
    expect(url.searchParams.get('fund')).toBe('forward');
    expect(url.searchParams.get('utm_source')).toBe('forward_site');
    expect(url.searchParams.get('utm_medium')).toBe('website');
    expect(url.searchParams.get('utm_campaign')).toBe('forward_2026');
    expect(url.searchParams.get('utm_content')).toBe('respond_finale');
  });
});
