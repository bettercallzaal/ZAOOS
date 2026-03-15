'use client';

import { useMemo } from 'react';
import { Cast } from '@/types';
import { TrackType } from '@/types/music';
import { isMusicUrl } from '@/lib/music/isMusicUrl';

export type QueueEntry = {
  url: string;
  type: TrackType;
  castHash: string;
  submittedBy?: string;
};

export type SubmissionEntry = {
  id: string;
  url: string;
  track_type: string;
  submitted_by_username: string;
};

export function useMusicQueue(messages: Cast[], submissions?: SubmissionEntry[]): QueueEntry[] {
  return useMemo(() => {
    const seen = new Set<string>();
    const tracks: QueueEntry[] = [];

    // Feed-extracted tracks (oldest first)
    for (const msg of [...messages].reverse()) {
      const embedUrls = (msg.embeds ?? [])
        .filter((e) => e.url)
        .map((e) => e.url!);

      const textUrls =
        msg.text.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/g) ?? [];

      const allUrls = [...new Set([...embedUrls, ...textUrls])];

      for (const url of allUrls) {
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

    // Append song submissions (deduplicated against feed tracks)
    if (submissions) {
      for (const sub of submissions) {
        if (!seen.has(sub.url)) {
          seen.add(sub.url);
          tracks.push({
            url: sub.url,
            type: sub.track_type as TrackType,
            castHash: sub.id,
            submittedBy: sub.submitted_by_username,
          });
        }
      }
    }

    return tracks;
  }, [messages, submissions]);
}
