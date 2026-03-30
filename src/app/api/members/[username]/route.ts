import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { resolveENSNames, getENSTextRecords, getENSAvatar, resolveBasenames } from '@/lib/ens/resolve';
import { logger } from '@/lib/logger';

/**
 * GET /api/members/[username] — Unified member profile
 * PUBLIC — no auth required. Shareable profile pages.
 * Merges: users + respect_members + community_profiles + Neynar live data
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {

  const { username } = await params;
  const lookup = decodeURIComponent(username).toLowerCase();

  try {
    // Find user by username, FID, or wallet
    let user = null;

    // Try username first
    const { data: byUsername } = await supabaseAdmin
      .from('users')
      .select('*')
      .ilike('username', lookup)
      .eq('is_active', true)
      .maybeSingle();
    user = byUsername;

    // Try FID if numeric
    if (!user && /^\d+$/.test(lookup)) {
      const { data: byFid } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('fid', parseInt(lookup))
        .eq('is_active', true)
        .maybeSingle();
      user = byFid;
    }

    // Try wallet address
    if (!user && lookup.startsWith('0x')) {
      const { data: byWallet } = await supabaseAdmin
        .from('users')
        .select('*')
        .ilike('primary_wallet', lookup)
        .eq('is_active', true)
        .maybeSingle();
      user = byWallet;
    }

    if (!user) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Fetch respect data
    let respect = null;
    if (user.respect_member_id) {
      const { data } = await supabaseAdmin
        .from('respect_members')
        .select('*')
        .eq('id', user.respect_member_id)
        .single();
      respect = data;
    } else {
      // Fallback: match by FID or wallet
      const { data } = await supabaseAdmin
        .from('respect_members')
        .select('*')
        .or(`fid.eq.${user.fid || 0},wallet_address.ilike.${(user.primary_wallet || '').toLowerCase()}`)
        .maybeSingle();
      respect = data;
    }

    // Fetch community profile (artist directory)
    let communityProfile = null;
    if (user.community_profile_id) {
      const { data } = await supabaseAdmin
        .from('community_profiles')
        .select('*')
        .eq('id', user.community_profile_id)
        .single();
      communityProfile = data;
    } else if (user.fid) {
      const { data } = await supabaseAdmin
        .from('community_profiles')
        .select('*')
        .eq('fid', user.fid)
        .maybeSingle();
      communityProfile = data;
    }

    // Fetch fractal history
    const lookupValue = user.primary_wallet?.toLowerCase() || user.fid?.toString() || '';
    const { data: fractalScores } = await supabaseAdmin
      .from('fractal_scores')
      .select('rank, score, fractal_sessions(name, session_date, scoring_era, participant_count, notes)')
      .or(`wallet_address.ilike.${lookupValue},member_name.ilike.${respect?.name || '___'}`)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch respect events
    const { data: events } = await supabaseAdmin
      .from('respect_events')
      .select('event_type, amount, description, event_date')
      .or(`wallet_address.ilike.${lookupValue},member_name.ilike.${respect?.name || '___'}`)
      .order('event_date', { ascending: false, nullsFirst: false })
      .limit(20);

    // Fetch Neynar live data (follower count, power badge)
    let neynarProfile = null;
    if (user.fid) {
      try {
        const res = await fetch(
          `https://api.neynar.com/v2/farcaster/user/bulk?fids=${user.fid}`,
          { headers: { 'api_key': process.env.NEYNAR_API_KEY || '' }, next: { revalidate: 300 } }
        );
        if (res.ok) {
          const data = await res.json();
          const fc = data.users?.[0];
          if (fc) {
            neynarProfile = {
              followerCount: fc.follower_count,
              followingCount: fc.following_count,
              powerBadge: fc.power_badge,
            };
          }
        }
      } catch { /* non-critical */ }
    }

    // Resolve ENS names for all wallets (with forward verification)
    const walletsToResolve = [user.primary_wallet, user.preferred_wallet, ...(user.verified_addresses || [])]
      .filter((w): w is string => !!w && w.startsWith('0x') && w.length === 42);
    const [ensNames, basenames] = await Promise.all([
      resolveENSNames(walletsToResolve),
      resolveBasenames(walletsToResolve),
    ]);

    // Fetch ENS text records (avatar, description, socials) if any name resolved
    const primaryEnsName = ensNames[(user.preferred_wallet || user.primary_wallet || '').toLowerCase()] || Object.values(ensNames)[0] || null;
    let ensTextRecords: Record<string, string> = {};
    let ensAvatar: string | null = null;
    if (primaryEnsName) {
      [ensTextRecords, ensAvatar] = await Promise.all([
        getENSTextRecords(primaryEnsName),
        getENSAvatar(primaryEnsName),
      ]);
    }

    // ── External reputation signals (all free, fetched in parallel) ──
    const primaryWallet = (user.preferred_wallet || user.primary_wallet || '').toLowerCase();
    const memberFid = user.fid;

    // Audius handle from user's platforms or ENS
    const audiusHandle = user.audius_handle || ensTextRecords['com.audius'] || null;

    const [
      openRankData, coinbaseVerified, easAttestations, neynarScoreVal, githubData,
      snapshotData, audiusData, efpData,
    ] = await Promise.allSettled([
      // OpenRank engagement score — SSL cert expired as of Mar 2026, disabled until they fix it
      // Re-enable when graph.cast.k3l.io cert is renewed
      Promise.resolve(null as { score: number; rank: number } | null),

      // Coinbase Verified ID (EAS on Base)
      primaryWallet ? fetch('https://base.easscan.org/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query { attestations(where: { recipient: { equals: "${primaryWallet}" }, schemaId: { equals: "0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9" }, revoked: { equals: false } }, take: 1) { id, time } }`,
        }),
        signal: AbortSignal.timeout(5000),
      }).then(r => r.ok ? r.json() : null).then(d => (d?.data?.attestations?.length || 0) > 0) : Promise.resolve(false),

      // EAS attestation count (Optimism)
      primaryWallet ? fetch('https://optimism.easscan.org/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query { attestations(where: { recipient: { equals: "${primaryWallet}" }, revoked: { equals: false } }) { id, schemaId, time } }`,
        }),
        signal: AbortSignal.timeout(5000),
      }).then(r => r.ok ? r.json() : null).then(d => d?.data?.attestations || []) : Promise.resolve([]),

      // Neynar score
      memberFid ? fetch(
        `https://api.neynar.com/v2/farcaster/user/bulk?fids=${memberFid}`,
        { headers: { 'api_key': process.env.NEYNAR_API_KEY || '' }, signal: AbortSignal.timeout(5000) }
      ).then(r => r.ok ? r.json() : null).then(d => d?.users?.[0]?.experimental?.neynar_user_score ?? null) : Promise.resolve(null),

      // GitHub — check ENS text record, or user's stored github handle (from x_handle pattern)
      (ensTextRecords['com.github'] || user.github_handle) ? fetch(
        `https://api.github.com/users/${ensTextRecords['com.github'] || user.github_handle}`,
        { signal: AbortSignal.timeout(5000) }
      ).then(r => r.ok ? r.json() : null) : Promise.resolve(null),

      // Snapshot DAO voting history
      primaryWallet ? fetch('https://hub.snapshot.org/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query { votes(where: { voter: "${primaryWallet}" }, first: 1000) { space { id } } }`,
        }),
        signal: AbortSignal.timeout(5000),
      }).then(r => r.ok ? r.json() : null).then(d => {
        const votes = d?.data?.votes || [];
        const spaces = new Set(votes.map((v: { space: { id: string } }) => v.space?.id));
        return { totalVotes: votes.length, daoCount: spaces.size };
      }) : Promise.resolve(null),

      // Audius profile — resolve handle then fetch user
      audiusHandle ? fetch(
        `https://api.audius.co/v1/resolve?url=https://audius.co/${encodeURIComponent(audiusHandle)}&app_name=ZAO-OS`,
        { signal: AbortSignal.timeout(5000), redirect: 'follow' }
      ).then(r => r.ok ? r.json() : null).then(d => {
        const u = d?.data;
        return u ? { followers: u.follower_count || 0, tracks: u.track_count || 0, playlists: u.playlist_count || 0, handle: u.handle } : null;
      }) : Promise.resolve(null),

      // EFP on-chain followers
      primaryWallet ? fetch(
        `https://api.ethfollow.xyz/api/v1/users/${primaryWallet}/stats`,
        { signal: AbortSignal.timeout(5000) }
      ).then(r => r.ok ? r.json() : null).then(d => d ? {
        followers: d.followers_count || 0,
        following: d.following_count || 0,
      } : null) : Promise.resolve(null),
    ]);

    const reputation = {
      neynarScore: neynarScoreVal.status === 'fulfilled' ? neynarScoreVal.value : null,
      openRank: openRankData.status === 'fulfilled' && openRankData.value ? {
        score: openRankData.value.score,
        rank: openRankData.value.rank,
      } : null,
      coinbaseVerified: coinbaseVerified.status === 'fulfilled' ? coinbaseVerified.value : false,
      easAttestationCount: easAttestations.status === 'fulfilled' ? (easAttestations.value as unknown[]).length : 0,
      github: githubData.status === 'fulfilled' && githubData.value ? {
        username: githubData.value.login,
        repos: githubData.value.public_repos,
        followers: githubData.value.followers,
      } : null,
      snapshot: snapshotData.status === 'fulfilled' ? snapshotData.value : null,
      audius: audiusData.status === 'fulfilled' ? audiusData.value : null,
      efp: efpData.status === 'fulfilled' ? efpData.value : null,
    };

    // Build history entries
    const history = (fractalScores || []).map(s => {
      const sess = Array.isArray(s.fractal_sessions) ? s.fractal_sessions[0] : s.fractal_sessions;
      const isOrdao = (sess as Record<string, unknown>)?.notes?.toString().includes('ORDAO');
      return {
        sessionName: (sess as Record<string, unknown>)?.name ?? 'Unknown',
        sessionDate: (sess as Record<string, unknown>)?.session_date ?? null,
        era: (sess as Record<string, unknown>)?.scoring_era ?? '2x',
        rank: Math.min(Math.max(s.rank, 1), 6),
        score: s.score,
        participants: (sess as Record<string, unknown>)?.participant_count ?? 0,
        source: isOrdao ? 'ordao' : 'og',
      };
    }).sort((a, b) => {
      const numA = Number(String(a.sessionName).match(/\d+/)?.[0] || 0);
      const numB = Number(String(b.sessionName).match(/\d+/)?.[0] || 0);
      return numB - numA;
    });

    // Strip sensitive fields from user
    const profile = {
      // Identity
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      realName: user.real_name,
      bio: user.bio,
      ensName: user.ens_name || primaryEnsName || null,
      ensNames,
      basenames,
      ensAvatar,
      ensProfile: Object.keys(ensTextRecords).length > 0 ? ensTextRecords : null,
      zid: user.zid,
      tier: user.member_tier || 'community',
      role: user.role,
      tags: user.tags || [],

      // ZAO subname
      zaoSubname: user.zao_subname || null,

      // Wallets (respect visibility settings)
      primaryWallet: user.primary_wallet,
      preferredWallet: user.preferred_wallet,
      hiddenWallets: user.hidden_wallets || [],

      // Platforms
      platforms: {
        bluesky: user.bluesky_handle,
        x: user.x_handle,
        instagram: user.instagram_handle,
        soundcloud: user.soundcloud_url,
        spotify: user.spotify_url,
        audius: user.audius_handle,
        discord: user.discord_id,
      },

      // Respect
      respect: respect ? {
        total: Number(respect.total_respect),
        fractal: Number(respect.fractal_respect),
        event: Number(respect.event_respect),
        hosting: Number(respect.hosting_respect),
        bonus: Number(respect.bonus_respect),
        onchainOG: Number(respect.onchain_og),
        onchainZOR: Number(respect.onchain_zor),
        fractalCount: respect.fractal_count || 0,
        firstRespectAt: respect.first_respect_at,
      } : null,

      // Community profile (artist directory)
      artistProfile: communityProfile ? {
        slug: communityProfile.slug,
        biography: communityProfile.biography,
        category: communityProfile.category,
        coverImageUrl: communityProfile.cover_image_url || user.farcaster_banner_url,
        thumbnailUrl: communityProfile.thumbnail_url,
        isFeatured: communityProfile.is_featured,
        website: communityProfile.website,
      } : null,

      // Live Farcaster data
      social: neynarProfile,

      // External reputation signals
      reputation,

      // History
      fractalHistory: history,
      events: (events || []).map(e => ({
        type: e.event_type,
        amount: Number(e.amount),
        description: e.description,
        date: e.event_date,
      })),

      // Enriched data
      location: user.location || null,
      website: user.website_url || communityProfile?.website || null,
      farcasterRegisteredAt: user.farcaster_registered_at || null,
      coverImageUrl: communityProfile?.cover_image_url || user.farcaster_banner_url || null,

      // Activity
      lastLoginAt: user.last_login_at,
      lastActiveAt: user.last_active_at,
      createdAt: user.created_at,
    };

    return NextResponse.json(profile, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch (err) {
    logger.error('[members/profile] error:', err);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}
