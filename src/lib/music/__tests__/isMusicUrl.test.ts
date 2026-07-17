// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { isMusicUrl } from '../isMusicUrl';

describe('isMusicUrl', () => {
  it('returns null for an empty string', () => {
    expect(isMusicUrl('')).toBeNull();
  });

  it('returns null for an arbitrary non-music URL', () => {
    expect(isMusicUrl('https://example.com/page')).toBeNull();
  });

  // Spotify
  it('returns "spotify" for a Spotify track URL', () => {
    expect(isMusicUrl('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC')).toBe('spotify');
  });

  // SoundCloud
  it('returns "soundcloud" for a SoundCloud artist/track URL (2 segments)', () => {
    expect(isMusicUrl('https://soundcloud.com/artist/track-name')).toBe('soundcloud');
  });

  it('returns null for a SoundCloud homepage URL (1 segment)', () => {
    expect(isMusicUrl('https://soundcloud.com/artist')).toBeNull();
  });

  // sound.xyz
  it('returns "soundxyz" for a sound.xyz URL', () => {
    expect(isMusicUrl('https://sound.xyz/artist/track')).toBe('soundxyz');
  });

  // zora.co
  it('returns "soundxyz" for a zora.co/collect/ URL', () => {
    expect(isMusicUrl('https://zora.co/collect/0xabc')).toBe('soundxyz');
  });

  // YouTube
  it('returns "youtube" for a YouTube watch URL', () => {
    expect(isMusicUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
  });

  it('returns "youtube" for a YouTube Shorts URL', () => {
    expect(isMusicUrl('https://www.youtube.com/shorts/abc123')).toBe('youtube');
  });

  it('returns "youtube" for a youtu.be short URL', () => {
    expect(isMusicUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
  });

  // Audius
  it('returns "audius" for an Audius artist/track URL (2 segments)', () => {
    expect(isMusicUrl('https://audius.co/artist/track-name')).toBe('audius');
  });

  // Apple Music
  it('returns "applemusic" for an Apple Music album URL', () => {
    expect(isMusicUrl('https://music.apple.com/us/album/album-name/123456789')).toBe('applemusic');
  });

  it('returns "applemusic" for an Apple Music song URL', () => {
    expect(isMusicUrl('https://music.apple.com/us/song/song-name/987654321')).toBe('applemusic');
  });

  // Tidal
  it('returns "tidal" for a Tidal track URL', () => {
    expect(isMusicUrl('https://tidal.com/track/12345678')).toBe('tidal');
  });

  it('returns "tidal" for a Tidal browse/track URL', () => {
    expect(isMusicUrl('https://tidal.com/browse/track/12345678')).toBe('tidal');
  });

  // Bandcamp
  it('returns "bandcamp" for a Bandcamp track URL', () => {
    expect(isMusicUrl('https://artist.bandcamp.com/track/song-name')).toBe('bandcamp');
  });

  // IPFS
  it('returns "audio" for an ipfs:// URL', () => {
    expect(isMusicUrl('ipfs://Qm1234567890abcdef')).toBe('audio');
  });

  // Audio file extensions
  it('returns "audio" for an .mp3 URL', () => {
    expect(isMusicUrl('https://cdn.example.com/track.mp3')).toBe('audio');
  });

  it('returns "audio" for a .wav URL', () => {
    expect(isMusicUrl('https://cdn.example.com/track.wav')).toBe('audio');
  });
});
