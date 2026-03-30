import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.redirect(new URL('/settings', req.nextUrl.origin));
  }

  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=kick_denied', req.nextUrl.origin));
  }

  const clientId = process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
  const clientSecret = process.env.KICK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/settings?error=kick_config', req.nextUrl.origin));
  }

  // Read the PKCE verifier from cookie
  const codeVerifier = req.cookies.get('kick_pkce_verifier')?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(new URL('/settings?error=kick_pkce', req.nextUrl.origin));
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin}/api/auth/kick/callback`;

  try {
    // Exchange code + verifier for tokens
    const tokenRes = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      logger.error('Kick token exchange failed:', tokenData);
      return NextResponse.redirect(new URL('/settings?error=kick_token', req.nextUrl.origin));
    }

    // Get user info
    const userRes = await fetch('https://api.kick.com/public/v1/users/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    const userData = await userRes.json();
    const kickUser = userData?.data ?? userData;

    if (!kickUser?.id && !kickUser?.user_id) {
      logger.error('Kick user fetch failed:', userData);
      return NextResponse.redirect(new URL('/settings?error=kick_user', req.nextUrl.origin));
    }

    const userId = String(kickUser.id ?? kickUser.user_id);
    const username = kickUser.username ?? kickUser.slug ?? '';
    const displayName = kickUser.name ?? kickUser.display_name ?? username;

    // Get channel info (stream key + RTMP URL)
    const channelRes = await fetch('https://api.kick.com/public/v1/channels/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    const channelData = await channelRes.json();
    const channel = channelData?.data ?? channelData;

    const streamKey = channel?.stream_key ?? channel?.streaming_key ?? '';
    // Kick's ingest is rtmps://fa723fc1b171.global-contribute.live-video.net/app
    // but the API may return it directly; fall back to the well-known value.
    const rtmpUrl =
      channel?.rtmp_url ??
      channel?.ingest_url ??
      'rtmps://fa723fc1b171.global-contribute.live-video.net/app';

    // Upsert to connected_platforms
    const { error: dbError } = await supabaseAdmin.from('connected_platforms').upsert(
      {
        user_fid: session.fid,
        platform: 'kick',
        platform_user_id: userId,
        platform_username: username,
        platform_display_name: displayName,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        stream_key: streamKey,
        rtmp_url: rtmpUrl,
        scopes: 'user:read channel:read channel:write',
        expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
      },
      { onConflict: 'user_fid,platform' }
    );

    if (dbError) {
      logger.error('Kick DB upsert error:', dbError);
      return NextResponse.redirect(new URL('/settings?error=kick_save', req.nextUrl.origin));
    }

    // Clear the PKCE verifier cookie
    const response = NextResponse.redirect(new URL('/settings?connected=kick', req.nextUrl.origin));
    response.cookies.set('kick_pkce_verifier', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    logger.error('Kick callback error:', err);
    return NextResponse.redirect(new URL('/settings?error=kick_unknown', req.nextUrl.origin));
  }
}
