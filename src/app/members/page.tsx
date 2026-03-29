import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/db/supabase';
import MembersDirectoryClient from './MembersDirectoryClient';

export const metadata: Metadata = {
  title: 'Members | ZAO OS',
  description: 'Browse the ZAO community — a decentralized music organization of artists, producers, and creators.',
};

// Revalidate every 5 minutes so the directory stays fresh without always hitting DB
export const revalidate = 300;

async function fetchInitialMembers() {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, fid, username, display_name, pfp_url, ens_name, bio,
        member_tier, zid, tags, bluesky_handle, x_handle, instagram_handle,
        soundcloud_url, spotify_url, audius_handle, discord_id,
        primary_wallet, location, last_active_at
      `)
      .eq('is_active', true)
      .order('zid', { ascending: true, nullsFirst: false })
      .limit(200);

    if (error || !users) return { members: [], filterOptions: { categories: [], locations: [] } };

    // Fetch respect data
    const { data: respectData } = await supabaseAdmin
      .from('respect_members')
      .select('fid, wallet_address, total_respect, fractal_count');

    const respectMap: Record<string, { total: number; fractalCount: number }> = {};
    for (const r of respectData || []) {
      const entry = { total: Number(r.total_respect), fractalCount: r.fractal_count || 0 };
      if (r.fid) respectMap[`fid:${r.fid}`] = entry;
      if (r.wallet_address) respectMap[`wallet:${r.wallet_address.toLowerCase()}`] = entry;
    }

    // Fetch artist profiles
    const fids = users.map(u => u.fid).filter(Boolean) as number[];
    const profileMap: Record<number, {
      category: string;
      thumbnailUrl: string | null;
      coverImageUrl: string | null;
      biography: string | null;
      isFeatured: boolean;
    }> = {};

    if (fids.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('community_profiles')
        .select('fid, category, thumbnail_url, cover_image_url, biography, is_featured')
        .in('fid', fids);

      for (const p of profiles || []) {
        if (p.fid) profileMap[p.fid] = {
          category: p.category,
          thumbnailUrl: p.thumbnail_url,
          coverImageUrl: p.cover_image_url,
          biography: p.biography,
          isFeatured: p.is_featured,
        };
      }
    }

    const members = users.map(u => {
      const respect = (u.fid ? respectMap[`fid:${u.fid}`] : null)
        || (u.primary_wallet ? respectMap[`wallet:${u.primary_wallet.toLowerCase()}`] : null)
        || null;

      const artistProfile = u.fid ? profileMap[u.fid] || null : null;

      return {
        id: u.id,
        fid: u.fid,
        username: u.username,
        displayName: u.display_name,
        pfpUrl: u.pfp_url,
        ensName: u.ens_name,
        zid: u.zid,
        tier: u.member_tier || 'community',
        bio: u.bio,
        tags: u.tags || [],
        location: u.location || null,
        platforms: {
          bluesky: u.bluesky_handle || null,
          x: u.x_handle || null,
          instagram: u.instagram_handle || null,
          soundcloud: u.soundcloud_url || null,
          spotify: u.spotify_url || null,
          audius: u.audius_handle || null,
          discord: u.discord_id || null,
        },
        respect,
        artistProfile,
        lastActiveAt: u.last_active_at || null,
      };
    });

    // Sort by respect total (default view)
    members.sort((a, b) => (b.respect?.total ?? 0) - (a.respect?.total ?? 0));

    const categories = [...new Set(members.map(m => m.artistProfile?.category).filter(Boolean))] as string[];
    const locations = [...new Set(members.map(m => m.location).filter(Boolean))] as string[];

    return { members, filterOptions: { categories, locations } };
  } catch {
    return { members: [], filterOptions: { categories: [], locations: [] } };
  }
}

export default async function MembersDirectoryPage() {
  const { members, filterOptions } = await fetchInitialMembers();

  return (
    <MembersDirectoryClient
      initialMembers={members}
      initialFilterOptions={filterOptions}
    />
  );
}
