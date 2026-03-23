import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getFollowing } from '@/lib/farcaster/neynar';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { fid } = await params;
  const targetFid = parseInt(fid, 10);
  if (isNaN(targetFid)) {
    return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
  }

  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get('cursor') || undefined;
  const sort = searchParams.get('sort') || 'recent';

  const sortType = sort === 'relevant' ? 'algorithmic' as const : 'desc_chron' as const;

  try {
    const data = await getFollowing(targetFid, session.fid, sortType, cursor, 100);

    let users = (data.users || []).map((item: { user?: Record<string, unknown> } & Record<string, unknown>) => item.user || item);

    // Batch check allowlist
    const fids = users.map((u: { fid: number }) => u.fid).filter(Boolean);
    let allowlistFids = new Set<number>();
    if (fids.length > 0) {
      const { data: allowlistRows } = await supabaseAdmin
        .from('allowlist')
        .select('fid')
        .in('fid', fids)
        .eq('is_active', true);
      allowlistFids = new Set((allowlistRows || []).map((r: { fid: number }) => r.fid));
    }

    // Batch fetch ZIDs for OG badge
    let zidMap = new Map<number, number>();
    if (fids.length > 0) {
      const { data: zidRows } = await supabaseAdmin
        .from('users')
        .select('fid, zid')
        .in('fid', fids)
        .not('zid', 'is', null);
      if (zidRows) {
        zidMap = new Map(zidRows.map((r: { fid: number; zid: number }) => [r.fid, r.zid]));
      }
    }

    // Enrich users with ZAO membership + ZID
    users = users.map((u: { fid: number }) => ({
      ...u,
      isZaoMember: allowlistFids.has(u.fid),
      zid: zidMap.get(u.fid) ?? null,
    }));

    if (sort === 'popular') {
      users.sort((a: { follower_count?: number }, b: { follower_count?: number }) =>
        (b.follower_count ?? 0) - (a.follower_count ?? 0)
      );
    } else if (sort === 'mutual') {
      users = users.filter((u: { viewer_context?: { following?: boolean; followed_by?: boolean } }) =>
        u.viewer_context?.following && u.viewer_context?.followed_by
      );
    } else if (sort === 'zao') {
      users = users.filter((u: { isZaoMember?: boolean }) => u.isZaoMember);
    }

    return NextResponse.json({
      users,
      next: data.next || null,
    });
  } catch (err) {
    console.error('Following error:', err);
    return NextResponse.json({ error: 'Failed to fetch following' }, { status: 500 });
  }
}
