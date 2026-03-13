'use client';

import { useMemo } from 'react';
import { Cast } from '@/types';
import { TrackType } from '@/types/music';
import { isMusicUrl } from '@/lib/music/isMusicUrl';

export type QueueEntry = {
  url: string;
  type: TrackType;
  castHash: string;
};

export function useMusicQueue(messages: Cast[]): QueueEntry[] {
  return useMemo(() => {
    const seen = new Set<string>();
    const tracks: QueueEntry[] = [];

    // Reverse so oldest casts are first in queue
    for (const msg of [...messages].reverse()) {
      const embedUrls = (msg.embeds ?? [])
        .filter((e) => e.url)
        .map((e) => e.url!);

      const textUrls =
        msg.text.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/g) ?? [];

      const allUrls = [...new Set([...embedUrls, ...textUrls])];

      for (const url of allUrls) {
        // Check MIME type from embeds first
        const embed = msg.embeds?.find((e) => e.url === url);
        const contentType = embed?.metadata?.content_type ?? '';

        const type = contentType.startsWith('audio/')
          ? 'audio'
          : isMusicUrl(url);

        if (type && !seen.has(url)) {
          seen.add(url);
          tracks.push({ url, type, castHash: msg.hash });
        }
      }
    }

    return tracks;
  }, [messages]);
}
