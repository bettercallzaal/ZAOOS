'use client';

import Image from 'next/image';

interface UserProfile {
  zid: number | null;
  display_name: string | null;
  username: string | null;
  fid: number | null;
  pfp_url: string | null;
  bio: string | null;
  primary_wallet: string;
  respect_wallet: string | null;
}

export function ProfileCard({ profile }: { profile: UserProfile }) {
  return (
    <div className="bg-gradient-to-r from-[#0d1b2a] to-[#f5a623]/5 rounded-xl p-6 border border-white/[0.08]">
      <div className="flex items-center gap-4">
        {profile.pfp_url ? (
          <Image src={profile.pfp_url} alt={`${profile.display_name || 'User'} avatar`} width={64} height={64} className="rounded-full" unoptimized />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-xl text-gray-400 font-bold">
            {profile.display_name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-white truncate">{profile.display_name}</p>
            {profile.zid && (
              <span className="text-xs font-bold text-[#f5a623] bg-[#f5a623]/10 px-2 py-0.5 rounded-full flex-shrink-0">
                ZID #{profile.zid}
              </span>
            )}
          </div>
          {profile.username && (
            <p className="text-sm text-gray-400">@{profile.username}</p>
          )}
          {!profile.zid && (
            <p className="text-xs text-gray-600 mt-1">Earn Respect to get your ZID</p>
          )}
        </div>
      </div>
      {profile.bio && (
        <p className="text-sm text-gray-400 mt-4 italic">&ldquo;{profile.bio}&rdquo;</p>
      )}
      <div className="mt-4 flex items-center gap-3 text-xs text-gray-600">
        {profile.fid && <span>FID {profile.fid}</span>}
        {profile.primary_wallet && (
          <span className="font-mono">{profile.primary_wallet.slice(0, 6)}...{profile.primary_wallet.slice(-4)}</span>
        )}
      </div>
    </div>
  );
}
