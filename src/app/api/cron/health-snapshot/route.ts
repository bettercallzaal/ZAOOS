import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * GET /api/cron/health-snapshot
 *
 * Weekly cron (Sunday midnight UTC) that snapshots community health metrics.
 * Vercel cron — no auth check needed (Vercel handles cron authentication).
 *
 * Required table (run in Supabase SQL Editor):
 *
 * CREATE TABLE IF NOT EXISTS health_snapshots (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   snapshot_date DATE NOT NULL,
 *   total_members INTEGER DEFAULT 0,
 *   active_members INTEGER DEFAULT 0,
 *   with_fid INTEGER DEFAULT 0,
 *   total_sessions INTEGER DEFAULT 0,
 *   total_respect DECIMAL DEFAULT 0,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * CREATE INDEX IF NOT EXISTS idx_health_snapshots_date ON health_snapshots(snapshot_date DESC);
 * ALTER TABLE health_snapshots ENABLE ROW LEVEL SECURITY;
 */
export async function GET() {
  try {
    const [
      totalMembersResult,
      activeMembersResult,
      withFidResult,
      totalSessionsResult,
      totalRespectResult,
    ] = await Promise.all([
      // 1. Total respect_members count
      supabaseAdmin
        .from('respect_members')
        .select('*', { count: 'exact', head: true }),

      // 2. Active members (fractal_count > 0)
      supabaseAdmin
        .from('respect_members')
        .select('*', { count: 'exact', head: true })
        .gt('fractal_count', 0),

      // 3. Members with FID (fid is not null)
      supabaseAdmin
        .from('respect_members')
        .select('*', { count: 'exact', head: true })
        .not('fid', 'is', null),

      // 4. Total fractal_sessions count
      supabaseAdmin
        .from('fractal_sessions')
        .select('*', { count: 'exact', head: true }),

      // 5. Sum of total_respect from respect_members
      supabaseAdmin
        .from('respect_members')
        .select('total_respect'),
    ]);

    const totalMembers = totalMembersResult.count ?? 0;
    const activeMembers = activeMembersResult.count ?? 0;
    const withFid = withFidResult.count ?? 0;
    const totalSessions = totalSessionsResult.count ?? 0;

    // Sum total_respect manually since Supabase JS doesn't support .sum()
    const totalRespect = (totalRespectResult.data ?? []).reduce(
      (sum, row) => sum + (Number(row.total_respect) || 0),
      0
    );

    const snapshotDate = new Date().toISOString().split('T')[0];

    const { error: insertError } = await supabaseAdmin
      .from('health_snapshots')
      .insert({
        snapshot_date: snapshotDate,
        total_members: totalMembers,
        active_members: activeMembers,
        with_fid: withFid,
        total_sessions: totalSessions,
        total_respect: totalRespect,
      });

    if (insertError) {
      console.error('Health snapshot insert failed:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert health snapshot' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Health snapshot cron error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
