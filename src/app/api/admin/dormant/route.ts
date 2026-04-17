import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const querySchema = z.object({
  days: z.coerce.number().int().min(7).max(365).default(30),
});

/**
 * GET /api/admin/dormant — Dormant member alerts
 * Admin only. Returns active members who haven't been seen in N days,
 * enriched with respect data and sorted by totalRespect descending.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 });
  }

  const parsed = querySchema.safeParse({
    days: request.nextUrl.searchParams.get('days') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { days } = parsed.data;

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffISO = cutoff.toISOString();

    // Fetch dormant users: active, have been seen, but not recently
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, fid, username, display_name, pfp_url, last_active_at, respect_member_id')
      .eq('is_active', true)
      .not('last_active_at', 'is', null)
      .lt('last_active_at', cutoffISO)
      .order('last_active_at', { ascending: true })
      .limit(100);

    if (usersError) throw usersError;
    if (!users || users.length === 0) {
      return NextResponse.json({ dormant: [], total: 0, cutoffDays: days });
    }

    // Collect respect_member_ids to look up
    const respectIds = users
      .map((u) => u.respect_member_id)
      .filter((id): id is string => !!id);

    // Fetch respect data in one query
    const respectMap = new Map<string, { total_respect: number; fractal_count: number }>();
    if (respectIds.length > 0) {
      const { data: respectRows } = await supabaseAdmin
        .from('respect_members')
        .select('id, total_respect, fractal_count')
        .in('id', respectIds);

      if (respectRows) {
        for (const r of respectRows) {
          respectMap.set(r.id, {
            total_respect: r.total_respect || 0,
            fractal_count: r.fractal_count || 0,
          });
        }
      }
    }

    const now = Date.now();

    // Enrich users
    const dormant = users.map((u) => {
      const respect = u.respect_member_id
        ? respectMap.get(u.respect_member_id)
        : null;
      const lastActiveMs = new Date(u.last_active_at).getTime();
      const daysSinceActive = Math.floor((now - lastActiveMs) / (1000 * 60 * 60 * 24));

      return {
        id: u.id,
        fid: u.fid,
        username: u.username,
        displayName: u.display_name,
        pfpUrl: u.pfp_url,
        lastActiveAt: u.last_active_at,
        daysSinceActive,
        totalRespect: respect?.total_respect ?? 0,
        fractalCount: respect?.fractal_count ?? 0,
      };
    });

    // Sort by totalRespect descending (most valuable first)
    dormant.sort((a, b) => b.totalRespect - a.totalRespect);

    return NextResponse.json({
      dormant,
      total: dormant.length,
      cutoffDays: days,
    });
  } catch (err) {
    logger.error('[admin/dormant] error:', err);
    return NextResponse.json({ error: 'Failed to fetch dormant members' }, { status: 500 });
  }
}
