import { supabaseAdmin } from '@/lib/db/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StreamInfo {
  id: string;
  userId: string;
  userName: string;
  gameName: string;
  title: string;
  viewerCount: number;
  startedAt: string;
  thumbnailUrl: string;
  isMature: boolean;
}

// ---------------------------------------------------------------------------
// Well-known Twitch game/category IDs
// ---------------------------------------------------------------------------

/** "Music" category on Twitch */
export const TWITCH_CATEGORY_MUSIC = '26936';
/** "DJs" category on Twitch */
export const TWITCH_CATEGORY_DJS = '743';

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

const REFRESH_BUFFER_MS = 10 * 60 * 1000; // refresh if within 10 min of expiry

/**
 * Return a valid Twitch access token for the given FID.
 * Automatically refreshes the token if it is within 10 minutes of expiry.
 */
export async function getValidTwitchToken(
  fid: number
): Promise<{ accessToken: string; userId: string } | null> {
  const { data: row, error } = await supabaseAdmin
    .from('connected_platforms')
    .select('access_token, refresh_token, expires_at, platform_user_id')
    .eq('user_fid', fid)
    .eq('platform', 'twitch')
    .maybeSingle();

  if (error || !row?.access_token || !row?.platform_user_id) {
    return null;
  }

  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  const needsRefresh = expiresAt - Date.now() < REFRESH_BUFFER_MS;

  if (needsRefresh && row.refresh_token) {
    const refreshed = await refreshTwitchToken(fid, row.refresh_token);
    if (refreshed) {
      return { accessToken: refreshed.accessToken, userId: row.platform_user_id };
    }
    // Refresh failed — try existing token anyway; it might still work
  }

  return { accessToken: row.access_token, userId: row.platform_user_id };
}

async function refreshTwitchToken(
  fid: number,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[twitch] Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET for token refresh');
    return null;
  }

  try {
    const res = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[twitch] Token refresh failed:', res.status, errText);
      return null;
    }

    const data = await res.json();
    const newAccessToken: string = data.access_token;
    const newRefreshToken: string = data.refresh_token;
    const expiresIn: number = data.expires_in; // seconds

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Persist refreshed tokens
    const { error: updateError } = await supabaseAdmin
      .from('connected_platforms')
      .update({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_at: expiresAt,
      })
      .eq('user_fid', fid)
      .eq('platform', 'twitch');

    if (updateError) {
      console.error('[twitch] Failed to persist refreshed tokens:', updateError.message);
    }

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (err) {
    console.error('[twitch] Token refresh error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Channel update
// ---------------------------------------------------------------------------

/**
 * Update the Twitch channel title and/or category.
 * `gameId` should be one of the TWITCH_CATEGORY_* constants or a custom game ID.
 */
export async function updateTwitchChannel(
  accessToken: string,
  userId: string,
  opts: { title?: string; gameId?: string }
): Promise<boolean> {
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  if (!clientId) {
    console.error('[twitch] Missing TWITCH_CLIENT_ID');
    return false;
  }

  const body: Record<string, string> = { broadcaster_id: userId };
  if (opts.title) body.title = opts.title;
  if (opts.gameId) body.game_id = opts.gameId;

  try {
    const res = await fetch('https://api.twitch.tv/helix/channels', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': clientId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[twitch] Channel update failed:', res.status, errText);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[twitch] Channel update error:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Stream info
// ---------------------------------------------------------------------------

/**
 * Get live stream information (viewer count, started_at, etc.).
 * Returns null if the user is not currently live.
 */
export async function getTwitchStreamInfo(
  accessToken: string,
  userId: string
): Promise<StreamInfo | null> {
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  if (!clientId) return null;

  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/streams?user_id=${encodeURIComponent(userId)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': clientId,
        },
      }
    );

    if (!res.ok) {
      console.error('[twitch] Get stream info failed:', res.status);
      return null;
    }

    const data = await res.json();
    const stream = data.data?.[0];
    if (!stream) return null;

    return {
      id: stream.id,
      userId: stream.user_id,
      userName: stream.user_name,
      gameName: stream.game_name,
      title: stream.title,
      viewerCount: stream.viewer_count,
      startedAt: stream.started_at,
      thumbnailUrl: stream.thumbnail_url,
      isMature: stream.is_mature,
    };
  } catch (err) {
    console.error('[twitch] Stream info error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Stream markers
// ---------------------------------------------------------------------------

/**
 * Create a stream marker at the current position of a live stream.
 * The user must be live for this to work.
 */
export async function createTwitchMarker(
  accessToken: string,
  userId: string,
  description?: string
): Promise<boolean> {
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  if (!clientId) return false;

  try {
    const body: Record<string, string> = { user_id: userId };
    if (description) body.description = description.slice(0, 140); // Twitch max 140 chars

    const res = await fetch('https://api.twitch.tv/helix/streams/markers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': clientId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[twitch] Create marker failed:', res.status, errText);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[twitch] Create marker error:', err);
    return false;
  }
}
