import { NextResponse } from 'next/server';
import { communityConfig } from '@/../community.config';

const AUDIUS_API = 'https://api.audius.co/v1';
const APP_NAME = 'ZAO-OS';

export type RadioTrack = {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string;
  streamUrl: string;
  url: string;
  duration: number; // seconds
};

export type RadioPlaylist = {
  name: string;
  artist: string;
  artworkUrl: string;
  tracks: RadioTrack[];
};

/**
 * GET /api/music/radio
 * Returns all community radio playlist tracks from Audius.
 * Cached for 1 hour.
 */
export async function GET() {
  const playlists: RadioPlaylist[] = [];

  for (const config of communityConfig.music.radioPlaylists) {
    try {
      // Step 1: Resolve the Audius URL to get the playlist/album object
      const resolveRes = await fetch(
        `${AUDIUS_API}/resolve?url=${encodeURIComponent(config.url)}&app_name=${APP_NAME}`,
        { signal: AbortSignal.timeout(10000) },
      );
      if (!resolveRes.ok) continue;

      const resolved = await resolveRes.json();
      const data = resolved?.data;
      if (!data) continue;

      // Audius albums resolve as playlists with is_album=true
      const playlistTracks = data.tracks || data.playlist_contents?.track_ids || [];
      const artworkUrl =
        data.artwork?.['480x480'] ?? data.artwork?.['150x150'] ?? '';

      // If resolved data includes full track objects
      if (data.tracks && Array.isArray(data.tracks)) {
        const tracks: RadioTrack[] = data.tracks.map((t: Record<string, unknown>) => ({
          id: String(t.id ?? ''),
          title: String((t as Record<string, unknown>).title ?? 'Untitled'),
          artist: String(((t as Record<string, Record<string, unknown>>).user as Record<string, unknown>)?.name ?? config.artist),
          artworkUrl:
            ((t as Record<string, Record<string, string>>).artwork as Record<string, string>)?.['480x480'] ??
            ((t as Record<string, Record<string, string>>).artwork as Record<string, string>)?.['150x150'] ??
            artworkUrl,
          streamUrl: `${AUDIUS_API}/tracks/${t.id}/stream?app_name=${APP_NAME}`,
          url: `https://audius.co${((t as Record<string, Record<string, unknown>>).user as Record<string, unknown>)?.handle ? `/${((t as Record<string, Record<string, unknown>>).user as Record<string, unknown>).handle}/${(t as Record<string, unknown>).permalink ?? t.id}` : ''}`,
          duration: Number((t as Record<string, unknown>).duration ?? 0),
        }));

        playlists.push({
          name: data.playlist_name || config.name,
          artist: data.user?.name || config.artist,
          artworkUrl,
          tracks,
        });
      } else if (Array.isArray(playlistTracks) && playlistTracks.length > 0) {
        // Need to fetch each track individually
        const trackIds = playlistTracks.map((t: { track: string } | string) =>
          typeof t === 'string' ? t : t.track,
        );

        const tracks: RadioTrack[] = [];
        // Batch fetch tracks (Audius supports bulk track fetching)
        const bulkRes = await fetch(
          `${AUDIUS_API}/tracks?id=${trackIds.join(',')}&app_name=${APP_NAME}`,
          { signal: AbortSignal.timeout(10000) },
        );
        if (bulkRes.ok) {
          const bulkData = await bulkRes.json();
          for (const t of bulkData?.data || []) {
            tracks.push({
              id: t.id,
              title: t.title ?? 'Untitled',
              artist: t.user?.name ?? config.artist,
              artworkUrl:
                t.artwork?.['480x480'] ?? t.artwork?.['150x150'] ?? artworkUrl,
              streamUrl: `${AUDIUS_API}/tracks/${t.id}/stream?app_name=${APP_NAME}`,
              url: `https://audius.co/${t.user?.handle ?? 'track'}/${t.permalink ?? t.id}`,
              duration: t.duration ?? 0,
            });
          }
        }

        playlists.push({
          name: data.playlist_name || config.name,
          artist: data.user?.name || config.artist,
          artworkUrl,
          tracks,
        });
      }
    } catch (err) {
      console.error(`Radio playlist fetch failed for ${config.url}:`, err);
    }
  }

  return NextResponse.json({ playlists }, {
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
  });
}
