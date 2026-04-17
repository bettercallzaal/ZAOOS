import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/quick-stats — Pulse stats for admin dashboard home card
 * Admin only. Returns counts for members, sessions, respect, dormancy, audit actions.
 */
export async function GET() {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 });
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      totalMembers,
      activeMembers,
      membersWithFid,
      totalSessions,
      sessionsThisWeek,
      respectSum,
      auditActionsThisWeek,
      dormantUsers,
    ] = await Promise.all([
      // Total respect_members count
      supabaseAdmin
        .from('respect_members')
        .select('*', { count: 'exact', head: true }),

      // Active members (fractal_count > 0)
      supabaseAdmin
        .from('respect_members')
        .select('*', { count: 'exact', head: true })
        .gt('fractal_count', 0),

      // Members with FID
      supabaseAdmin
        .from('respect_members')
        .select('*', { count: 'exact', head: true })
        .not('fid', 'is', null),

      // Total fractal_sessions
      supabaseAdmin
        .from('fractal_sessions')
        .select('*', { count: 'exact', head: true }),

      // Sessions this week
      supabaseAdmin
        .from('fractal_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('session_date', sevenDaysAgo),

      // Sum of all total_respect
      supabaseAdmin
        .from('respect_members')
        .select('total_respect'),

      // Audit log actions this week
      supabaseAdmin
        .from('security_audit_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo),

      // Dormant users (last_active_at < 30 days ago AND is_active = true)
      supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .lt('last_active_at', thirtyDaysAgo),
    ]);

    const totalRespect = (respectSum.data || []).reduce(
      (sum: number, r: { total_respect: number | null }) => sum + (r.total_respect || 0),
      0
    );

    const totalMembersCount = totalMembers.count || 0;
    const membersWithFidCount = membersWithFid.count || 0;

    return NextResponse.json({
      totalMembers: totalMembersCount,
      activeMembers: activeMembers.count || 0,
      membersWithFid: membersWithFidCount,
      membersWithoutFid: totalMembersCount - membersWithFidCount,
      totalSessions: totalSessions.count || 0,
      sessionsThisWeek: sessionsThisWeek.count || 0,
      totalRespect,
      auditActionsThisWeek: auditActionsThisWeek.count || 0,
      dormantUsers: dormantUsers.count || 0,
    });
  } catch (err) {
    logger.error('[quick-stats] error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
