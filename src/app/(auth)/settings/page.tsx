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
        .select('zid, primary_wallet, respect_wallet, role, created_at')
        .eq('fid', fid)
        .eq('is_active', true)
        .maybeSingle(),
    ]);

    return {
      fid,
      zid: dbResult.data?.zid || null,
      display_name: neynarUser?.display_name || null,
      username: neynarUser?.username || null,
      pfp_url: neynarUser?.pfp_url || null,
      bio: neynarUser?.profile?.bio?.text || null,
      primary_wallet: dbResult.data?.primary_wallet || '',
      respect_wallet: dbResult.data?.respect_wallet || null,
      role: dbResult.data?.role || 'member',
      custody_address: neynarUser?.custody_address || null,
      verified_addresses: neynarUser?.verified_addresses?.eth_addresses || [],
      created_at: dbResult.data?.created_at || null,
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
