import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { ENV } from '@/lib/env';
import { communityConfig } from '@/../community.config';
import { logger } from '@/lib/logger';

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';

// In-memory cache — 1 hour TTL
let clusterCache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000;

interface ChannelActivity {
  channelId: string;
  channelName: string;
  members: { fid: number; username: string; pfpUrl: string | null }[];
}

/**
 * GET — Conversation clusters: group ZAO members by shared Farcaster channel activity
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return cached data if fresh
  if (clusterCache && Date.now() - clusterCache.timestamp < CACHE_TTL) {
    return NextResponse.json(clusterCache.data, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120' },
    });
  }

  try {
    // Get all active members with FIDs
    const { data: members } = await supabaseAdmin
      .from('users')
      .select('fid, username, pfp_url, display_name')
      .eq('is_active', true)
      .not('fid', 'is', null);

    if (!members || members.length === 0) {
      return NextResponse.json({ clusters: [] });
    }

    // Discover channels dynamically: fetch recent casts from ZAO members to find their active channels
    const communityChannels = communityConfig.farcaster.channels;
    const discoveredChannels = new Set<string>(communityChannels);

    // Fetch recent casts from ALL members to discover channels they post in
    // Also track per-member channel activity for "Your Channels"
    const memberChannelMap = new Map<number, Set<string>>(); // fid → channels
    const allFids = members.map(m => m.fid).filter(Boolean) as number[];

    // Process in batches of 5 to respect Neynar rate limits
    for (let i = 0; i < allFids.length; i += 5) {
      const batch = allFids.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(async (fid) => {
          const res = await fetch(
            `${NEYNAR_BASE}/feed?feed_type=filter&filter_type=fids&fids=${fid}&limit=50`,
            { headers: { 'x-api-key': ENV.NEYNAR_API_KEY }, signal: AbortSignal.timeout(5000) }
          );
          if (!res.ok) return { fid, channels: [] as string[] };
          const data = await res.json();
          const channels = (data.casts || [])
            .filter((c: { root_parent_url?: string }) => c.root_parent_url?.includes('channel/'))
            .map((c: { root_parent_url: string }) => {
              const match = c.root_parent_url.match(/channel\/([^/]+)/);
              return match?.[1];
            })
            .filter(Boolean) as string[];
          return { fid, channels: [...new Set(channels)] };
        })
      );
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          const { fid, channels } = r.value;
          memberChannelMap.set(fid, new Set(channels));
          for (const ch of channels) discoveredChannels.add(ch);
        }
      }
      await new Promise(r => setTimeout(r, 150));
    }

    const allChannels = [...discoveredChannels];

    // Build a FID-to-profile map
    const profileMap = new Map(
      members.map((m) => [m.fid, {
        fid: m.fid as number,
        username: m.username || '',
        pfpUrl: m.pfp_url || null,
      }])
    );
    const memberFids = new Set(members.map((m) => m.fid).filter(Boolean));

    // Build clusters from the member channel data we already collected (no extra API calls!)
    const channelMembersMap = new Map<string, Set<number>>();
    for (const [fid, channels] of memberChannelMap) {
      for (const ch of channels) {
        if (!channelMembersMap.has(ch)) channelMembersMap.set(ch, new Set());
        channelMembersMap.get(ch)!.add(fid);
      }
    }

    // Build cluster list — include ALL channels (even 1 member)
    const channelActivities: ChannelActivity[] = [];
    for (const [channelId, fids] of channelMembersMap) {
      const channelMembers = [...fids]
        .map(fid => profileMap.get(fid))
        .filter(Boolean) as ChannelActivity['members'];
      if (channelMembers.length > 0) {
        channelActivities.push({
          channelId,
          channelName: formatChannelName(channelId),
          members: channelMembers,
        });
      }
    }

    // Sort: community channels first, then by member count
    channelActivities.sort((a, b) => {
      const communitySet = new Set<string>(communityChannels);
      const aIsCommunity = communitySet.has(a.channelId) ? 1 : 0;
      const bIsCommunity = communitySet.has(b.channelId) ? 1 : 0;
      if (aIsCommunity !== bIsCommunity) return bIsCommunity - aIsCommunity;
      return b.members.length - a.members.length;
    });

    // Separate into shared clusters (2+) and solo channels (1 member)
    const sharedClusters = channelActivities
      .filter(ca => ca.members.length >= 2)
      .map(ca => ({ name: ca.channelName, channelId: ca.channelId, members: ca.members.slice(0, 20), size: ca.members.length }));

    // Current user's channels (all channels they post in)
    const currentUserChannels = memberChannelMap.get(session.fid);
    const yourChannels = currentUserChannels
      ? [...currentUserChannels].map(ch => ({
          channelId: ch,
          name: formatChannelName(ch),
          memberCount: channelMembersMap.get(ch)?.size || 0,
        }))
        .sort((a, b) => b.memberCount - a.memberCount)
      : [];

    const responseData = { clusters: sharedClusters, yourChannels, totalChannelsScanned: allChannels.length };
    clusterCache = { data: responseData, timestamp: Date.now() };

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120' },
    });
  } catch (err) {
    logger.error('Clusters error:', err);
    return NextResponse.json({ error: 'Failed to build clusters' }, { status: 500 });
  }
}

/** Convert channel ID to a display name */
function formatChannelName(channelId: string): string {
  const labels: Record<string, string> = {
    zao: 'ZAO Core',
    zabal: 'ZABAL',
    cocconcertz: 'CocConcertz',
    wavewarz: 'WaveWarZ',
    music: 'Music',
    'onchain-music': 'Onchain Music',
    hypersub: 'Hypersub',
    degen: 'Degen',
    base: 'Base',
    art: 'Art',
    dev: 'Developers',
    founders: 'Founders',
    nouns: 'Nouns',
    ethereum: 'Ethereum',
  };
  return labels[channelId] || channelId.charAt(0).toUpperCase() + channelId.slice(1);
}
