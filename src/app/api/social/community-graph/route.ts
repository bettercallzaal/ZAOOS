import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { ENV } from '@/lib/env';

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';

/**
 * GET — Fetch the community social graph: who follows whom among ZAO members
 * Returns a matrix of follow relationships between all active members
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all active members with FIDs
    const { data: members } = await supabaseAdmin
      .from('users')
      .select('fid, display_name, username, pfp_url, zid')
      .eq('is_active', true)
      .not('fid', 'is', null);

    if (!members || members.length === 0) {
      return NextResponse.json({ members: [], connections: [], stats: {} });
    }

    const fids = members.map((m) => m.fid).filter(Boolean) as number[];

    // Fetch bulk user data from Neynar for follower/following counts + viewer_context
    // We need to check each member's relationships with other members
    // Use the bulk users endpoint with viewer_fid to get viewer context for each
    const memberMap = new Map(members.map((m) => [m.fid, m]));

    // For each member, get who among the community they follow
    // Use Neynar bulk user lookup: fetch all community FIDs with each member as viewer
    // This is expensive, so we batch and cache
    const connections: { from: number; to: number }[] = [];
    const followerCounts = new Map<number, number>();
    const followingCounts = new Map<number, number>();

    // Batch: fetch all members as bulk users, using session user as viewer first
    const fidChunks: number[][] = [];
    for (let i = 0; i < fids.length; i += 100) {
      fidChunks.push(fids.slice(i, i + 100));
    }

    // Get all member profiles with session user's viewer context
    const allProfiles: Record<string, unknown>[] = [];
    for (const chunk of fidChunks) {
      const res = await fetch(
        `${NEYNAR_BASE}/user/bulk?fids=${chunk.join(',')}&viewer_fid=${session.fid}`,
        { headers: { 'x-api-key': ENV.NEYNAR_API_KEY } }
      );
      if (res.ok) {
        const data = await res.json();
        allProfiles.push(...(data.users || []));
      }
    }

    // Store follower/following counts from profiles
    for (const profile of allProfiles) {
      const p = profile as { fid: number; follower_count: number; following_count: number };
      followerCounts.set(p.fid, p.follower_count || 0);
      followingCounts.set(p.fid, p.following_count || 0);
    }

    // Now for each member, check who in the community follows them
    // Use the "relevant followers" or just check following lists
    // Most efficient: for each member, get their following list and intersect with community FIDs
    // But that's N API calls. Instead, use the bulk lookup with viewer_fid for each member
    // to get viewer_context (following/followed_by)

    // Optimization: for small communities (<50), we can do N bulk lookups
    // Each call returns viewer_context showing if viewer follows/is followed by each user
    for (const viewerFid of fids) {
      // Skip if this would be too many calls (>50 members)
      if (fids.length > 50) break;

      for (const chunk of fidChunks) {
        const otherFids = chunk.filter((f) => f !== viewerFid);
        if (otherFids.length === 0) continue;

        const res = await fetch(
          `${NEYNAR_BASE}/user/bulk?fids=${otherFids.join(',')}&viewer_fid=${viewerFid}`,
          { headers: { 'x-api-key': ENV.NEYNAR_API_KEY } }
        );
        if (res.ok) {
          const data = await res.json();
          for (const u of data.users || []) {
            const user = u as { fid: number; viewer_context?: { following: boolean } };
            if (user.viewer_context?.following) {
              connections.push({ from: viewerFid, to: user.fid });
            }
          }
        }
      }
    }

    // Build member nodes with enriched data
    const nodes = members
      .filter((m) => m.fid)
      .map((m) => {
        const inbound = connections.filter((c) => c.to === m.fid).length;
        const outbound = connections.filter((c) => c.from === m.fid).length;
        const mutuals = connections.filter(
          (c) => c.from === m.fid && connections.some((c2) => c2.from === c.to && c2.to === m.fid)
        ).length;

        return {
          fid: m.fid,
          displayName: m.display_name,
          username: m.username,
          pfpUrl: m.pfp_url,
          zid: m.zid,
          followerCount: followerCounts.get(m.fid!) || 0,
          followingCount: followingCounts.get(m.fid!) || 0,
          communityFollowers: inbound,
          communityFollowing: outbound,
          mutuals,
        };
      });

    // Stats
    const totalConnections = connections.length;
    const maxPossible = fids.length * (fids.length - 1);
    const density = maxPossible > 0 ? Math.round((totalConnections / maxPossible) * 100) : 0;

    // Most connected (by mutual count)
    const sorted = [...nodes].sort((a, b) => b.mutuals - a.mutuals);
    const disconnected = nodes.filter((n) => n.communityFollowers === 0 && n.communityFollowing === 0);

    return NextResponse.json({
      members: nodes,
      connections,
      stats: {
        totalMembers: nodes.length,
        totalConnections,
        density,
        mostConnected: sorted.slice(0, 5).map((n) => ({ fid: n.fid, displayName: n.displayName, mutuals: n.mutuals })),
        disconnectedCount: disconnected.length,
      },
      currentFid: session.fid,
    });
  } catch (err) {
    console.error('Community graph error:', err);
    return NextResponse.json({ error: 'Failed to build community graph' }, { status: 500 });
  }
}
