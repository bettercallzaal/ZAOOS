import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const TWITCH_CLIENT_ID = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || '';
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || '';

const markerSchema = z.object({
  description: z.string().max(140).optional().default(''),
});

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
  const isExpired = expiresAt && new Date(expiresAt).getTime() < Date.now() + 60_000;
  if (!isExpired) return accessToken;
  if (!refreshToken) return null;

  const refreshed = await refreshTwitchToken(refreshToken);
  if (!refreshed) return null;

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

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = markerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Get Twitch credentials
    const { data: platform, error: dbError } = await supabaseAdmin
      .from('connected_platforms')
      .select('access_token, refresh_token, platform_user_id, expires_at')
      .eq('user_fid', session.fid)
      .eq('platform', 'twitch')
      .single();

    if (dbError || !platform) {
      return NextResponse.json({ error: 'Twitch not connected' }, { status: 400 });
    }

    const token = await getValidToken(
      session.fid,
      platform.access_token,
      platform.refresh_token,
      platform.expires_at,
    );

    if (!token) {
      return NextResponse.json({ error: 'Twitch token expired, please reconnect' }, { status: 401 });
    }

    // Create stream marker via Twitch Helix API
    const markerRes = await fetch('https://api.twitch.tv/helix/streams/markers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-Id': TWITCH_CLIENT_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: platform.platform_user_id,
        description: parsed.data.description || 'ZAO OS marker',
      }),
    });

    if (!markerRes.ok) {
      const errData = await markerRes.json().catch(() => ({}));
      console.error('Twitch marker creation failed:', markerRes.status, errData);
      return NextResponse.json(
        { error: errData.message || 'Failed to create marker — stream must be live' },
        { status: markerRes.status },
      );
    }

    const markerData = await markerRes.json();
    const marker = markerData.data?.[0];

    return NextResponse.json({
      success: true,
      marker: {
        id: marker?.id ?? null,
        created_at: marker?.created_at ?? new Date().toISOString(),
        description: marker?.description ?? parsed.data.description,
        position_seconds: marker?.position_seconds ?? 0,
      },
    });
  } catch (error) {
    console.error('Twitch marker error:', error);
    return NextResponse.json({ error: 'Failed to create stream marker' }, { status: 500 });
  }
}
