import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const TWITCH_CLIENT_ID = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || '';
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || '';

async function refreshTwitchToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
} | null> {
  try {
    const res = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getValidToken(
  userFid: number,
  accessToken: string,
  refreshToken: string | null,
  expiresAt: string | null,
): Promise<string | null> {
  // Check if token is expired (with 60s buffer)
  const isExpired = expiresAt && new Date(expiresAt).getTime() < Date.now() + 60_000;

  if (!isExpired) return accessToken;

  if (!refreshToken) return null;

  const refreshed = await refreshTwitchToken(refreshToken);
  if (!refreshed) return null;

  // Update tokens in DB
  await supabaseAdmin
    .from('connected_platforms')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    })
    .eq('user_fid', userFid)
    .eq('platform', 'twitch');

  return refreshed.access_token;
}

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Twitch credentials from connected_platforms
    const { data: platform, error: dbError } = await supabaseAdmin
      .from('connected_platforms')
      .select('access_token, refresh_token, platform_user_id, expires_at')
      .eq('user_fid', session.fid)
      .eq('platform', 'twitch')
      .single();

    if (dbError || !platform) {
      return NextResponse.json({ isLive: false, connected: false });
    }

    // Get a valid token (refresh if expired)
    const token = await getValidToken(
      session.fid,
      platform.access_token,
      platform.refresh_token,
      platform.expires_at,
    );

    if (!token) {
      return NextResponse.json({ isLive: false, connected: true, tokenExpired: true });
    }

    // Fetch stream info from Twitch Helix API
    const streamRes = await fetch(
      `https://api.twitch.tv/helix/streams?user_id=${platform.platform_user_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Client-Id': TWITCH_CLIENT_ID,
        },
      },
    );

    if (!streamRes.ok) {
      console.error('Twitch stream info fetch failed:', streamRes.status);
      return NextResponse.json({ isLive: false, connected: true });
    }

    const streamData = await streamRes.json();
    const stream = streamData.data?.[0];

    if (!stream) {
      return NextResponse.json({ isLive: false, connected: true });
    }

    const body = {
      isLive: true,
      connected: true,
      viewerCount: stream.viewer_count ?? 0,
      title: stream.title ?? '',
      game: stream.game_name ?? '',
      startedAt: stream.started_at ?? null,
    };

    return NextResponse.json(body, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    });
  } catch (error) {
    console.error('Twitch stream-info error:', error);
    return NextResponse.json({ error: 'Failed to fetch stream info' }, { status: 500 });
  }
}
