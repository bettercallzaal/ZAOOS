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
    const user = await getUserByFid(targetFid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check ZAO membership
    const { data: allowlistRow } = await supabaseAdmin
      .from('allowlist')
      .select('fid, real_name, ign')
      .eq('fid', targetFid)
      .eq('is_active', true)
      .maybeSingle();

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
    });
  } catch (err) {
    console.error('User profile error:', err);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
