'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

export default function ToolsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((session) => {
        if (session.fid) {
          return fetch(`/api/users/${session.fid}`).then((r) => r.json());
        }
        return null;
      })
      .then((data) => {
        if (data) {
          setProfile({
            zid: data.zid || data.user?.zid || null,
            display_name: data.display_name || data.user?.display_name || null,
            username: data.username || data.user?.username || null,
            fid: data.fid || null,
            pfp_url: data.pfp_url || data.user?.pfp_url || null,
            bio: data.bio || data.user?.bio || null,
            primary_wallet: data.user?.primary_wallet || '',
            respect_wallet: data.user?.respect_wallet || null,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <h2 className="font-semibold text-sm text-gray-300">Tools</h2>
        <Link href="/chat" className="text-xs text-gray-500 hover:text-white">Back to Chat</Link>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* ZID Profile Card */}
        {loading ? (
          <div className="bg-[#0d1b2a] rounded-xl p-6 border border-gray-800 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-800" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-800 rounded w-32" />
                <div className="h-3 bg-gray-800 rounded w-20" />
              </div>
            </div>
          </div>
        ) : profile ? (
          <div className="bg-gradient-to-r from-[#0d1b2a] to-[#f5a623]/5 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-4">
              {profile.pfp_url ? (
                <img src={profile.pfp_url} alt="" className="w-16 h-16 rounded-full" />
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
              <span className="font-mono">{profile.primary_wallet.slice(0, 6)}...{profile.primary_wallet.slice(-4)}</span>
            </div>
          </div>
        ) : (
          <div className="bg-[#0d1b2a] rounded-xl p-6 border border-gray-800 text-center">
            <p className="text-sm text-gray-400">Log in to see your profile</p>
          </div>
        )}

        {/* Tool sections */}
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Artist Tools</p>

          <Link
            href="/social"
            className="block bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 hover:border-[#f5a623]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">Social Graph</p>
                <p className="text-xs text-gray-500">Followers & Following</p>
              </div>
            </div>
          </Link>

          <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 opacity-60">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">Cross-Post</p>
                <p className="text-xs text-gray-500">Coming soon</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 opacity-60">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">AI Agent</p>
                <p className="text-xs text-gray-500">Coming soon</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 opacity-60">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">Taste Profile</p>
                <p className="text-xs text-gray-500">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
