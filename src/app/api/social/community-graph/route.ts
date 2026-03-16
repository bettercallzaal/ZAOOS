import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { ENV } from '@/lib/env';

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';

// Cache the full graph in memory for 10 minutes (drastically reduces Neynar calls)
let graphCache: { data: unknown; timestamp: number } | null = null;
const GRAPH_CACHE_TTL = 10 * 60 * 1000;

/**
 * GET — Fetch the community social graph: who follows whom among ZAO members
 * Uses a single Neynar bulk lookup per member-chunk with the session user as viewer,
 * then caches the result for 10 minutes so subsequent requests are free.
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return cached graph if fresh
  if (graphCache && Date.now() - graphCache.timestamp < GRAPH_CACHE_TTL) {
    return NextResponse.json(graphCache.data);
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

    // Instead of N*N bulk lookups, do N lookups (one per member as viewer)
    // with all other members as targets. Cap at 100 members for safety.
    const cappedFids = fids.slice(0, 100);
    const connections: { from: number; to: number }[] = [];
    const followerCounts = new Map<number, number>();
    const followingCounts = new Map<number, number>();

    // Chunk target FIDs for Neynar bulk lookup (max 100 per call)
    const fidChunks: number[][] = [];
    for (let i = 0; i < cappedFids.length; i += 100) {
      fidChunks.push(cappedFids.slice(i, i + 100));
    }

    // Phase 1: Get profiles with session user as viewer (for follower/following counts)
    for (const chunk of fidChunks) {
      try {
        const res = await fetch(
          `${NEYNAR_BASE}/user/bulk?fids=${chunk.join(',')}&viewer_fid=${session.fid}`,
          { headers: { 'x-api-key': ENV.NEYNAR_API_KEY }, signal: AbortSignal.timeout(10000) }
        );
        if (res.ok) {
          const data = await res.json();
          for (const p of data.users || []) {
            followerCounts.set(p.fid, p.follower_count || 0);
            followingCounts.set(p.fid, p.following_count || 0);
          }
        }
      } catch (err) {
        console.error('Graph profile fetch error:', err);
      }
    }

    // Phase 2: For each member as viewer, get their follow relationships
    // Batch: process 5 viewers concurrently to limit parallel Neynar calls
    const BATCH_SIZE = 5;
    for (let batchStart = 0; batchStart < cappedFids.length; batchStart += BATCH_SIZE) {
      const viewerBatch = cappedFids.slice(batchStart, batchStart + BATCH_SIZE);

      await Promise.all(
        viewerBatch.map(async (viewerFid) => {
          for (const chunk of fidChunks) {
            const otherFids = chunk.filter((f) => f !== viewerFid);
            if (otherFids.length === 0) continue;

            try {
              const res = await fetch(
                `${NEYNAR_BASE}/user/bulk?fids=${otherFids.join(',')}&viewer_fid=${viewerFid}`,
                { headers: { 'x-api-key': ENV.NEYNAR_API_KEY }, signal: AbortSignal.timeout(10000) }
              );
              if (res.ok) {
                const data = await res.json();
                for (const u of data.users || []) {
                  if (u.viewer_context?.following) {
                    connections.push({ from: viewerFid, to: u.fid });
                  }
                }
              }
            } catch (err) {
              console.error(`Graph fetch error for viewer ${viewerFid}:`, err);
            }
          }
        })
      );
    }

    // Build member nodes with enriched data
    const connectionSet = new Set(connections.map((c) => `${c.from}→${c.to}`));
    const nodes = members
      .filter((m) => m.fid && cappedFids.includes(m.fid))
      .map((m) => {
        const inbound = connections.filter((c) => c.to === m.fid).length;
        const outbound = connections.filter((c) => c.from === m.fid).length;
        const mutuals = connections.filter(
          (c) => c.from === m.fid && connectionSet.has(`${c.to}→${m.fid}`)
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
    const maxPossible = cappedFids.length * (cappedFids.length - 1);
    const density = maxPossible > 0 ? Math.round((totalConnections / maxPossible) * 100) : 0;

    const sorted = [...nodes].sort((a, b) => b.mutuals - a.mutuals);
    const disconnected = nodes.filter((n) => n.communityFollowers === 0 && n.communityFollowing === 0);

    const responseData = {
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
    };

    // Cache the result
    graphCache = { data: responseData, timestamp: Date.now() };

    return NextResponse.json(responseData);
  } catch (err) {
    console.error('Community graph error:', err);
    return NextResponse.json({ error: 'Failed to build community graph' }, { status: 500 });
  }
}
