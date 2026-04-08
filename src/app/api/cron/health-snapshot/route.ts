import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/**
 * GET /api/cron/health-snapshot
 *
 * Weekly cron (Sunday midnight UTC) that snapshots community health metrics.
 * Auth: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalMembersResult,
      activeMembersResult,
      withFidResult,
      totalSessionsResult,
      totalRespectResult,
    ] = await Promise.all([
      supabaseAdmin
        .from('respect_members')
        .select('*', { count: 'exact', head: true }),

      supabaseAdmin
        .from('respect_members')
        .select('*', { count: 'exact', head: true })
        .gt('fractal_count', 0),

      supabaseAdmin
        .from('respect_members')
        .select('*', { count: 'exact', head: true })
        .not('fid', 'is', null),

      supabaseAdmin
        .from('fractal_sessions')
        .select('*', { count: 'exact', head: true }),

      // Use RPC for server-side SUM instead of fetching all rows
      supabaseAdmin
        .rpc('sum_total_respect'),
    ]);

    const totalMembers = totalMembersResult.count ?? 0;
    const activeMembers = activeMembersResult.count ?? 0;
    const withFid = withFidResult.count ?? 0;
    const totalSessions = totalSessionsResult.count ?? 0;

    // RPC returns single value; fall back to 0
    const totalRespect = totalRespectResult.data ?? 0;

    const snapshotDate = new Date().toISOString().split('T')[0];

    const { error: insertError } = await supabaseAdmin
      .from('health_snapshots')
      .upsert({
        snapshot_date: snapshotDate,
        total_members: totalMembers,
        active_members: activeMembers,
        with_fid: withFid,
        total_sessions: totalSessions,
        total_respect: totalRespect,
      }, { onConflict: 'snapshot_date' });

    if (insertError) {
      logger.error('Health snapshot insert failed:', insertError);
      return NextResponse.json(
        { error: `Failed to insert health snapshot: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Health snapshot cron error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
