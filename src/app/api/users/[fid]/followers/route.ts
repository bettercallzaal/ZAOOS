import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getFollowers, getRelevantFollowers } from '@/lib/farcaster/neynar';
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

  // Map sort tab to Neynar sort_type
  const sortType = sort === 'trending' ? 'algorithmic' as const : 'desc_chron' as const;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let users: any[];
    let nextCursor: { cursor?: string } | null = null;

    if (sort === 'relevant' && session.fid) {
      // Use the dedicated relevant followers endpoint for viewer-relative relevance
      const relevantData = await getRelevantFollowers(targetFid, session.fid);
      // The relevant endpoint returns { top_relevant_followers_hydrated: [...] }
      // Each entry has { user, ... } — extract the user objects
      const topRelevant = relevantData.top_relevant_followers_hydrated || [];
      users = topRelevant.map((item: { user?: Record<string, unknown> } & Record<string, unknown>) => item.user || item);
      // Relevant followers endpoint returns a fixed list — no pagination
    } else {
      const data = await getFollowers(targetFid, session.fid, sortType, cursor, 100);
      // Extract user objects from the response
      users = (data.users || []).map((item: { user?: Record<string, unknown> } & Record<string, unknown>) => item.user || item);
      nextCursor = data.next || null;
    }

    // Batch check allowlist membership
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

    // Client-side sorting for non-API sorts
    if (sort === 'inactive') {
      users.sort((a: { active_status?: string; follower_count?: number }, b: { active_status?: string; follower_count?: number }) => {
        const aInactive = a.active_status === 'inactive' ? 0 : 1;
        const bInactive = b.active_status === 'inactive' ? 0 : 1;
        if (aInactive !== bInactive) return aInactive - bInactive;
        return (a.follower_count ?? 0) - (b.follower_count ?? 0);
      });
    } else if (sort === 'popular') {
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
      next: nextCursor,
    });
  } catch (err) {
    console.error('Followers error:', err);
    return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 });
  }
}
