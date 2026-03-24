import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const querySchema = z.object({
  search: z.string().max(200).optional(),
  tier: z.enum(['all', 'respect_holder', 'community']).optional(),
  tag: z.string().max(50).optional(),
  sort: z.enum(['name', 'respect', 'recent', 'active']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * GET /api/members/directory — Unified member CRM view
 * Joins users + respect_members + community_profiles into one response
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const { search, tier, tag, sort = 'respect', limit, offset } = parsed.data;

  try {
    // Base query: users with respect data joined
    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        fid,
        username,
        display_name,
        pfp_url,
        primary_wallet,
        preferred_wallet,
        custody_address,
        verified_addresses,
        ens_name,
        bio,
        role,
        member_tier,
        zid,
        real_name,
        discord_id,
        tags,
        bluesky_handle,
        x_handle,
        instagram_handle,
        soundcloud_url,
        spotify_url,
        audius_handle,
        solana_wallet,
        last_login_at,
        last_active_at,
        created_at,
        respect_member_id
      `, { count: 'exact' })
      .eq('is_active', true);

    // Filters
    if (tier && tier !== 'all') {
      query = query.eq('member_tier', tier);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (search) {
      query = query.or(
        `display_name.ilike.%${search}%,username.ilike.%${search}%,real_name.ilike.%${search}%,ens_name.ilike.%${search}%`
      );
    }

    // Sort
    switch (sort) {
      case 'name':
        query = query.order('display_name', { ascending: true, nullsFirst: false });
        break;
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'active':
        query = query.order('last_active_at', { ascending: false, nullsFirst: false });
        break;
      case 'respect':
      default:
        // Sort by ZID (lower = more OG) then by name
        query = query.order('zid', { ascending: true, nullsFirst: false });
        break;
    }

    const { data: users, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    // Fetch respect data for these members
    const fids = (users || []).map(u => u.fid).filter(Boolean);
    const wallets = (users || []).map(u => u.primary_wallet?.toLowerCase()).filter(Boolean);

    const respectMap: Record<string, {
      total_respect: number;
      fractal_respect: number;
      onchain_og: number;
      onchain_zor: number;
      fractal_count: number;
      first_respect_at: string | null;
    }> = {};

    if (fids.length > 0 || wallets.length > 0) {
      const { data: respectData } = await supabaseAdmin
        .from('respect_members')
        .select('fid, wallet_address, total_respect, fractal_respect, onchain_og, onchain_zor, fractal_count, first_respect_at');

      for (const r of respectData || []) {
        if (r.fid) respectMap[`fid:${r.fid}`] = {
          total_respect: Number(r.total_respect),
          fractal_respect: Number(r.fractal_respect),
          onchain_og: Number(r.onchain_og),
          onchain_zor: Number(r.onchain_zor),
          fractal_count: r.fractal_count || 0,
          first_respect_at: r.first_respect_at,
        };
        if (r.wallet_address) respectMap[`wallet:${r.wallet_address.toLowerCase()}`] = {
          total_respect: Number(r.total_respect),
          fractal_respect: Number(r.fractal_respect),
          onchain_og: Number(r.onchain_og),
          onchain_zor: Number(r.onchain_zor),
          fractal_count: r.fractal_count || 0,
          first_respect_at: r.first_respect_at,
        };
      }
    }

    // Build unified member records
    const members = (users || []).map(u => {
      const respect = (u.fid ? respectMap[`fid:${u.fid}`] : null)
        || (u.primary_wallet ? respectMap[`wallet:${u.primary_wallet.toLowerCase()}`] : null)
        || null;

      return {
        // Identity
        id: u.id,
        fid: u.fid,
        username: u.username,
        displayName: u.display_name,
        pfpUrl: u.pfp_url,
        realName: u.real_name,
        bio: u.bio,
        ensName: u.ens_name,
        zid: u.zid,

        // Tier & role
        tier: u.member_tier || 'community',
        role: u.role,
        tags: u.tags || [],

        // Wallets
        primaryWallet: u.primary_wallet,
        preferredWallet: u.preferred_wallet,
        custodyAddress: u.custody_address,
        verifiedAddresses: u.verified_addresses || [],
        solanaWallet: u.solana_wallet,

        // Social platforms
        platforms: {
          bluesky: u.bluesky_handle || null,
          x: u.x_handle || null,
          instagram: u.instagram_handle || null,
          soundcloud: u.soundcloud_url || null,
          spotify: u.spotify_url || null,
          audius: u.audius_handle || null,
          discord: u.discord_id || null,
        },

        // Respect data (from joined respect_members)
        respect: respect ? {
          total: respect.total_respect,
          fractal: respect.fractal_respect,
          onchainOG: respect.onchain_og,
          onchainZOR: respect.onchain_zor,
          fractalCount: respect.fractal_count,
          firstRespectAt: respect.first_respect_at,
        } : null,

        // Activity
        lastLoginAt: u.last_login_at,
        lastActiveAt: u.last_active_at,
        createdAt: u.created_at,
      };
    });

    // Re-sort by respect if that's the sort mode (can't do in SQL since it's a join)
    if (sort === 'respect') {
      members.sort((a, b) => (b.respect?.total ?? 0) - (a.respect?.total ?? 0));
    }

    return NextResponse.json({
      members,
      total: count || 0,
      tiers: {
        respectHolders: members.filter(m => m.tier === 'respect_holder').length,
        community: members.filter(m => m.tier === 'community').length,
      },
    });
  } catch (err) {
    console.error('[directory] error:', err);
    return NextResponse.json({ error: 'Failed to load directory' }, { status: 500 });
  }
}
