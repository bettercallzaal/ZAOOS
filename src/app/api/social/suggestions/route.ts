import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { ENV } from '@/lib/env';

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';

/**
 * GET — Follow suggestions for the current user
 * Combines Neynar suggestions with community context
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch suggestions from Neynar and community members in parallel
    const [suggestionsRes, membersResult] = await Promise.all([
      fetch(`${NEYNAR_BASE}/user/suggestions?fid=${session.fid}&limit=20&viewer_fid=${session.fid}`, {
        headers: { 'x-api-key': ENV.NEYNAR_API_KEY },
      }),
      supabaseAdmin
        .from('users')
        .select('fid, display_name, username, pfp_url, zid')
        .eq('is_active', true)
        .not('fid', 'is', null),
    ]);

    const memberFids = new Set((membersResult.data || []).map((m) => m.fid));

    let suggestions: Record<string, unknown>[] = [];
    if (suggestionsRes.ok) {
      const data = await suggestionsRes.json();
      suggestions = data.users || [];
    }

    // Enrich suggestions with ZAO membership
    const enriched = suggestions.map((u) => {
      const user = u as {
        fid: number;
        username: string;
        display_name: string;
        pfp_url: string;
        follower_count: number;
        following_count: number;
        power_badge: boolean;
        profile?: { bio?: { text?: string } };
        viewer_context?: { following: boolean; followed_by: boolean };
      };
      return {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name,
        pfpUrl: user.pfp_url,
        bio: user.profile?.bio?.text || null,
        followerCount: user.follower_count || 0,
        followingCount: user.following_count || 0,
        powerBadge: user.power_badge || false,
        isZaoMember: memberFids.has(user.fid),
        followsYou: user.viewer_context?.followed_by || false,
      };
    });

    // Sort: ZAO members first, then by follower count
    enriched.sort((a, b) => {
      if (a.isZaoMember !== b.isZaoMember) return a.isZaoMember ? -1 : 1;
      return b.followerCount - a.followerCount;
    });

    // Also get community members that the user doesn't follow yet
    // Fetch viewer context for all community members
    const communityFids = [...memberFids].filter((f) => f !== session.fid);
    const unfollowedMembers: typeof enriched = [];

    if (communityFids.length > 0) {
      const fidChunks: number[][] = [];
      for (let i = 0; i < communityFids.length; i += 100) {
        fidChunks.push(communityFids.slice(i, i + 100));
      }

      for (const chunk of fidChunks) {
        const res = await fetch(
          `${NEYNAR_BASE}/user/bulk?fids=${chunk.join(',')}&viewer_fid=${session.fid}`,
          { headers: { 'x-api-key': ENV.NEYNAR_API_KEY } }
        );
        if (res.ok) {
          const data = await res.json();
          for (const u of data.users || []) {
            const user = u as {
              fid: number;
              username: string;
              display_name: string;
              pfp_url: string;
              follower_count: number;
              following_count: number;
              power_badge: boolean;
              profile?: { bio?: { text?: string } };
              viewer_context?: { following: boolean; followed_by: boolean };
            };
            if (!user.viewer_context?.following) {
              membersResult.data?.find((m) => m.fid === user.fid);
              unfollowedMembers.push({
                fid: user.fid,
                username: user.username,
                displayName: user.display_name,
                pfpUrl: user.pfp_url,
                bio: user.profile?.bio?.text || null,
                followerCount: user.follower_count || 0,
                followingCount: user.following_count || 0,
                powerBadge: user.power_badge || false,
                isZaoMember: true,
                followsYou: user.viewer_context?.followed_by || false,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      suggestions: enriched.slice(0, 15),
      unfollowedMembers,
    });
  } catch (err) {
    console.error('Suggestions error:', err);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}
