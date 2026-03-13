import { CastEmbed } from '@/types';
import { TrackType } from '@/types/music';
import { isMusicUrl } from './isMusicUrl';

export type MusicEmbedResult = {
  url: string;
  type: TrackType;
};

export function findMusicEmbed(embeds: CastEmbed[] = []): MusicEmbedResult | null {
  for (const embed of embeds) {
    if (!embed.url) continue;

    // Check MIME type first — Neynar provides content_type on embeds
    const contentType = embed.metadata?.content_type ?? '';
    if (contentType.startsWith('audio/')) {
      return { url: embed.url, type: 'audio' };
    }

    // Then URL pattern matching
    const type = isMusicUrl(embed.url);
    if (type) return { url: embed.url, type };
  }
  return null;
}
