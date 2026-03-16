export type AudioController = {
  play: () => void;
  pause: () => void;
  seek: (ms: number) => void;
  load: (url: string) => void;
  setVolume?: (volume: number) => void; // 0–1
};

export type TrackType = 'spotify' | 'soundcloud' | 'soundxyz' | 'youtube' | 'audio' | 'audius' | 'applemusic' | 'tidal' | 'bandcamp';

export type TrackMetadata = {
  id: string;
  type: TrackType;
  artistName: string;
  trackName: string;
  artworkUrl: string;
  url: string;
  streamUrl?: string; // audio stream URL when different from page URL (e.g. sound.xyz)
  feedId: string; // cast.hash
};
