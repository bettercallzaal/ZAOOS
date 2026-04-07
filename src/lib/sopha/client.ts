import { communityConfig } from '../../../community.config';
import { Cast } from '@/types';
import { logger } from '@/lib/logger';

export interface SophaCurator {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

export interface SophaCast extends Cast {
  _qualityScore?: number;
  _category?: string;
  _title?: string;
  _summary?: string;
  _curators?: SophaCurator[];
  _source: 'sopha';
}

interface SophaFeedResponse {
  casts: Record<string, unknown>[];
  count: number;
  nextCursor: string | null;
}

const { sopha } = communityConfig;

// Build auth header once at module load
const SOPHA_AUTH = process.env.SOPHA_API_USERNAME && process.env.SOPHA_API_PASSWORD
  ? `Basic ${Buffer.from(`${process.env.SOPHA_API_USERNAME}:${process.env.SOPHA_API_PASSWORD}`).toString('base64')}`
  : null;

function rawToSophaCast(c: Record<string, unknown>): SophaCast {
  const author = c.author as Record<string, unknown> | undefined;
  const reactions = c.reactions as Record<string, unknown> | undefined;
  const replies = c.replies as Record<string, unknown> | undefined;

  return {
    hash: c.hash as string,
    author: {
      fid: (author?.fid as number) || 0,
      username: (author?.username as string) || '',
      display_name: (author?.display_name as string) || '',
      pfp_url: (author?.pfp_url as string) || '',
    },
    text: (c.text as string) || '',
    timestamp: (c.timestamp as string) || '',
    replies: { count: (replies?.count as number) || 0 },
    reactions: {
      likes_count: (reactions?.likes_count as number) || 0,
      recasts_count: (reactions?.recasts_count as number) || 0,
      likes: (reactions?.likes as { fid: number }[]) || [],
      recasts: (reactions?.recasts as { fid: number }[]) || [],
    },
    parent_hash: (c.parent_hash as string) || null,
    embeds: (c.embeds as Cast['embeds']) || [],
    _qualityScore: (c._qualityScore as number) || undefined,
    _category: (c._category as string) || undefined,
    _title: (c._title as string) || undefined,
    _summary: (c._summary as string) || undefined,
    _curators: (c._curators as SophaCurator[]) || undefined,
    _source: 'sopha',
  };
}

/**
 * Fetch curated casts from Sopha's external feed API.
 * Returns null if disabled, unconfigured, or on API error (never throws).
 */
export async function fetchSophaFeed(): Promise<SophaCast[] | null> {
  if (!sopha.enabled || !SOPHA_AUTH) {
    return null;
  }

  try {
    const res = await fetch(sopha.apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': SOPHA_AUTH,
      },
    });

    if (!res.ok) {
      logger.warn(`[sopha] API returned ${res.status} ${res.statusText}`);
      return null;
    }

    const data = (await res.json()) as SophaFeedResponse;
    if (!data.casts) return null;

    const maxAge = new Date();
    maxAge.setDate(maxAge.getDate() - sopha.maxAgeDays);

    return data.casts
      .map(rawToSophaCast)
      .filter(c => {
        const ts = new Date(c.timestamp);
        return ts >= maxAge && (!sopha.minQualityScore || (c._qualityScore ?? 0) >= sopha.minQualityScore);
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    logger.error('[sopha] fetch error:', err);
    return null;
  }
}
