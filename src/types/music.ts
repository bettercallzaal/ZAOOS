export type AudioController = {
  play: () => void;
  pause: () => void;
  seek: (ms: number) => void;
  load: (url: string) => void;
};

export type TrackType = 'spotify' | 'soundcloud' | 'soundxyz' | 'youtube' | 'audio' | 'audius';

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
