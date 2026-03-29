import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * GET /api/artists/featured — Featured artists for spotlight carousel
 * Session-authenticated. Returns compact artist cards for horizontal scroll.
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch featured community profiles
    const { data: profiles, error: profileErr } = await supabaseAdmin
      .from('community_profiles')
      .select('fid, category, thumbnail_url, cover_image_url, is_featured')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (profileErr) throw profileErr;
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ artists: [] });
    }

    const fids = profiles.map(p => p.fid).filter(Boolean);
    if (fids.length === 0) {
      return NextResponse.json({ artists: [] });
    }

    // Fetch user details for these FIDs
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('fid, username, display_name, pfp_url')
      .in('fid', fids)
      .eq('is_active', true);

    const userMap = new Map((users || []).map(u => [u.fid, u]));

    // Fetch song counts per FID
    const { data: songCounts } = await supabaseAdmin
      .from('songs')
      .select('submitted_by_fid')
      .in('submitted_by_fid', fids);

    const countMap = new Map<number, number>();
    for (const s of songCounts || []) {
      if (s.submitted_by_fid) {
        countMap.set(s.submitted_by_fid, (countMap.get(s.submitted_by_fid) || 0) + 1);
      }
    }

    // Build response
    const artists = profiles
      .map(p => {
        const user = userMap.get(p.fid);
        if (!user) return null;
        return {
          fid: p.fid,
          username: user.username,
          displayName: user.display_name,
          pfpUrl: user.pfp_url,
          coverImageUrl: p.cover_image_url || null,
          category: p.category || null,
          trackCount: countMap.get(p.fid) || 0,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ artists }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' },
    });
  } catch (err) {
    console.error('[artists/featured] error:', err);
    return NextResponse.json({ error: 'Failed to load featured artists' }, { status: 500 });
  }
}
