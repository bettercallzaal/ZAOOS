import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.redirect(new URL('/settings', req.nextUrl.origin));
  }

  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=twitch_denied', req.nextUrl.origin));
  }

  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/settings?error=twitch_config', req.nextUrl.origin));
  }

  const redirectUri = `${(process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin).trim()}/api/auth/twitch/callback`;

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Twitch token exchange failed:', tokenData);
      return NextResponse.redirect(new URL('/settings?error=twitch_token', req.nextUrl.origin));
    }

    // Get user info
    const userRes = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Client-Id': clientId,
      },
    });
    const userData = await userRes.json();
    const twitchUser = userData.data?.[0];

    if (!twitchUser) {
      console.error('Twitch user fetch failed:', userData);
      return NextResponse.redirect(new URL('/settings?error=twitch_user', req.nextUrl.origin));
    }

    // Get stream key
    const keyRes = await fetch(
      `https://api.twitch.tv/helix/streams/key?broadcaster_id=${twitchUser.id}`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Client-Id': clientId,
        },
      }
    );
    const keyData = await keyRes.json();
    const streamKey = keyData.data?.[0]?.stream_key || '';

    // Upsert to connected_platforms
    const { error: dbError } = await supabaseAdmin.from('connected_platforms').upsert(
      {
        user_fid: session.fid,
        platform: 'twitch',
        platform_user_id: twitchUser.id,
        platform_username: twitchUser.login,
        platform_display_name: twitchUser.display_name,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        stream_key: streamKey,
        rtmp_url: 'rtmp://live.twitch.tv/app',
        scopes: 'channel:read:stream_key channel:manage:broadcast chat:read',
        expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
      },
      { onConflict: 'user_fid,platform' }
    );

    if (dbError) {
      console.error('Twitch DB upsert error:', dbError);
      return NextResponse.redirect(new URL('/settings?error=twitch_save', req.nextUrl.origin));
    }

    return NextResponse.redirect(new URL('/settings?connected=twitch', req.nextUrl.origin));
  } catch (err) {
    console.error('Twitch callback error:', err);
    return NextResponse.redirect(new URL('/settings?error=twitch_unknown', req.nextUrl.origin));
  }
}
