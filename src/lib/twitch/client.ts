import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

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
    logger.error('[twitch] Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET for token refresh');
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
      logger.error('[twitch] Token refresh failed:', res.status, errText);
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
      logger.error('[twitch] Failed to persist refreshed tokens:', updateError.message);
    }

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (err) {
    logger.error('[twitch] Token refresh error:', err);
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
    logger.error('[twitch] Missing TWITCH_CLIENT_ID');
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
      logger.error('[twitch] Channel update failed:', res.status, errText);
      return false;
    }

    return true;
  } catch (err) {
    logger.error('[twitch] Channel update error:', err);
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
      logger.error('[twitch] Get stream info failed:', res.status);
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
    logger.error('[twitch] Stream info error:', err);
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
      logger.error('[twitch] Create marker failed:', res.status, errText);
      return false;
    }

    return true;
  } catch (err) {
    logger.error('[twitch] Create marker error:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Polls
// ---------------------------------------------------------------------------

/**
 * Create a Twitch poll (e.g. "What should I play next?").
 */
export async function createTwitchPoll(
  accessToken: string,
  userId: string,
  opts: { title: string; choices: string[]; duration?: number }
): Promise<{ id: string } | null> {
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  if (!clientId) return null;

  try {
    const res = await fetch('https://api.twitch.tv/helix/polls', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': clientId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        broadcaster_id: userId,
        title: opts.title.slice(0, 60),
        choices: opts.choices.map((c) => ({ title: c.slice(0, 25) })),
        duration: opts.duration ?? 60,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error('[twitch] Create poll failed:', res.status, errText);
      return null;
    }

    const data = await res.json();
    const poll = data.data?.[0];
    return poll ? { id: poll.id } : null;
  } catch (err) {
    logger.error('[twitch] Create poll error:', err);
    return null;
  }
}

/**
 * End a Twitch poll.
 * status: TERMINATED (show results) or ARCHIVED (discard).
 */
export async function endTwitchPoll(
  accessToken: string,
  userId: string,
  pollId: string,
  status: 'TERMINATED' | 'ARCHIVED'
): Promise<boolean> {
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  if (!clientId) return false;

  try {
    const res = await fetch('https://api.twitch.tv/helix/polls', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': clientId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        broadcaster_id: userId,
        id: pollId,
        status,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error('[twitch] End poll failed:', res.status, errText);
      return false;
    }
    return true;
  } catch (err) {
    logger.error('[twitch] End poll error:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Predictions
// ---------------------------------------------------------------------------

/**
 * Create a Twitch prediction (e.g. "Will the DJ drop bass?").
 */
export async function createTwitchPrediction(
  accessToken: string,
  userId: string,
  opts: { title: string; outcomes: string[]; duration?: number }
): Promise<{ id: string; outcomes: { id: string; title: string }[] } | null> {
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  if (!clientId) return null;

  try {
    const res = await fetch('https://api.twitch.tv/helix/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': clientId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        broadcaster_id: userId,
        title: opts.title.slice(0, 45),
        outcomes: opts.outcomes.map((o) => ({ title: o.slice(0, 25) })),
        prediction_window: opts.duration ?? 120,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error('[twitch] Create prediction failed:', res.status, errText);
      return null;
    }

    const data = await res.json();
    const pred = data.data?.[0];
    if (!pred) return null;
    return {
      id: pred.id,
      outcomes: (pred.outcomes ?? []).map((o: { id: string; title: string }) => ({
        id: o.id,
        title: o.title,
      })),
    };
  } catch (err) {
    logger.error('[twitch] Create prediction error:', err);
    return null;
  }
}

/**
 * End a Twitch prediction with a winning outcome.
 */
export async function endTwitchPrediction(
  accessToken: string,
  userId: string,
  predictionId: string,
  winningOutcomeId: string
): Promise<boolean> {
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  if (!clientId) return false;

  try {
    const res = await fetch('https://api.twitch.tv/helix/predictions', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': clientId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        broadcaster_id: userId,
        id: predictionId,
        status: 'RESOLVED',
        winning_outcome_id: winningOutcomeId,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error('[twitch] End prediction failed:', res.status, errText);
      return false;
    }
    return true;
  } catch (err) {
    logger.error('[twitch] End prediction error:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Clips
// ---------------------------------------------------------------------------

/**
 * Create a clip of the current live stream.
 * Returns the clip id and edit URL, or null on failure.
 */
export async function createTwitchClip(
  accessToken: string,
  userId: string
): Promise<{ id: string; editUrl: string } | null> {
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  if (!clientId) return null;

  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/clips?broadcaster_id=${encodeURIComponent(userId)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': clientId,
        },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      logger.error('[twitch] Create clip failed:', res.status, errText);
      return null;
    }

    const data = await res.json();
    const clip = data.data?.[0];
    return clip ? { id: clip.id, editUrl: clip.edit_url } : null;
  } catch (err) {
    logger.error('[twitch] Create clip error:', err);
    return null;
  }
}
