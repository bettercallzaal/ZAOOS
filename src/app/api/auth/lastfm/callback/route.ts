import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getSession as getLastfmSession } from '@/lib/music/lastfm';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.redirect(new URL('/settings?error=unauthorized', req.url));
    }

    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.redirect(new URL('/settings?error=no_token', req.url));
    }

    const sk = await getLastfmSession(token);

    await supabaseAdmin
      .from('user_settings')
      .upsert(
        { fid: session.fid, lastfm_session_key: sk },
        { onConflict: 'fid' }
      );

    return NextResponse.redirect(new URL('/settings?lastfm=connected', req.url));
  } catch (error) {
    logger.error('[lastfm/callback] Error:', error);
    return NextResponse.redirect(new URL('/settings?error=lastfm_failed', req.url));
  }
}
