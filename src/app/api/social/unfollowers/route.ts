import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/**
 * GET /api/social/unfollowers
 *
 * Returns recent unfollowers for the authenticated user.
 * Sorted by detected_at DESC, limited to 50.
 */
export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.fid) {
      return NextResponse.json(
        { error: 'No Farcaster account linked' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('unfollow_events')
      .select(
        'id, unfollower_fid, unfollower_username, unfollower_display_name, detected_at'
      )
      .eq('member_fid', session.fid)
      .order('detected_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('Unfollowers query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch unfollowers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      unfollowers: data || [],
      total: data?.length ?? 0,
    });
  } catch (err) {
    logger.error('Unfollowers route error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
