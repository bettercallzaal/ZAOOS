import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';

const querySchema = z.object({
  fid: z.coerce.number().int().positive(),
});

/**
 * GET /api/members/profile?fid=NUMBER
 *
 * Returns an enriched member profile combining Neynar social graph data,
 * ZAO-specific Supabase data, active Farcaster channels, music submissions,
 * and governance participation.
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    fid: req.nextUrl.searchParams.get('fid'),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid FID', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { fid } = parsed.data;

  try {
    // Fetch all data sources in parallel
    const [neynarRes, userResult, allowlistResult, channelsRes, submissionsResult, proposalsResult, votesResult] =
      await Promise.allSettled([
        // 1. Neynar user data
        fetch(`${NEYNAR_BASE}/user/bulk?fids=${fid}&viewer_fid=${session.fid}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ENV.NEYNAR_API_KEY,
          },
          signal: AbortSignal.timeout(10000),
        }),

        // 2. ZAO users table
        supabaseAdmin
          .from('users')
          .select('zid, primary_wallet, respect_wallet, bio, display_name, username, pfp_url, bluesky_handle')
          .eq('fid', fid)
          .eq('is_active', true)
          .maybeSingle(),

        // 3. Allowlist / membership info
        supabaseAdmin
          .from('allowlist')
          .select('fid, real_name, ign, wallet_address')
          .eq('fid', fid)
          .eq('is_active', true)
          .maybeSingle(),

        // 4. Active Farcaster channels
        fetch(`${NEYNAR_BASE}/user/channels?fid=${fid}&limit=20`, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ENV.NEYNAR_API_KEY,
          },
          signal: AbortSignal.timeout(10000),
        }),

        // 5. Song submissions count
        supabaseAdmin
          .from('song_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('submitted_by_fid', fid),

        // 6. Proposals created count
        supabaseAdmin
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('author_fid', fid),

        // 7. Votes cast count
        supabaseAdmin
          .from('proposal_votes')
          .select('id', { count: 'exact', head: true })
          .eq('voter_fid', fid),
      ]);

    // ---- Parse Neynar user data ----
    let neynarUser: Record<string, unknown> | null = null;
    if (neynarRes.status === 'fulfilled' && neynarRes.value.ok) {
      const json = await neynarRes.value.json();
      neynarUser = json.users?.[0] || null;
    }

    if (!neynarUser) {
      return NextResponse.json({ error: 'User not found on Farcaster' }, { status: 404 });
    }

    // ---- Parse channels ----
    let activeChannels: { id: string; name: string; imageUrl: string | null }[] = [];
    if (channelsRes.status === 'fulfilled' && channelsRes.value.ok) {
      const json = await channelsRes.value.json();
      activeChannels = (json.channels || []).map(
        (ch: { channel?: { id: string; name: string; image_url?: string }; id?: string; name?: string; image_url?: string }) => {
          const c = ch.channel || ch;
          return {
            id: c.id,
            name: c.name || c.id,
            imageUrl: c.image_url || null,
          };
        }
      );
    }

    // ---- Supabase data (gracefully degrade) ----
    const usersRow =
      userResult.status === 'fulfilled' ? userResult.value.data : null;
    const allowlistRow =
      allowlistResult.status === 'fulfilled' ? allowlistResult.value.data : null;

    const songsSubmitted =
      submissionsResult.status === 'fulfilled'
        ? submissionsResult.value.count ?? 0
        : 0;
    const proposalsCreated =
      proposalsResult.status === 'fulfilled'
        ? proposalsResult.value.count ?? 0
        : 0;
    const votesCast =
      votesResult.status === 'fulfilled'
        ? votesResult.value.count ?? 0
        : 0;

    // ---- Build enriched profile ----
    const user = neynarUser as Record<string, unknown>;
    const profile = user.profile as Record<string, unknown> | undefined;
    const bioObj = profile?.bio as Record<string, unknown> | undefined;
    const verifiedAddresses = user.verified_addresses as
      | { eth_addresses?: string[]; sol_addresses?: string[] }
      | undefined;

    return NextResponse.json({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bannerUrl: (profile as Record<string, unknown> | undefined)?.header_img || null,
      bio: bioObj?.text || null,
      followerCount: user.follower_count ?? 0,
      followingCount: user.following_count ?? 0,
      powerBadge: user.power_badge ?? false,
      verifiedAddresses: verifiedAddresses?.eth_addresses ?? [],
      solAddresses: verifiedAddresses?.sol_addresses ?? [],
      viewerContext: user.viewer_context ?? null,

      // ZAO-specific
      isZaoMember: !!allowlistRow,
      zaoName: allowlistRow?.real_name || null,
      zid: usersRow?.zid || null,
      blueskyHandle: usersRow?.bluesky_handle || null,

      // Active Farcaster channels
      activeChannels,

      // Community stats
      communityStats: {
        songsSubmitted,
        proposalsCreated,
        votesCast,
      },
    });
  } catch (err) {
    logger.error('Member profile enrichment error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch enriched profile' },
      { status: 500 }
    );
  }
}
