import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/db/supabase';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { PageHeader } from '@/components/navigation/PageHeader';
import CommunityMembersClient from './CommunityMembersClient';

export const metadata: Metadata = {
  title: 'Community Members | ZAO OS',
  description: 'Join the ZAO community — artists, producers, and creators taking ownership of their profit margin, data, and IP rights.',
};

export const revalidate = 300;

async function fetchCommunityMembers() {
  try {
    // Fetch active users with their community profiles
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, fid, username, display_name, pfp_url, zid,
        member_tier, tags, soundcloud_url, spotify_url, audius_handle
      `)
      .eq('is_active', true)
      .order('zid', { ascending: true, nullsFirst: false });

    if (error || !users) return [];

    // Fetch artist profiles for category/role info
    const fids = users.map(u => u.fid).filter(Boolean) as number[];
    const profileMap: Record<number, { category: string; biography: string | null }> = {};

    if (fids.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('community_profiles')
        .select('fid, category, biography')
        .in('fid', fids);

      for (const p of profiles || []) {
        if (p.fid) profileMap[p.fid] = { category: p.category, biography: p.biography };
      }
    }

    return users.map(u => {
      const profile = u.fid ? profileMap[u.fid] || null : null;
      return {
        id: u.id,
        fid: u.fid,
        username: u.username,
        displayName: u.display_name,
        pfpUrl: u.pfp_url,
        zid: u.zid,
        tier: u.member_tier || 'community',
        tags: u.tags || [],
        category: profile?.category || null,
        biography: profile?.biography || null,
        soundcloud: u.soundcloud_url,
        spotify: u.spotify_url,
        audius: u.audius_handle,
      };
    });
  } catch {
    return [];
  }
}

export default async function CommunityPage() {
  const members = await fetchCommunityMembers();

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-36">
      <PageHeader
        title="Artist"
        subtitle="Community members"
        rightAction={<div className="md:hidden"><NotificationBell /></div>}
      />

      {/* Hero CTA */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-6">
        <div className="bg-gradient-to-r from-[#f5a623]/10 to-[#ffd700]/5 rounded-xl p-5 border border-[#f5a623]/30 text-center">
          <p className="text-base font-bold text-white mb-2">Join our Community!</p>
          <p className="text-sm text-gray-400">
            Join as a creator and take ownership of your profit margin, data, and IP rights.
          </p>
        </div>
      </div>

      {/* Members Grid */}
      <div className="max-w-lg mx-auto px-4 pb-6">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-1">
          {members.length} Members
        </p>
        <CommunityMembersClient members={members} />
      </div>
    </div>
  );
}
