'use client';

import dynamic from 'next/dynamic';
import type { SessionData } from '@/types';

const SettingsClient = dynamic(
  () => import('./SettingsClient').then(m => ({ default: m.SettingsClient })),
  { ssr: false }
);

interface Profile {
  fid: number;
  zid: number | null;
  fc_display_name: string | null;
  username: string | null;
  pfp_url: string | null;
  fc_bio: string | null;
  follower_count: number;
  following_count: number;
  power_badge: boolean;
  zao_display_name: string;
  zao_bio: string;
  ign: string;
  real_name: string;
  primary_wallet: string;
  respect_wallet: string | null;
  role: string;
  custody_address: string | null;
  verified_addresses: string[];
  created_at: string | null;
  bluesky_handle: string | null;
  lens_profile_id: string | null;
  lens_has_token: boolean;
  hive_username: string | null;
  solana_wallet: string | null;
  x_handle: string | null;
  instagram_handle: string | null;
  soundcloud_url: string | null;
  spotify_url: string | null;
  audius_handle: string | null;
}

interface Props {
  session: SessionData | null;
  profile: Profile | null;
}

export function SettingsClientLoader({ session, profile }: Props) {
  return <SettingsClient session={session} profile={profile} />;
}
