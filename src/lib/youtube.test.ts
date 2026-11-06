import { describe, expect, it } from 'vitest';
import { playlistEmbedUrl, thumbnailUrl } from './youtube';

describe('thumbnailUrl', () => {
  it('points at the video still on i.ytimg.com', () => {
    expect(thumbnailUrl('aqz-KE-bpKQ')).toBe('https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg');
    expect(thumbnailUrl('aqz-KE-bpKQ', 'maxres')).toBe('https://i.ytimg.com/vi/aqz-KE-bpKQ/maxresdefault.jpg');
  });
});

describe('playlistEmbedUrl', () => {
  it('plays the whole playlist on the no-cookie host', () => {
    expect(playlistEmbedUrl('PLabc')).toBe(
      'https://www.youtube-nocookie.com/embed/videoseries?list=PLabc&autoplay=1&rel=0&playsinline=1',
    );
  });

  it('starts from the chosen video and keeps the playlist', () => {
    expect(playlistEmbedUrl('PLabc', 'vid_1')).toBe(
      'https://www.youtube-nocookie.com/embed/vid_1?list=PLabc&autoplay=1&rel=0&playsinline=1',
    );
  });
});
