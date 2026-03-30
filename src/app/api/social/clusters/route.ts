import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { ENV } from '@/lib/env';
import { communityConfig } from '@/../community.config';

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

    // Channels to scan: community channels + popular Farcaster channels
    const communityChannels = communityConfig.farcaster.channels;
    const extraChannels = [
      'music', 'onchain-music', 'hypersub', 'degen', 'base',
      'art', 'dev', 'founders', 'nouns', 'ethereum',
    ];
    const allChannels = [...new Set([...communityChannels, ...extraChannels])];

    // Build a FID-to-profile map
    const profileMap = new Map(
      members.map((m) => [m.fid, {
        fid: m.fid as number,
        username: m.username || '',
        pfpUrl: m.pfp_url || null,
      }])
    );
    const memberFids = new Set(members.map((m) => m.fid).filter(Boolean));

    // For each channel, fetch recent casts and find which ZAO members posted
    const channelActivities: ChannelActivity[] = [];
    const BATCH_SIZE = 3; // Limit concurrent Neynar calls

    for (let i = 0; i < allChannels.length; i += BATCH_SIZE) {
      const batch = allChannels.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (channelId) => {
          const params = new URLSearchParams({
            channel_ids: channelId,
            limit: '100',
            with_recasts: 'false',
          });
          const res = await fetch(`${NEYNAR_BASE}/feed/channels?${params}`, {
            headers: { 'x-api-key': ENV.NEYNAR_API_KEY },
            signal: AbortSignal.timeout(10000),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return { channelId, casts: data.casts || [] };
        })
      );

      for (const result of results) {
        if (result.status !== 'fulfilled' || !result.value) continue;
        const { channelId, casts } = result.value;

        // Find unique ZAO members who posted in this channel
        const seenFids = new Set<number>();
        const channelMembers: ChannelActivity['members'] = [];

        for (const cast of casts) {
          const fid = cast.author?.fid;
          if (!fid || !memberFids.has(fid) || seenFids.has(fid)) continue;
          seenFids.add(fid);
          const profile = profileMap.get(fid);
          if (profile) {
            channelMembers.push(profile);
          }
        }

        if (channelMembers.length >= 2) {
          channelActivities.push({
            channelId,
            channelName: formatChannelName(channelId),
            members: channelMembers,
          });
        }
      }
    }

    // Sort by member count descending
    channelActivities.sort((a, b) => b.members.length - a.members.length);

    const clusters = channelActivities.map((ca) => ({
      name: ca.channelName,
      channelId: ca.channelId,
      members: ca.members.slice(0, 20), // Cap displayed members
      size: ca.members.length,
    }));

    const responseData = { clusters };
    clusterCache = { data: responseData, timestamp: Date.now() };

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120' },
    });
  } catch (err) {
    console.error('Clusters error:', err);
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
