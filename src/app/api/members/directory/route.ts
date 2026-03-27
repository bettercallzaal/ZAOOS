import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db/supabase';

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
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * GET /api/members/directory — Unified member directory
 * PUBLIC — no auth required. Used by /members page.
 * Joins users + respect_members into one response.
 */
export async function GET(req: NextRequest) {

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const { search, tier, tag, category, location, active_since, has_ens, platform, min_respect, featured, sort = 'respect', limit, offset } = parsed.data;

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
        location,
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

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (active_since) {
      const days = active_since === '7d' ? 7 : active_since === '30d' ? 30 : 90;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      query = query.gte('last_active_at', since);
    }

    if (has_ens === 'true') {
      query = query.not('ens_name', 'is', null);
    }

    if (platform) {
      const platformCol: Record<string, string> = {
        audius: 'audius_handle', spotify: 'spotify_url', soundcloud: 'soundcloud_url',
        bluesky: 'bluesky_handle', x: 'x_handle', instagram: 'instagram_handle',
      };
      const col = platformCol[platform];
      if (col) query = query.not(col, 'is', null);
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

    // Fetch community profiles to merge artist data
    const userFids = (users || []).map(u => u.fid).filter(Boolean);
    const profileMap: Record<number, { category: string; thumbnail_url: string | null; cover_image_url: string | null; biography: string | null; is_featured: boolean; slug: string }> = {};

    if (userFids.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('community_profiles')
        .select('fid, category, thumbnail_url, cover_image_url, biography, is_featured, slug')
        .in('fid', userFids);

      for (const p of profiles || []) {
        if (p.fid) profileMap[p.fid] = p;
      }
    }

    // Build unified member records
    const members = (users || []).map(u => {
      const respect = (u.fid ? respectMap[`fid:${u.fid}`] : null)
        || (u.primary_wallet ? respectMap[`wallet:${u.primary_wallet.toLowerCase()}`] : null)
        || null;

      const artistProfile = u.fid ? profileMap[u.fid] || null : null;

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

        // Artist profile (from community_profiles)
        artistProfile: artistProfile ? {
          category: artistProfile.category,
          thumbnailUrl: artistProfile.thumbnail_url,
          coverImageUrl: artistProfile.cover_image_url,
          biography: artistProfile.biography,
          isFeatured: artistProfile.is_featured,
          slug: artistProfile.slug,
        } : null,

        // Extra
        location: u.location || null,

        // Activity
        lastLoginAt: u.last_login_at,
        lastActiveAt: u.last_active_at,
        createdAt: u.created_at,
      };
    });

    // Post-query filters (need joined data)
    let filtered = members;

    if (category) {
      filtered = filtered.filter(m => m.artistProfile?.category?.toLowerCase() === category.toLowerCase());
    }

    if (featured === 'true') {
      filtered = filtered.filter(m => m.artistProfile?.isFeatured);
    }

    if (min_respect !== undefined) {
      filtered = filtered.filter(m => (m.respect?.total ?? 0) >= min_respect);
    }

    // Re-sort by respect if that's the sort mode (can't do in SQL since it's a join)
    if (sort === 'respect') {
      filtered.sort((a, b) => (b.respect?.total ?? 0) - (a.respect?.total ?? 0));
    }

    // Compute available filter options from full (unfiltered) member set
    const categories = [...new Set(members.map(m => m.artistProfile?.category).filter(Boolean))] as string[];
    const locations = [...new Set(members.map(m => m.location).filter(Boolean))] as string[];

    return NextResponse.json({
      members: filtered,
      total: filtered.length,
      tiers: {
        respectHolders: filtered.filter(m => m.tier === 'respect_holder').length,
        community: filtered.filter(m => m.tier === 'community').length,
      },
      filterOptions: { categories, locations },
    });
  } catch (err) {
    console.error('[directory] error:', err);
    return NextResponse.json({ error: 'Failed to load directory' }, { status: 500 });
  }
}
