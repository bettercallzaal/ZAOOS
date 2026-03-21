import { getSessionData } from '@/lib/auth/session';
import { getUserByFid } from '@/lib/farcaster/neynar';
import { supabaseAdmin } from '@/lib/db/supabase';
import { SettingsClient } from './SettingsClient';

async function fetchProfile(fid: number) {
  try {
    const [neynarUser, dbResult] = await Promise.all([
      getUserByFid(fid),
      supabaseAdmin
        .from('users')
        .select('zid, primary_wallet, respect_wallet, role, created_at, display_name, bio, ign, real_name, bluesky_handle, bluesky_did, solana_wallet')
        .eq('fid', fid)
        .eq('is_active', true)
        .maybeSingle(),
    ]);

    return {
      fid,
      zid: dbResult.data?.zid || null,
      // Farcaster identity (read-only)
      fc_display_name: neynarUser?.display_name || null,
      username: neynarUser?.username || null,
      pfp_url: neynarUser?.pfp_url || null,
      fc_bio: neynarUser?.profile?.bio?.text || null,
      follower_count: neynarUser?.follower_count ?? 0,
      following_count: neynarUser?.following_count ?? 0,
      power_badge: neynarUser?.power_badge ?? false,
      // ZAO-specific profile (editable)
      zao_display_name: dbResult.data?.display_name || '',
      zao_bio: dbResult.data?.bio || '',
      ign: dbResult.data?.ign || '',
      real_name: dbResult.data?.real_name || '',
      primary_wallet: dbResult.data?.primary_wallet || '',
      respect_wallet: dbResult.data?.respect_wallet || null,
      role: dbResult.data?.role || 'member',
      custody_address: neynarUser?.custody_address || null,
      verified_addresses: neynarUser?.verified_addresses?.eth_addresses || [],
      created_at: dbResult.data?.created_at || null,
      bluesky_handle: dbResult.data?.bluesky_handle || null,
      solana_wallet: dbResult.data?.solana_wallet || null,
    };
  } catch (err) {
    console.error('Failed to fetch profile for settings:', err);
    return null;
  }
}

export default async function SettingsPage() {
  const session = await getSessionData();
  const profile = session?.fid ? await fetchProfile(session.fid) : null;

  return (
    <SettingsClient
      session={session}
      profile={profile}
    />
  );
}
