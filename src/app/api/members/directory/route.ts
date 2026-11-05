import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';
import {
  applyWalletVisibility,
  isPublicProfileColumnMissing,
  memberScope,
  projectPublicMember,
} from '@/lib/members/public-profile';

const querySchema = z.object({
  search: z.string().max(200).optional(),
  tier: z.enum(['all', 'respect_holder', 'community']).optional(),
  tag: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
  active_since: z.enum(['7d', '30d', '90d']).optional(),
  has_ens: z.enum(['true', 'false']).optional(),
  platform: z.enum(['audius', 'spotify', 'soundcloud', 'bluesky', 'x', 'instagram']).optional(),
  min_respect: z.coerce.number().int().min(0).optional(),
  featured: z.enum(['true']).optional(),
  sort: z.enum(['name', 'respect', 'recent', 'active']).optional(),
  limit: z.enum(['10', '25', '50', '100', '200', '300']).default('10'),
  offset: z.coerce.number().int().min(0).default(0),
});

type Text = string | null;

/** One row of the users select below. */
interface DirectoryUser {
  id: string;
  fid: number | null;
  username: Text;
  display_name: Text;
  pfp_url: Text;
  primary_wallet: Text;
  preferred_wallet: Text;
  custody_address: Text;
  verified_addresses: string[] | null;
  ens_name: Text;
  bio: Text;
  role: Text;
  member_tier: Text;
  zid: number | null;
  real_name: Text;
  discord_id: Text;
  tags: string[] | null;
  bluesky_handle: Text;
  x_handle: Text;
  instagram_handle: Text;
  soundcloud_url: Text;
  spotify_url: Text;
  audius_handle: Text;
  solana_wallet: Text;
  location: Text;
  last_login_at: Text;
  last_active_at: Text;
  created_at: string;
  respect_member_id: Text;
  hidden_wallets: string[] | null;
  public_name?: Text;
  public_fields?: string[] | null;
}

/**
 * GET /api/members/directory — Unified member directory
 * PUBLIC: no auth required. Used by /members page. Without a member session it
 * lists only members who picked a public name and only the fields they turned on.
 * Filters and sorts on hidden columns would reveal them, so that view filters the
 * projected records and always sorts by public name.
 * Joins users + respect_members + community_profiles into one response.
 */
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const {
    search,
    tier,
    category,
    location,
    active_since,
    has_ens,
    platform,
    min_respect,
    featured,
    sort = 'respect',
    limit,
    offset,
  } = parsed.data;

  try {
    const session = await getSessionData();
    const isPublicView = !session;

    // ── Step 1: Fetch base user list ─────────────────────────────────────────
    let query = supabaseAdmin
      .from('users')
      .select(
        `
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
        location,
        last_login_at,
        last_active_at,
        created_at,
        respect_member_id,
        hidden_wallets${isPublicView ? ', public_name, public_fields' : ''}
      `,
        { count: 'exact' },
      )
      .eq('is_active', true);

    if (isPublicView) {
      query = query.not('public_name', 'is', null).order('public_name', { ascending: true });
      if (search) {
        query = query.ilike('public_name', `%${search.replace(/[\\%_]/g, '\\$&')}%`);
      }
    }

    // Filters
    if (!isPublicView && tier && tier !== 'all') {
      query = query.eq('member_tier', tier);
    }

    if (!isPublicView && search) {
      query = query.or(
        `display_name.ilike.%${search}%,username.ilike.%${search}%,real_name.ilike.%${search}%,ens_name.ilike.%${search}%`,
      );
    }

    if (!isPublicView && location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (!isPublicView && active_since) {
      const days = active_since === '7d' ? 7 : active_since === '30d' ? 30 : 90;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      query = query.gte('last_active_at', since);
    }

    if (!isPublicView && has_ens === 'true') {
      query = query.not('ens_name', 'is', null);
    }

    if (!isPublicView && platform) {
      const platformCol: Record<string, string> = {
        audius: 'audius_handle',
        spotify: 'spotify_url',
        soundcloud: 'soundcloud_url',
        bluesky: 'bluesky_handle',
        x: 'x_handle',
        instagram: 'instagram_handle',
      };
      const col = platformCol[platform];
      if (col) query = query.not(col, 'is', null);
    }

    // Sort
    if (!isPublicView) {
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
        default:
          query = query.order('zid', { ascending: true, nullsFirst: false });
          break;
      }
    }

    const { data: users, error, count } = await query.range(offset, offset + parseInt(limit) - 1);
    // Before the migration nobody can have opted in, so the public list is empty.
    if (isPublicView && isPublicProfileColumnMissing(error)) {
      return NextResponse.json({
        members: [],
        total: 0,
        tiers: { respectHolders: 0, community: 0 },
        filterOptions: { categories: [], locations: [] },
        pagination: { limit: parseInt(limit, 10), offset, hasMore: false },
      });
    }
    if (error) throw error;

    // The select string is built at runtime, so Supabase cannot infer the row type.
    const userList = (users || []) as unknown as DirectoryUser[];
    const fids = userList.map((u) => u.fid).filter(Boolean) as number[];
    const wallets = userList
      .map((u) => u.primary_wallet?.toLowerCase())
      .filter(Boolean) as string[];

    // ── Step 2: Parallel fetch respect + profiles ────────────────────────────
    const [respectResult, profilesResult] = await Promise.all([
      (async () => {
        if (fids.length === 0 && wallets.length === 0) return { data: [] };
        // Build OR clause — Supabase .or() takes comma-separated filter strings; empty string = no-op
        const fidClause = fids.length > 0 ? `fid.in.(${fids.join(',')})` : '';
        const walletClause =
          wallets.length > 0 ? `wallet_address.in.(${wallets.map((w) => `"${w}"`).join(',')})` : '';
        return supabaseAdmin
          .from('respect_members')
          .select(
            'fid, wallet_address, total_respect, fractal_respect, onchain_og, onchain_zor, fractal_count, first_respect_at',
          )
          .or(`${fidClause}${fidClause && walletClause ? ',' : ''}${walletClause}`);
      })(),
      (async () => {
        if (fids.length === 0) return { data: [] };
        return supabaseAdmin
          .from('community_profiles')
          .select('fid, category, thumbnail_url, cover_image_url, biography, is_featured, slug')
          .in('fid', fids);
      })(),
    ]);

    const respectData = respectResult.data || [];
    const profileData = profilesResult.data || [];

    const respectMap: Record<
      string,
      {
        total_respect: number;
        fractal_respect: number;
        onchain_og: number;
        onchain_zor: number;
        fractal_count: number;
        first_respect_at: string | null;
      }
    > = {};

    for (const r of respectData) {
      if (r.fid)
        respectMap[`fid:${r.fid}`] = {
          total_respect: Number(r.total_respect),
          fractal_respect: Number(r.fractal_respect),
          onchain_og: Number(r.onchain_og),
          onchain_zor: Number(r.onchain_zor),
          fractal_count: r.fractal_count || 0,
          first_respect_at: r.first_respect_at,
        };
      if (r.wallet_address)
        respectMap[`wallet:${r.wallet_address.toLowerCase()}`] = {
          total_respect: Number(r.total_respect),
          fractal_respect: Number(r.fractal_respect),
          onchain_og: Number(r.onchain_og),
          onchain_zor: Number(r.onchain_zor),
          fractal_count: r.fractal_count || 0,
          first_respect_at: r.first_respect_at,
        };
    }

    const profileMap: Record<
      number,
      {
        category: string;
        thumbnail_url: string | null;
        cover_image_url: string | null;
        biography: string | null;
        is_featured: boolean;
        slug: string;
      }
    > = {};
    for (const p of profileData) {
      if (p.fid) profileMap[p.fid] = p;
    }

    // ── Step 3: Build unified records with DB-level filters applied ───────────
    const fullMembers = userList.map((u) => {
      const respect =
        (u.fid ? respectMap[`fid:${u.fid}`] : null) ||
        (u.primary_wallet ? respectMap[`wallet:${u.primary_wallet.toLowerCase()}`] : null) ||
        null;

      const artistProfile = u.fid ? profileMap[u.fid] || null : null;

      return {
        id: u.id,
        fid: u.fid,
        username: u.username,
        displayName: u.display_name,
        pfpUrl: u.pfp_url,
        realName: u.real_name,
        bio: u.bio,
        ensName: u.ens_name,
        zid: u.zid,
        tier: u.member_tier || 'community',
        role: u.role,
        tags: u.tags || [],
        primaryWallet: u.primary_wallet,
        preferredWallet: u.preferred_wallet,
        custodyAddress: u.custody_address,
        verifiedAddresses: u.verified_addresses || [],
        solanaWallet: u.solana_wallet,
        platforms: {
          bluesky: u.bluesky_handle || null,
          x: u.x_handle || null,
          instagram: u.instagram_handle || null,
          soundcloud: u.soundcloud_url || null,
          spotify: u.spotify_url || null,
          audius: u.audius_handle || null,
          discord: u.discord_id || null,
        },
        respect: respect
          ? {
              total: respect.total_respect,
              fractal: respect.fractal_respect,
              onchainOG: respect.onchain_og,
              onchainZOR: respect.onchain_zor,
              fractalCount: respect.fractal_count,
              firstRespectAt: respect.first_respect_at,
            }
          : null,
        artistProfile: artistProfile
          ? {
              category: artistProfile.category,
              thumbnailUrl: artistProfile.thumbnail_url,
              coverImageUrl: artistProfile.cover_image_url,
              biography: artistProfile.biography,
              isFeatured: artistProfile.is_featured,
              slug: artistProfile.slug,
            }
          : null,
        location: u.location || null,
        lastLoginAt: u.last_login_at,
        lastActiveAt: u.last_active_at,
        createdAt: u.created_at,
      };
    });

    let members = fullMembers.map((m, i) => {
      const u = userList[i];
      if (isPublicView) return projectPublicMember(u, m);
      return memberScope(session, u.fid) === 'full' ? m : applyWalletVisibility(u, m);
    });

    if (isPublicView) {
      const since = active_since
        ? Date.now() - { '7d': 7, '30d': 30, '90d': 90 }[active_since] * 86400000
        : null;
      const needle = location?.toLowerCase();
      members = members.filter(
        (m) =>
          (!tier || tier === 'all' || m.tier === tier) &&
          (!needle || m.location?.toLowerCase().includes(needle)) &&
          (has_ens !== 'true' || !!m.ensName) &&
          (!platform || !!m.platforms[platform]) &&
          (since === null || (!!m.lastActiveAt && new Date(m.lastActiveAt).getTime() >= since)),
      );
    }

    // ── Step 4: Post-query filters (category, featured, min_respect) ───────
    if (category) {
      members = members.filter(
        (m) => m.artistProfile?.category?.toLowerCase() === category.toLowerCase(),
      );
    }

    if (featured === 'true') {
      members = members.filter((m) => m.artistProfile?.isFeatured);
    }

    if (min_respect !== undefined) {
      members = members.filter((m) => (m.respect?.total ?? 0) >= min_respect);
    }

    // Respect sort (needs joined data not in SQL)
    if (!isPublicView && sort === 'respect') {
      members.sort((a, b) => (b.respect?.total ?? 0) - (a.respect?.total ?? 0));
    }

    // ── Step 5: Build filter options from current page ───────────────────────
    const categories = [
      ...new Set(members.map((m) => m.artistProfile?.category).filter(Boolean)),
    ] as string[];
    const locations = [...new Set(members.map((m) => m.location).filter(Boolean))] as string[];

    return NextResponse.json(
      {
        members,
        total: count ?? members.length,
        tiers: {
          respectHolders: members.filter((m) => m.tier === 'respect_holder').length,
          community: members.filter((m) => m.tier === 'community').length,
        },
        filterOptions: { categories, locations },
        pagination: {
          limit: parseInt(limit, 10),
          offset,
          hasMore: (count ?? 0) > offset + members.length,
        },
      },
      isPublicView ? undefined : { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (err) {
    logger.error('[directory] error:', err);
    return NextResponse.json({ error: 'Failed to load directory' }, { status: 500 });
  }
}
