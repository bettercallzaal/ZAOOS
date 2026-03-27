'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUDIUS_API = 'https://discoveryprovider.audius.co/v1';
const APP_NAME = 'ZAOOS';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AudiusTrack {
  id: string;
  title: string;
  user: {
    name: string;
    handle: string;
    profile_picture?: { '150x150'?: string; '480x480'?: string };
  };
  artwork?: { '150x150'?: string; '480x480'?: string };
  play_count: number;
  favorite_count: number;
  repost_count: number;
  duration: number;
  genre: string;
  mood: string | null;
  tags: string | null;
  release_date: string | null;
  permalink: string;
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function audiusFetch(
  path: string,
  params: Record<string, string> = {},
): Promise<AudiusTrack[]> {
  const url = new URL(`${AUDIUS_API}${path}`);
  url.searchParams.set('app_name', APP_NAME);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Audius API error: ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch trending tracks from Audius with optional genre filter.
 * Data is cached and refetched via react-query.
 */
export function useAudiusTrending(genre?: string, time: string = 'week') {
  return useQuery<AudiusTrack[]>({
    queryKey: ['audius', 'trending', genre ?? 'All', time],
    queryFn: () => {
      const params: Record<string, string> = { time };
      if (genre && genre !== 'All') params.genre = genre;
      return audiusFetch('/tracks/trending', params);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch underground/emerging tracks from Audius.
 * Data is cached and refetched via react-query.
 */
export function useAudiusUnderground() {
  return useQuery<AudiusTrack[]>({
    queryKey: ['audius', 'underground'],
    queryFn: () => audiusFetch('/tracks/trending/underground'),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * User-triggered search hook.
 * Returns a `search(query)` callback and the latest results.
 */
export function useAudiusSearch() {
  const [results, setResults] = useState<AudiusTrack[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await audiusFetch('/tracks/search', { query });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, search };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Build a direct stream URL for an Audius track. */
export function getStreamUrl(trackId: string): string {
  return `${AUDIUS_API}/tracks/${trackId}/stream?app_name=${APP_NAME}`;
}

/** Format seconds into `m:ss` display string. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
