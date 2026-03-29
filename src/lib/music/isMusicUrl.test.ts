import { describe, it, expect } from 'vitest';
import { isMusicUrl } from './isMusicUrl';

describe('isMusicUrl', () => {
  // ─── Spotify ────────────────────────────────────────────────────────────────
  it('detects Spotify track URLs', () => {
    expect(isMusicUrl('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC')).toBe('spotify');
    expect(isMusicUrl('http://open.spotify.com/track/abc123')).toBe('spotify');
  });

  it('does not match Spotify homepage or artist page', () => {
    expect(isMusicUrl('https://open.spotify.com/artist/abc')).toBeNull();
    expect(isMusicUrl('https://open.spotify.com/')).toBeNull();
    expect(isMusicUrl('https://open.spotify.com/search/test')).toBeNull();
  });

  // ─── SoundCloud ─────────────────────────────────────────────────────────────
  it('detects SoundCloud track URLs', () => {
    expect(isMusicUrl('https://soundcloud.com/user/track-name')).toBe('soundcloud');
    expect(isMusicUrl('https://soundcloud.com/artist/title')).toBe('soundcloud');
  });

  it('does not match SoundCloud homepage or sets', () => {
    expect(isMusicUrl('https://soundcloud.com/discover')).toBeNull();
    expect(isMusicUrl('https://soundcloud.com/')).toBeNull();
  });

  // ─── YouTube ────────────────────────────────────────────────────────────────
  it('detects YouTube watch URLs', () => {
    expect(isMusicUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
    expect(isMusicUrl('https://youtube.com/watch?v=abc')).toBe('youtube');
  });

  it('detects YouTube shorts URLs', () => {
    expect(isMusicUrl('https://youtube.com/shorts/abc123')).toBe('youtube');
    expect(isMusicUrl('https://www.youtube.com/shorts/xyz')).toBe('youtube');
  });

  it('detects youtu.be short URLs', () => {
    expect(isMusicUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
    expect(isMusicUrl('https://youtu.be/abc')).toBe('youtube');
  });

  it('detects music.youtube.com watch URLs', () => {
    expect(isMusicUrl('https://music.youtube.com/watch?v=abc')).toBe('youtube');
  });

  it('does not match YouTube channel or playlist URLs', () => {
    expect(isMusicUrl('https://youtube.com/channel/abc')).toBeNull();
    expect(isMusicUrl('https://youtube.com/playlist?list=abc')).toBeNull();
  });

  // ─── Sound.xyz ──────────────────────────────────────────────────────────────
  it('detects Sound.xyz URLs', () => {
    expect(isMusicUrl('https://sound.xyz/artist/track')).toBe('soundxyz');
    expect(isMusicUrl('https://sound.xyz/collect/abc')).toBe('soundxyz');
    expect(isMusicUrl('https://zora.co/collect/0xabc/1')).toBe('soundxyz');
  });

  // ─── Audius ────────────────────────────────────────────────────────────────
  it('detects Audius track URLs', () => {
    expect(isMusicUrl('https://audius.co/artist/track-name')).toBe('audius');
    expect(isMusicUrl('https://audius.co/user/track')).toBe('audius');
  });

  it('does not match Audius homepage', () => {
    expect(isMusicUrl('https://audius.co/')).toBeNull();
    expect(isMusicUrl('https://audius.co/discover')).toBeNull();
  });

  // ─── Apple Music ───────────────────────────────────────────────────────────
  it('detects Apple Music album URLs', () => {
    expect(isMusicUrl('https://music.apple.com/us/album/test/123456')).toBe('applemusic');
    expect(isMusicUrl('https://music.apple.com/gb/album/artist-name/789')).toBe('applemusic');
  });

  it('detects Apple Music song URLs', () => {
    expect(isMusicUrl('https://music.apple.com/us/song/test/123456')).toBe('applemusic');
  });

  it('does not match Apple Music artist pages', () => {
    expect(isMusicUrl('https://music.apple.com/artist/abc')).toBeNull();
    expect(isMusicUrl('https://music.apple.com/')).toBeNull();
  });

  // ─── Tidal ──────────────────────────────────────────────────────────────────
  it('detects Tidal track URLs', () => {
    expect(isMusicUrl('https://tidal.com/track/12345678')).toBe('tidal');
    expect(isMusicUrl('https://tidal.com/browse/track/123')).toBe('tidal');
  });

  // ─── Bandcamp ──────────────────────────────────────────────────────────────
  it('detects Bandcamp track URLs', () => {
    expect(isMusicUrl('https://artist.bandcamp.com/track/track-name')).toBe('bandcamp');
    expect(isMusicUrl('https://myband.bandcamp.com/track/cool-track')).toBe('bandcamp');
  });

  it('does not match Bandcamp album URLs', () => {
    expect(isMusicUrl('https://artist.bandcamp.com/album/album-name')).toBeNull();
  });

  // ─── Direct audio files ─────────────────────────────────────────────────────
  it('detects direct MP3 URLs', () => {
    expect(isMusicUrl('https://example.com/audio.mp3')).toBe('audio');
    expect(isMusicUrl('https://cdn.example.com/song.mp3?token=abc')).toBe('audio');
  });

  it('detects direct audio with various extensions', () => {
    for (const ext of ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus']) {
      expect(isMusicUrl(`https://example.com/file.${ext}`)).toBe('audio');
    }
  });

  it('does not match non-audio URLs', () => {
    expect(isMusicUrl('https://example.com/image.png')).toBeNull();
    expect(isMusicUrl('https://example.com/video.mp4')).toBeNull();
    expect(isMusicUrl('https://example.com/doc.pdf')).toBeNull();
  });

  // ─── IPFS ──────────────────────────────────────────────────────────────────
  it('detects IPFS audio URLs', () => {
    expect(isMusicUrl('ipfs://QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX')).toBe('audio');
  });

  // ─── Non-music URLs ────────────────────────────────────────────────────────
  it('returns null for generic URLs', () => {
    expect(isMusicUrl('https://google.com')).toBeNull();
    expect(isMusicUrl('https://github.com/user/repo')).toBeNull();
    expect(isMusicUrl('https://twitter.com/user/status/123')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(isMusicUrl('')).toBeNull();
    expect(isMusicUrl('   ')).toBeNull();
  });
});
