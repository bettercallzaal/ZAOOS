import { supabaseAdmin } from '@/lib/db/supabase';
import { isMusicUrl } from './isMusicUrl';

// ─── Types ──────────────────────────────────────────────────────────

export interface Song {
  id: string;
  url: string;
  platform: string;
  title: string;
  artist: string | null;
  artwork_url: string | null;
  stream_url: string | null;
  duration: number;
  submitted_by_fid: number | null;
  source: string;
  tags: string[];
  play_count: number;
  last_played_at: string | null;
  created_at: string;
}

export interface UpsertSongParams {
  url: string;
  platform?: string;
  title?: string;
  artist?: string;
  artworkUrl?: string;
  streamUrl?: string;
  duration?: number;
  submittedByFid?: number;
  source: 'chat' | 'submission' | 'radio' | 'manual' | 'totd';
  tags?: string[];
}

// ─── Core: upsertSong ───────────────────────────────────────────────

/**
 * Add a song to the library or update play count if it already exists.
 * Deduplicates on URL. Called from chat send, submissions, quick-add, radio, TOTD.
 */
export async function upsertSong(params: UpsertSongParams): Promise<{ id: string; isNew: boolean }> {
  const platform = params.platform || isMusicUrl(params.url) || 'audio';

  // Check if song already exists
  const { data: existing } = await supabaseAdmin
    .from('songs')
    .select('id')
    .eq('url', params.url)
    .maybeSingle();

  if (existing) {
    // Bump play count + last played
    await incrementPlayCount(existing.id);
    return { id: existing.id, isNew: false };
  }

  // Insert new song
  const { data: song, error } = await supabaseAdmin
    .from('songs')
    .insert({
      url: params.url,
      platform,
      title: params.title || 'Untitled',
      artist: params.artist || null,
      artwork_url: params.artworkUrl || null,
      stream_url: params.streamUrl || null,
      duration: params.duration || 0,
      submitted_by_fid: params.submittedByFid || null,
      source: params.source,
      tags: params.tags || [],
      play_count: 1,
      last_played_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    // Race condition: another request inserted this URL between our check and insert
    if (error.code === '23505') {
      const { data: raced } = await supabaseAdmin
        .from('songs')
        .select('id')
        .eq('url', params.url)
        .single();
      return { id: raced!.id, isNew: false };
    }
    throw error;
  }

  return { id: song.id, isNew: true };
}

// ─── Queries ────────────────────────────────────────────────────────

export interface QuerySongsParams {
  search?: string;
  platform?: string;
  sort?: 'recent' | 'popular' | 'played';
  limit?: number;
  offset?: number;
}

export async function querySongs(params: QuerySongsParams = {}): Promise<{ songs: Song[]; total: number }> {
  const { search, platform, sort = 'recent', limit = 50, offset = 0 } = params;

  let query = supabaseAdmin
    .from('songs')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.textSearch('search_vector', search, { type: 'websearch' });
  }

  if (platform) {
    query = query.eq('platform', platform);
  }

  switch (sort) {
    case 'popular':
      query = query.order('play_count', { ascending: false });
      break;
    case 'played':
      query = query.order('last_played_at', { ascending: false, nullsFirst: false });
      break;
    case 'recent':
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw error;
  return { songs: (data as Song[]) || [], total: count || 0 };
}

export async function incrementPlayCount(songId: string): Promise<void> {
  // Non-atomic increment — read current count, add 1, write back
  const { data } = await supabaseAdmin
    .from('songs')
    .select('play_count')
    .eq('id', songId)
    .single();

  await supabaseAdmin
    .from('songs')
    .update({
      play_count: ((data?.play_count as number) || 0) + 1,
      last_played_at: new Date().toISOString(),
    })
    .eq('id', songId);
}

// ─── Playlist helpers ───────────────────────────────────────────────

export async function addToPlaylist(playlistId: string, songId: string, addedByFid: number): Promise<void> {
  // Get next position
  const { data: lastTrack } = await supabaseAdmin
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (lastTrack?.position ?? -1) + 1;

  await supabaseAdmin.from('playlist_tracks').upsert({
    playlist_id: playlistId,
    song_id: songId,
    position: nextPosition,
    added_by_fid: addedByFid,
  }, { onConflict: 'playlist_id,song_id' });
}

/**
 * Extract music URLs from text and upsert them to the library.
 * Non-blocking — call with .catch(() => {}) for fire-and-forget.
 */
export async function extractAndSaveSongs(
  text: string,
  embedUrls: string[] | undefined,
  submittedByFid: number,
  source: 'chat' | 'submission' = 'chat',
): Promise<void> {
  // Collect URLs from text + embeds
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const textUrls = text.match(urlRegex) || [];
  const allUrls = [...new Set([...textUrls, ...(embedUrls || [])])];

  for (const url of allUrls) {
    const platform = isMusicUrl(url);
    if (!platform) continue;

    try {
      // Fetch metadata — try multiple base URL options for server-side fetch
      const baseUrl = process.env.NEXT_PUBLIC_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
        || 'http://localhost:3000';

      let meta: Record<string, unknown> | null = null;
      try {
        const metaRes = await fetch(
          `${baseUrl}/api/music/metadata?url=${encodeURIComponent(url)}`,
          { signal: AbortSignal.timeout(8000) },
        );
        meta = metaRes.ok ? await metaRes.json() : null;
      } catch {
        // Metadata fetch failed — save with just URL + platform
      }

      await upsertSong({
        url,
        platform,
        title: (meta?.trackName as string) || 'Untitled',
        artist: meta?.artistName as string | undefined,
        artworkUrl: meta?.artworkUrl as string | undefined,
        streamUrl: meta?.streamUrl as string | undefined,
        duration: meta?.duration ? Math.floor((meta.duration as number) / 1000) : 0,
        submittedByFid,
        source,
      });
    } catch {
      // Best-effort — don't block the calling operation
    }
  }
}
