/**
 * Server-side Audius utility for resolving tracks, playlists, and artists from URLs.
 * Complements the client-side hooks in src/hooks/useAudius.ts.
 *
 * Uses the Audius API v1 discovery provider. Handles redirect-based resolution
 * that Audius uses to route requests between discovery nodes.
 */

// Use the official Audius gateway (handles discovery node selection automatically)
const AUDIUS_API = 'https://api.audius.co/v1';
const APP_NAME = 'ZAO-OS';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AudiusUser {
  id: string;
  name: string;
  handle: string;
  bio: string | null;
  profile_picture: { '150x150'?: string; '480x480'?: string } | null;
  cover_photo: { '640x'?: string; '2000x'?: string } | null;
  follower_count: number;
  followee_count: number;
  track_count: number;
  is_verified: boolean;
}

export interface AudiusTrack {
  id: string;
  title: string;
  user: {
    name: string;
    handle: string;
    id: string;
    profile_picture?: { '150x150'?: string; '480x480'?: string };
  };
  artwork: { '150x150'?: string; '480x480'?: string } | null;
  play_count: number;
  favorite_count: number;
  repost_count: number;
  duration: number;
  genre: string;
  mood: string | null;
  tags: string | null;
  release_date: string | null;
  permalink: string;
  description: string | null;
}

export interface AudiusPlaylist {
  id: string;
  playlist_name: string;
  description: string | null;
  user: {
    name: string;
    handle: string;
    id: string;
  };
  artwork: { '150x150'?: string; '480x480'?: string } | null;
  track_count: number;
  total_play_count: number;
  favorite_count: number;
  repost_count: number;
  tracks: AudiusTrack[];
  is_album: boolean;
}

export type AudiusResolveResult =
  | { type: 'track'; data: AudiusTrack }
  | { type: 'playlist'; data: AudiusPlaylist }
  | { type: 'user'; data: AudiusUser };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Build a URL with the app_name query param. */
function apiUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(`${AUDIUS_API}${path}`);
  url.searchParams.set('app_name', APP_NAME);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

/** Fetch JSON from the Audius API with a timeout. */
async function audiusFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: { 'User-Agent': 'ZAOOS/1.0', ...options.headers },
      signal: options.signal ?? AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve an audius.co URL into track, playlist, or user data.
 *
 * Uses `redirect: 'manual'` to inspect the redirect location and determine
 * the resource type, then fetches the appropriate endpoint.
 *
 * Handles URL patterns:
 * - `https://audius.co/artist/track-slug`
 * - `https://audius.co/artist/playlist/playlist-slug`
 * - `https://audius.co/artist` (user profile)
 */
export async function resolveAudiusUrl(
  url: string,
): Promise<AudiusResolveResult | null> {
  try {
    const resolveEndpoint = apiUrl('/resolve', { url });
    const res = await fetch(resolveEndpoint, {
      redirect: 'manual',
      headers: { 'User-Agent': 'ZAOOS/1.0' },
      signal: AbortSignal.timeout(10_000),
    });

    // Audius often returns a redirect to the actual resource endpoint
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) return null;

      if (location.includes('/playlists/')) {
        const playlistId = location.split('/playlists/')[1]?.split('?')[0];
        if (!playlistId) return null;
        const playlist = await getAudiusPlaylist(playlistId);
        return playlist ? { type: 'playlist', data: playlist } : null;
      }

      if (location.includes('/tracks/')) {
        const trackId = location.split('/tracks/')[1]?.split('?')[0];
        if (!trackId) return null;
        const track = await getAudiusTrack(trackId);
        return track ? { type: 'track', data: track } : null;
      }

      if (location.includes('/users/')) {
        const userId = location.split('/users/')[1]?.split('?')[0];
        if (!userId) return null;
        const user = await audiusFetch<AudiusUser>(
          apiUrl(`/users/${userId}`),
        );
        return user ? { type: 'user', data: user } : null;
      }

      // Fallback: follow the redirect and try to determine type from the data
      const followData = await audiusFetch<Record<string, unknown>>(
        location.startsWith('http')
          ? location
          : `${AUDIUS_API}${location}`,
      );
      if (!followData) return null;
      const normalized = Array.isArray(followData)
        ? followData[0]
        : followData;
      if (!normalized) return null;

      // Detect type from shape of the data
      if ('playlist_name' in normalized || 'tracks' in normalized) {
        return { type: 'playlist', data: normalized as unknown as AudiusPlaylist };
      }
      if ('handle' in normalized && 'track_count' in normalized) {
        return { type: 'user', data: normalized as unknown as AudiusUser };
      }
      return { type: 'track', data: normalized as unknown as AudiusTrack };
    }

    // No redirect — direct JSON response
    if (!res.ok) return null;
    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data[0] : json.data;
    if (!data) return null;

    // Detect type from shape
    if (data.playlist_name || data.tracks) {
      return { type: 'playlist', data };
    }
    if (data.handle && data.track_count !== undefined) {
      return { type: 'user', data };
    }
    return { type: 'track', data };
  } catch {
    return null;
  }
}

/**
 * Search Audius tracks by query string.
 * Returns an array of tracks, or an empty array on failure.
 */
export async function searchAudiusTracks(
  query: string,
  limit = 10,
): Promise<AudiusTrack[]> {
  try {
    const url = apiUrl('/tracks/search', {
      query,
      limit: String(limit),
    });
    const data = await audiusFetch<AudiusTrack[]>(url);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Build the direct stream URL for an Audius track.
 * The returned URL will redirect to the actual audio stream.
 */
export function getAudiusStreamUrl(trackId: string): string {
  return apiUrl(`/tracks/${trackId}/stream`);
}

/**
 * Fetch metadata for a single Audius track by ID.
 * Returns null if the track is not found or the request fails.
 */
export async function getAudiusTrack(
  trackId: string,
): Promise<AudiusTrack | null> {
  const url = apiUrl(`/tracks/${trackId}`);
  return audiusFetch<AudiusTrack>(url);
}

/**
 * Fetch an Audius playlist (or album) by ID, including its tracks.
 * Returns null if the playlist is not found or the request fails.
 */
export async function getAudiusPlaylist(
  playlistId: string,
): Promise<AudiusPlaylist | null> {
  const url = apiUrl(`/playlists/${playlistId}`);
  const data = await audiusFetch<AudiusPlaylist | AudiusPlaylist[]>(url);
  // API sometimes returns an array; extract first element
  if (Array.isArray(data)) return data[0] ?? null;
  return data;
}
