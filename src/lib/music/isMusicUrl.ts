import { TrackType } from '@/types/music';

// Regex patterns — more specific than plain string includes to avoid false positives
// (e.g. bare "soundcloud.com/" homepage, "audius.co/" profile-only URLs)
const MUSIC_PATTERNS: { regex: RegExp; type: TrackType }[] = [
  { regex: /spotify\.com\/track\//, type: 'spotify' },
  // SoundCloud track: soundcloud.com/artist/track (2 path segments, no "sets" root)
  { regex: /soundcloud\.com\/[^/\s]+\/[^/\s]+/, type: 'soundcloud' },
  { regex: /sound\.xyz\//, type: 'soundxyz' },
  { regex: /youtube\.com\/watch/, type: 'youtube' },
  { regex: /youtube\.com\/shorts\//, type: 'youtube' },
  { regex: /music\.youtube\.com\/watch/, type: 'youtube' },
  { regex: /youtu\.be\/[^/\s]+/, type: 'youtube' },
  { regex: /zora\.co\/collect\//, type: 'soundxyz' },
  // Audius track: audius.co/artist/track (2 path segments)
  { regex: /audius\.co\/[^/\s]+\/[^/\s]+/, type: 'audius' },
  { regex: /^ipfs:\/\//, type: 'audio' },
];

const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|flac|aac|m4a|opus)(\?|$)/i;

export function isMusicUrl(url: string): TrackType | null {
  if (!url) return null;
  if (AUDIO_EXTENSIONS.test(url)) return 'audio';
  for (const { regex, type } of MUSIC_PATTERNS) {
    if (regex.test(url)) return type;
  }
  return null;
}
