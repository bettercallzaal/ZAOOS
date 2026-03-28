import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * GET /api/social/growth?fid=123&days=30
 *
 * Returns member_stats_history for the requested FID over the requested period.
 * Defaults: current user's FID, last 30 days.
 * Requires session auth.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;

    // Parse FID (default: current user)
    const fidParam = params.get('fid');
    let fid = session.fid;
    if (fidParam) {
      const parsed = Number(fidParam);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return NextResponse.json(
          { error: 'Invalid fid parameter' },
          { status: 400 }
        );
      }
      fid = parsed;
    }

    if (!fid) {
      return NextResponse.json(
        { error: 'No Farcaster account linked' },
        { status: 400 }
      );
    }

    // Parse days (default: 30, max: 365)
    const daysParam = params.get('days');
    let days = 30;
    if (daysParam) {
      const parsed = Number(daysParam);
      if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 365) {
        return NextResponse.json(
          { error: 'Invalid days parameter (1-365)' },
          { status: 400 }
        );
      }
      days = parsed;
    }

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('member_stats_history')
      .select('snapshot_date, follower_count, following_count, engagement_score')
      .eq('fid', fid)
      .gte('snapshot_date', startDateStr)
      .order('snapshot_date', { ascending: true });

    if (error) {
      console.error('Growth query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch growth data' },
        { status: 500 }
      );
    }

    const history = (data || []).map((row) => ({
      date: row.snapshot_date,
      followerCount: row.follower_count,
      followingCount: row.following_count,
      engagementScore: row.engagement_score,
    }));

    return NextResponse.json({ fid, days, history });
  } catch (err) {
    console.error('Growth route error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
