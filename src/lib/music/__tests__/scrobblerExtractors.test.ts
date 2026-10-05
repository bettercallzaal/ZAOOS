import { describe, expect, it } from 'vitest';
import {
  extractBandcampMetadata,
  extractScrobbleMetadata,
  extractSoundCloudMetadata,
  extractSpotifyMetadata,
  extractYouTubeMusicMetadata,
} from '../scrobblerExtractors';

describe('scrobblerExtractors', () => {
  describe('extractSpotifyMetadata', () => {
    it('returns null when document has no track elements', () => {
      const doc = document.implementation.createHTMLDocument();
      expect(extractSpotifyMetadata(doc)).toBeNull();
    });

    it('extracts track and artist via data-testid', () => {
      const doc = document.implementation.createHTMLDocument();
      doc.body.innerHTML = `
        <div data-testid="context-item-info-title">Song Title</div>
        <div data-testid="context-item-info-artist">Artist Name</div>
        <button data-testid="control-button-playpause" aria-label="Pause"></button>
      `;
      const res = extractSpotifyMetadata(doc);
      expect(res).not.toBeNull();
      expect(res?.track).toBe('Song Title');
      expect(res?.artist).toBe('Artist Name');
      expect(res?.isPlaying).toBe(true);
      expect(res?.platform).toBe('spotify');
    });

    it('falls back to document title match', () => {
      const doc = document.implementation.createHTMLDocument();
      doc.title = 'Track Name · Artist Name | Spotify';
      const res = extractSpotifyMetadata(doc);
      expect(res).not.toBeNull();
      expect(res?.track).toBe('Track Name');
      expect(res?.artist).toBe('Artist Name');
      expect(res?.isPlaying).toBe(true);
    });
  });

  describe('extractSoundCloudMetadata', () => {
    it('returns null when document is empty', () => {
      const doc = document.implementation.createHTMLDocument();
      expect(extractSoundCloudMetadata(doc)).toBeNull();
    });

    it('extracts track and artist from playbackSoundBadge', () => {
      const doc = document.implementation.createHTMLDocument();
      doc.body.innerHTML = `
        <a class="playbackSoundBadge__titleLink" title="Sound Track">Sound Track</a>
        <a class="playbackSoundBadge__lightLink" title="Sound Artist">Sound Artist</a>
        <button class="playControls__play playing"></button>
      `;
      const res = extractSoundCloudMetadata(doc);
      expect(res).not.toBeNull();
      expect(res?.track).toBe('Sound Track');
      expect(res?.artist).toBe('Sound Artist');
      expect(res?.isPlaying).toBe(true);
      expect(res?.platform).toBe('soundcloud');
    });
  });

  describe('extractBandcampMetadata', () => {
    it('returns null when document is empty', () => {
      const doc = document.implementation.createHTMLDocument();
      expect(extractBandcampMetadata(doc)).toBeNull();
    });

    it('extracts track and band name from inline player', () => {
      const doc = document.implementation.createHTMLDocument();
      doc.body.innerHTML = `
        <div class="title_link"><span>Camp Track</span></div>
        <div id="band-name-location"><span class="title">Camp Artist</span></div>
        <button class="playbutton playing"></button>
      `;
      const res = extractBandcampMetadata(doc);
      expect(res).not.toBeNull();
      expect(res?.track).toBe('Camp Track');
      expect(res?.artist).toBe('Camp Artist');
      expect(res?.isPlaying).toBe(true);
      expect(res?.platform).toBe('bandcamp');
    });
  });

  describe('extractYouTubeMusicMetadata', () => {
    it('returns null when document is empty', () => {
      const doc = document.implementation.createHTMLDocument();
      expect(extractYouTubeMusicMetadata(doc)).toBeNull();
    });

    it('extracts track and artist from player bar', () => {
      const doc = document.implementation.createHTMLDocument();
      doc.body.innerHTML = `
        <span class="title ytmusic-player-bar">YT Song</span>
        <div class="byline ytmusic-player-bar">
          <a class="yt-simple-endpoint">YT Artist</a>
        </div>
      `;
      const res = extractYouTubeMusicMetadata(doc);
      expect(res).not.toBeNull();
      expect(res?.track).toBe('YT Song');
      expect(res?.artist).toBe('YT Artist');
      expect(res?.platform).toBe('youtube');
    });
  });

  describe('extractScrobbleMetadata', () => {
    it('routes correctly by platform type', () => {
      const doc = document.implementation.createHTMLDocument();
      doc.title = 'Test Track · Test Artist | Spotify';
      const res = extractScrobbleMetadata('spotify', doc);
      expect(res?.platform).toBe('spotify');
      expect(res?.track).toBe('Test Track');
      expect(res?.artist).toBe('Test Artist');
    });

    it('returns null for unsupported platform', () => {
      const doc = document.implementation.createHTMLDocument();
      expect(extractScrobbleMetadata('audius', doc)).toBeNull();
    });
  });
});
