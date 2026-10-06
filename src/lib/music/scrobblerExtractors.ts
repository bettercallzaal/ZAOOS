/**
 * Scrobbler DOM Metadata Extractors mined from onda Chrome Extension.
 * Extracts currently playing track, artist, album, and playback state across
 * Spotify, SoundCloud, Bandcamp, and YouTube Music.
 */

import type { TrackType } from '../../types/music';

export interface TrackScrobbleData {
  artist: string;
  track: string;
  album?: string;
  isPlaying: boolean;
  platform: TrackType;
}

/**
 * Extracts metadata from Spotify Web Player (open.spotify.com)
 */
export function extractSpotifyMetadata(
  doc: Document = typeof document !== 'undefined' ? document : ({} as Document)
): TrackScrobbleData | null {
  if (!doc.querySelector) return null;

  let track: string | null = null;
  let artist: string | null = null;

  // Method 1: data-testid selectors (Spotify Web Player)
  const titleEl = doc.querySelector('[data-testid="context-item-info-title"]');
  const artistEl = doc.querySelector('[data-testid="context-item-info-artist"]');

  if (titleEl && artistEl) {
    track = titleEl.textContent?.trim() || null;
    artist = artistEl.textContent?.trim() || null;
  }

  // Method 2: Now Playing bar widget link
  if (!track || !artist) {
    const nowPlayingTrack = doc.querySelector(
      '[data-testid="now-playing-widget"] [data-testid="context-item-link"]'
    );
    const nowPlayingArtist = doc.querySelector(
      '[data-testid="now-playing-widget"] [data-testid="context-item-info-artist"]'
    );
    if (nowPlayingTrack) track = nowPlayingTrack.textContent?.trim() || null;
    if (nowPlayingArtist) artist = nowPlayingArtist.textContent?.trim() || null;
  }

  // Method 3: document.title fallback (e.g. "Track - Artist | Spotify")
  if (!track || !artist) {
    const title = doc.title || '';
    const match = title.match(/^(.+?)\s[·\-]\s(.+?)\s*[|]/);
    if (match) {
      track = match[1].trim();
      artist = match[2].trim();
    }
  }

  if (!artist || !track) return null;

  // Check play state: play/pause button has "Pause" label when playing
  const playBtn = doc.querySelector('[data-testid="control-button-playpause"]');
  let isPlaying = false;
  if (playBtn) {
    const label = playBtn.getAttribute('aria-label')?.toLowerCase() || '';
    isPlaying = label.includes('pause');
  } else if (doc.title) {
    isPlaying = doc.title !== 'Spotify' && doc.title.includes('·');
  }

  return {
    artist,
    track,
    isPlaying,
    platform: 'spotify',
  };
}

/**
 * Extracts metadata from SoundCloud (soundcloud.com)
 */
export function extractSoundCloudMetadata(
  doc: Document = typeof document !== 'undefined' ? document : ({} as Document)
): TrackScrobbleData | null {
  if (!doc.querySelector) return null;

  let track: string | null = null;
  let artist: string | null = null;

  // Bottom player bar
  const titleEl = doc.querySelector('.playbackSoundBadge__titleLink');
  const artistEl = doc.querySelector('.playbackSoundBadge__lightLink');

  if (titleEl && artistEl) {
    track = titleEl.getAttribute('title')?.trim() || titleEl.textContent?.trim() || null;
    artist = artistEl.getAttribute('title')?.trim() || artistEl.textContent?.trim() || null;
  }

  // Document title fallback ("Artist - Track | SoundCloud")
  if (!track || !artist) {
    const title = doc.title || '';
    const match = title.match(/^(.+?)\s-\s(.+?)\s*\|/);
    if (match) {
      artist = match[1].trim();
      track = match[2].trim();
    }
  }

  if (!artist || !track) return null;

  const playBtn = doc.querySelector('.playControls__play');
  const isPlaying = playBtn ? playBtn.classList.contains('playing') : false;

  return {
    artist,
    track,
    isPlaying,
    platform: 'soundcloud',
  };
}

/**
 * Extracts metadata from Bandcamp (*.bandcamp.com)
 */
export function extractBandcampMetadata(
  doc: Document = typeof document !== 'undefined' ? document : ({} as Document)
): TrackScrobbleData | null {
  if (!doc.querySelector) return null;

  let track: string | null = null;
  let artist: string | null = null;

  // Method 1: Inline player track and band name
  const trackTitle = doc.querySelector('.title_link span');
  const bandName = doc.querySelector('#band-name-location .title');

  if (trackTitle) track = trackTitle.textContent?.trim() || null;
  if (bandName) artist = bandName.textContent?.trim() || null;

  // Method 2: Track page title area
  if (!track) {
    const trackNameEl = doc.querySelector('.trackTitle');
    if (trackNameEl) track = trackNameEl.textContent?.trim() || null;
  }
  if (!artist) {
    const artistEl = doc.querySelector('#name-section a span');
    if (artistEl) artist = artistEl.textContent?.trim() || null;
  }

  // Method 3: document.title ("Track | Artist")
  if (!track || !artist) {
    const title = doc.title || '';
    const match = title.match(/^(.+?)\s*\|\s*(.+?)$/);
    if (match) {
      track = match[1].trim();
      artist = match[2].trim();
    }
  }

  if (!artist || !track) return null;

  let isPlaying = false;
  const audio = doc.querySelector('audio') as HTMLAudioElement | null;
  if (audio) {
    isPlaying = !audio.paused && !audio.ended && audio.currentTime > 0;
  } else {
    const playBtn = doc.querySelector('.playbutton');
    if (playBtn) {
      isPlaying = playBtn.classList.contains('playing');
    }
  }

  return {
    artist,
    track,
    isPlaying,
    platform: 'bandcamp',
  };
}

/**
 * Extracts metadata from YouTube Music (music.youtube.com)
 */
export function extractYouTubeMusicMetadata(
  doc: Document = typeof document !== 'undefined' ? document : ({} as Document)
): TrackScrobbleData | null {
  if (!doc.querySelector) return null;

  let track: string | null = null;
  let artist: string | null = null;

  // YouTube Music player bar
  const titleEl = doc.querySelector('.title.ytmusic-player-bar');
  const artistEl = doc.querySelector('.byline.ytmusic-player-bar .yt-simple-endpoint');

  if (titleEl) track = titleEl.textContent?.trim() || null;
  if (artistEl) artist = artistEl.textContent?.trim() || null;

  // Fallback: full byline parsing ("Artist • Album • Year")
  if (!artist) {
    const byline = doc.querySelector('.byline.ytmusic-player-bar');
    if (byline) {
      const text = byline.textContent?.trim();
      if (text) {
        artist = text.split('•')[0]?.trim() || null;
      }
    }
  }

  // Fallback: document title ("Track - Artist - YouTube Music")
  if (!track || !artist) {
    const title = doc.title || '';
    const match = title.match(/^(.+?)\s-\s(.+?)\s-\s*YouTube Music/);
    if (match) {
      track = match[1].trim();
      artist = match[2].trim();
    }
  }

  if (!artist || !track) return null;

  let isPlaying = false;
  const video = doc.querySelector('video') as HTMLVideoElement | null;
  if (video) {
    isPlaying = !video.paused && !video.ended && (video.readyState ?? 0) > 2;
  }

  return {
    artist,
    track,
    isPlaying,
    platform: 'youtube',
  };
}

/**
 * Unified platform scrobbler metadata extractor
 */
export function extractScrobbleMetadata(
  platform: TrackType,
  doc?: Document
): TrackScrobbleData | null {
  switch (platform) {
    case 'spotify':
      return extractSpotifyMetadata(doc);
    case 'soundcloud':
      return extractSoundCloudMetadata(doc);
    case 'bandcamp':
      return extractBandcampMetadata(doc);
    case 'youtube':
      return extractYouTubeMusicMetadata(doc);
    default:
      return null;
  }
}
