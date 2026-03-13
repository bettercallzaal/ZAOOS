import { TrackType } from '@/types/music';

const MUSIC_PATTERNS: { pattern: string; type: TrackType }[] = [
  { pattern: 'spotify.com/track', type: 'spotify' },
  { pattern: 'soundcloud.com', type: 'soundcloud' },
  { pattern: 'sound.xyz', type: 'soundxyz' },
  { pattern: 'youtube.com/watch', type: 'youtube' },
  { pattern: 'youtube.com/shorts', type: 'youtube' },
  { pattern: 'music.youtube.com/watch', type: 'youtube' },
  { pattern: 'youtu.be/', type: 'youtube' },
  { pattern: 'zora.co/collect', type: 'soundxyz' },
  { pattern: 'ipfs://', type: 'audio' },
];

const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|flac|aac|m4a|opus)(\?|$)/i;

export function isMusicUrl(url: string): TrackType | null {
  if (!url) return null;
  if (AUDIO_EXTENSIONS.test(url)) return 'audio';
  for (const { pattern, type } of MUSIC_PATTERNS) {
    if (url.includes(pattern)) return type;
  }
  return null;
}
