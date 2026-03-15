import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getUserByFid } from '@/lib/farcaster/neynar';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(
  _request: NextRequest,
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

  try {
    // Fetch user profile and channel activity in parallel
    const [user, allowlistResult, usersResult, activityResult] = await Promise.all([
      getUserByFid(targetFid, session.fid),
      supabaseAdmin
        .from('allowlist')
        .select('fid, real_name, ign')
        .eq('fid', targetFid)
        .eq('is_active', true)
        .maybeSingle(),
      supabaseAdmin
        .from('users')
        .select('zid, primary_wallet, respect_wallet, bio, display_name, username, pfp_url')
        .eq('fid', targetFid)
        .eq('is_active', true)
        .maybeSingle(),
      // Get this user's casts from cached channel_casts to tally engagement
      supabaseAdmin
        .from('channel_casts')
        .select('reactions, replies_count')
        .eq('fid', targetFid)
        .order('timestamp', { ascending: false })
        .limit(200),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const allowlistRow = allowlistResult.data;
    const usersRow = usersResult.data;

    // Tally engagement from cached casts
    let totalLikes = 0;
    let totalRecasts = 0;
    let totalReplies = 0;
    let castCount = 0;

    if (activityResult.data) {
      for (const row of activityResult.data) {
        castCount++;
        const reactions = row.reactions as { likes_count?: number; recasts_count?: number } | null;
        totalLikes += reactions?.likes_count ?? 0;
        totalRecasts += reactions?.recasts_count ?? 0;
        totalReplies += row.replies_count ?? 0;
      }
    }

    return NextResponse.json({
      user: usersRow ? {
        ...usersRow,
        fid: user.fid,
      } : null,
      fid: user.fid,
      username: user.username,
      display_name: user.display_name,
      displayName: user.display_name,
      pfp_url: user.pfp_url,
      pfpUrl: user.pfp_url,
      zid: usersRow?.zid || null,
      bio: user.profile?.bio?.text || null,
      followerCount: user.follower_count ?? 0,
      followingCount: user.following_count ?? 0,
      powerBadge: user.power_badge ?? false,
      custody_address: user.custody_address ?? null,
      verified_addresses: { eth_addresses: user.verified_addresses?.eth_addresses ?? [] },
      verifiedAddresses: user.verified_addresses?.eth_addresses ?? [],
      viewerContext: user.viewer_context ?? null,
      isZaoMember: !!allowlistRow,
      zaoName: allowlistRow?.real_name || null,
      activity: {
        casts: castCount,
        likes: totalLikes,
        recasts: totalRecasts,
        replies: totalReplies,
      },
    });
  } catch (err) {
    console.error('User profile error:', err);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
