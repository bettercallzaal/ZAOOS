import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getAuthUrl } from '@/lib/music/lastfm';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await supabaseAdmin
      .from('user_settings')
      .select('lastfm_session_key')
      .eq('fid', session.fid)
      .single();

    const connected = !!data?.lastfm_session_key;
    const connectUrl = connected ? null : getAuthUrl(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/lastfm/callback`
    );

    return NextResponse.json({ connected, connectUrl });
  } catch (error) {
    logger.error('[lastfm/status] Error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
