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
    return NextResponse.redirect(new URL('/settings?error=facebook_denied', req.nextUrl.origin));
  }

  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) {
    return NextResponse.redirect(new URL('/settings?error=facebook_config', req.nextUrl.origin));
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin}/api/auth/facebook/callback`;

  try {
    // Exchange code for short-lived token
    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('code', code);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      logger.error('Facebook token exchange failed:', tokenData);
      return NextResponse.redirect(new URL('/settings?error=facebook_token', req.nextUrl.origin));
    }

    // Exchange short-lived token for long-lived token (~60 days)
    const longLivedUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longLivedUrl.searchParams.set('client_id', appId);
    longLivedUrl.searchParams.set('client_secret', appSecret);
    longLivedUrl.searchParams.set('fb_exchange_token', tokenData.access_token);

    const longLivedRes = await fetch(longLivedUrl.toString());
    const longLivedData = await longLivedRes.json();

    const accessToken = longLivedData.access_token || tokenData.access_token;
    const expiresIn = longLivedData.expires_in || tokenData.expires_in || null;

    // Get user info
    const userRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=${accessToken}`
    );
    const userData = await userRes.json();

    if (!userData.id) {
      logger.error('Facebook user fetch failed:', userData);
      return NextResponse.redirect(new URL('/settings?error=facebook_user', req.nextUrl.origin));
    }

    // Get pages the user manages (for live streaming)
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();
    const pages = pagesData.data || [];

    // Store the first page (or null if user has no pages)
    const primaryPage = pages[0] || null;

    // Upsert to connected_platforms
    const { error: dbError } = await supabaseAdmin.from('connected_platforms').upsert(
      {
        user_fid: session.fid,
        platform: 'facebook',
        platform_user_id: userData.id,
        platform_username: userData.name,
        platform_display_name: userData.name,
        access_token: accessToken,
        refresh_token: null, // Facebook long-lived tokens don't have refresh tokens
        scopes: 'publish_video,pages_manage_posts,pages_read_engagement',
        expires_at: expiresIn
          ? new Date(Date.now() + expiresIn * 1000).toISOString()
          : null,
        // Store pages list and primary page in metadata
        metadata: {
          pages,
          primary_page_id: primaryPage?.id || null,
          primary_page_name: primaryPage?.name || null,
          primary_page_access_token: primaryPage?.access_token || null,
        },
      },
      { onConflict: 'user_fid,platform' }
    );

    if (dbError) {
      logger.error('Facebook DB upsert error:', dbError);
      return NextResponse.redirect(new URL('/settings?error=facebook_save', req.nextUrl.origin));
    }

    return NextResponse.redirect(new URL('/settings?connected=facebook', req.nextUrl.origin));
  } catch (err) {
    logger.error('Facebook callback error:', err);
    return NextResponse.redirect(new URL('/settings?error=facebook_unknown', req.nextUrl.origin));
  }
}
