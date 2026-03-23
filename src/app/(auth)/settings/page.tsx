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
        .select('zid, primary_wallet, respect_wallet, role, created_at, display_name, bio, ign, real_name, bluesky_handle, bluesky_did, solana_wallet, x_handle, instagram_handle, soundcloud_url, spotify_url, audius_handle, lens_profile_id, lens_access_token, hive_username')
        .eq('fid', fid)
        .eq('is_active', true)
        .maybeSingle(),
    ]);

    const result = {
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
      // Cross-posting platforms
      lens_profile_id: dbResult.data?.lens_profile_id || null,
      lens_has_token: !!dbResult.data?.lens_access_token,
      hive_username: dbResult.data?.hive_username || null,
      // Social connections
      x_handle: dbResult.data?.x_handle || null,
      instagram_handle: dbResult.data?.instagram_handle || null,
      soundcloud_url: dbResult.data?.soundcloud_url || null,
      spotify_url: dbResult.data?.spotify_url || null,
      audius_handle: dbResult.data?.audius_handle || null,
    };

    // Auto-import X handle from Farcaster verified_accounts if not already saved
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const verifiedAccounts = (neynarUser as any)?.verified_accounts as Array<{ platform: string; username: string }> | undefined;
    const xUsername = verifiedAccounts?.find((a) => a.platform === 'x')?.username;
    if (xUsername && !result.x_handle) {
      await supabaseAdmin
        .from('users')
        .update({ x_handle: xUsername })
        .eq('fid', fid);
      result.x_handle = xUsername;
    }

    return result;
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
