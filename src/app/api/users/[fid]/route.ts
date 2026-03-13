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
    const [user, allowlistResult, activityResult] = await Promise.all([
      getUserByFid(targetFid),
      supabaseAdmin
        .from('allowlist')
        .select('fid, real_name, ign')
        .eq('fid', targetFid)
        .eq('is_active', true)
        .maybeSingle(),
      // Get this user's casts from our cached channel_casts to tally engagement
      supabaseAdmin
        .from('channel_casts')
        .select('cast_data')
        .eq('author_fid', targetFid)
        .order('timestamp', { ascending: false })
        .limit(200),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const allowlistRow = allowlistResult.data;

    // Tally engagement from cached casts
    let totalLikes = 0;
    let totalRecasts = 0;
    let totalReplies = 0;
    let castCount = 0;

    if (activityResult.data) {
      for (const row of activityResult.data) {
        const cast = row.cast_data;
        if (!cast) continue;
        castCount++;
        totalLikes += cast.reactions?.likes_count ?? 0;
        totalRecasts += cast.reactions?.recasts_count ?? 0;
        totalReplies += cast.replies?.count ?? 0;
      }
    }

    return NextResponse.json({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bio: user.profile?.bio?.text || null,
      followerCount: user.follower_count ?? 0,
      followingCount: user.following_count ?? 0,
      powerBadge: user.power_badge ?? false,
      verifiedAddresses: user.verified_addresses?.eth_addresses ?? [],
      viewerContext: user.viewer_context ?? null,
      isZaoMember: !!allowlistRow,
      zaoName: allowlistRow?.real_name || null,
      // Channel activity stats
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
