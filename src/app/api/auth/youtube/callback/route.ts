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
    return NextResponse.redirect(new URL('/settings?error=youtube_denied', req.nextUrl.origin));
  }

  const clientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/settings?error=youtube_config', req.nextUrl.origin));
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin}/api/auth/youtube/callback`;

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
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
      console.error('YouTube token exchange failed:', tokenData);
      return NextResponse.redirect(new URL('/settings?error=youtube_token', req.nextUrl.origin));
    }

    // Get channel info
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];

    if (!channel) {
      console.error('YouTube channel fetch failed:', channelData);
      return NextResponse.redirect(new URL('/settings?error=youtube_channel', req.nextUrl.origin));
    }

    // Upsert to connected_platforms
    const { error: dbError } = await supabaseAdmin.from('connected_platforms').upsert(
      {
        user_fid: session.fid,
        platform: 'youtube',
        platform_user_id: channel.id,
        platform_username: channel.snippet?.customUrl || channel.id,
        platform_display_name: channel.snippet?.title,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        stream_key: '', // Created per-broadcast
        rtmp_url: 'rtmp://a.rtmp.youtube.com/live2',
        scopes: 'youtube youtube.force-ssl',
        expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
      },
      { onConflict: 'user_fid,platform' }
    );

    if (dbError) {
      console.error('YouTube DB upsert error:', dbError);
      return NextResponse.redirect(new URL('/settings?error=youtube_save', req.nextUrl.origin));
    }

    return NextResponse.redirect(new URL('/settings?connected=youtube', req.nextUrl.origin));
  } catch (err) {
    console.error('YouTube callback error:', err);
    return NextResponse.redirect(new URL('/settings?error=youtube_unknown', req.nextUrl.origin));
  }
}
