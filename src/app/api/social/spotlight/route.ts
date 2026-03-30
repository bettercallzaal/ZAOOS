import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/**
 * GET /api/social/spotlight — Today's spotlight member
 * Deterministic: sorts by respect, picks index = dayOfYear % count
 * Cached 1 hour via response headers.
 */
export async function GET() {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch members with respect data, sorted by total respect desc
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('fid, username, display_name, pfp_url, bio, location, last_active_at, respect_member_id')
      .eq('is_active', true)
      .not('username', 'is', null)
      .order('zid', { ascending: true, nullsFirst: false })
      .limit(200);

    if (error) throw error;
    if (!users || users.length === 0) {
      return NextResponse.json({ member: null });
    }

    // Fetch respect for all
    const fids = users.map(u => u.fid).filter(Boolean) as number[];
    const { data: respectData } = fids.length > 0
      ? await supabaseAdmin.from('respect_members').select('fid, total_respect').in('fid', fids)
      : { data: [] };

    const respectMap: Record<number, number> = {};
    for (const r of respectData || []) {
      if (r.fid) respectMap[r.fid] = Number(r.total_respect);
    }

    // Sort by respect descending, then pick by day-of-year
    const sorted = [...users].sort((a, b) => (respectMap[b.fid] ?? 0) - (respectMap[a.fid] ?? 0));
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const pick = sorted[dayOfYear % sorted.length];

    const member = {
      fid: pick.fid,
      displayName: pick.display_name,
      username: pick.username,
      pfpUrl: pick.pfp_url,
      bio: pick.bio,
      location: pick.location,
      respect: respectMap[pick.fid] ? { total: respectMap[pick.fid] } : null,
      lastActiveAt: pick.last_active_at,
    };

    return NextResponse.json({ member }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' },
    });
  } catch (err) {
    logger.error('[spotlight] error:', err);
    return NextResponse.json({ error: 'Failed to load spotlight' }, { status: 500 });
  }
}
