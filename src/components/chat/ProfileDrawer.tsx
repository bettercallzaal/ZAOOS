'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface ProfileData {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  powerBadge: boolean;
  verifiedAddresses: string[];
  viewerContext: { following: boolean; followed_by: boolean } | null;
  isZaoMember: boolean;
  zaoName: string | null;
  activity: {
    casts: number;
    likes: number;
    recasts: number;
    replies: number;
  };
}

interface ProfileDrawerProps {
  fid: number | null;
  onClose: () => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function ProfileDrawer({ fid, onClose }: ProfileDrawerProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!fid) {
      setProfile(null);
      return;
    }

    setLoading(true);
    fetch(`/api/users/${fid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProfile(data);
        setFollowing(data.viewerContext?.following ?? false);
      })
      .catch((err) => console.error('Profile fetch error:', err))
      .finally(() => setLoading(false));
  }, [fid]);

  const handleFollow = useCallback(async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    const prev = following;
    setFollowing(!prev);

    try {
      const res = await fetch('/api/users/follow', {
        method: prev ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFid: profile.fid }),
      });
      if (!res.ok) throw new Error('Follow action failed');
    } catch {
      setFollowing(prev);
    } finally {
      setFollowLoading(false);
    }
  }, [profile, following, followLoading]);

  if (!fid) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-[#0d1b2a] border-l border-gray-800 z-50 flex flex-col animate-slide-in-right overflow-y-auto">
        {/* Close button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
          <h3 className="text-sm font-medium text-gray-400">Profile</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center pt-12 px-6">
            <div className="w-20 h-20 rounded-full bg-white/5 animate-pulse" />
            <div className="mt-4 w-32 h-5 bg-white/5 rounded animate-pulse" />
            <div className="mt-2 w-24 h-4 bg-white/5 rounded animate-pulse" />
            <div className="mt-6 w-full h-16 bg-white/5 rounded animate-pulse" />
          </div>
        ) : profile ? (
          <div className="flex-1 flex flex-col">
            {/* Profile header */}
            <div className="flex flex-col items-center pt-8 pb-6 px-6">
              {/* PFP */}
              <div className="relative w-20 h-20">
                {profile.pfpUrl ? (
                  <Image
                    src={profile.pfpUrl}
                    alt={profile.displayName}
                    fill
                    className="rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-700" />
                )}
                {/* Power badge */}
                {profile.powerBadge && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center border-2 border-[#0d1b2a]">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13 1L3.4 14h5.6l-1 9 9.6-13h-5.6l1-9z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Name + badges */}
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-lg font-bold text-white">{profile.displayName}</h2>
                  {profile.isZaoMember && (
                    <span className="px-1.5 py-0.5 bg-[#f5a623]/15 text-[#f5a623] text-[10px] font-bold rounded-full uppercase tracking-wider">
                      ZAO
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">@{profile.username}</p>
                {profile.zaoName && profile.zaoName !== profile.displayName && (
                  <p className="text-xs text-gray-600 mt-1">{profile.zaoName}</p>
                )}
              </div>

              {/* Relationship badges */}
              {profile.viewerContext && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  {profile.viewerContext.following && profile.viewerContext.followed_by && (
                    <span className="px-2.5 py-0.5 bg-[#f5a623]/10 text-[#f5a623] text-xs rounded-full font-medium">
                      Mutuals
                    </span>
                  )}
                  {profile.viewerContext.followed_by && !profile.viewerContext.following && (
                    <span className="px-2.5 py-0.5 bg-white/5 text-gray-400 text-xs rounded-full">
                      Follows you
                    </span>
                  )}
                  {profile.viewerContext.following && !profile.viewerContext.followed_by && (
                    <span className="px-2.5 py-0.5 bg-white/5 text-gray-400 text-xs rounded-full">
                      You follow them
                    </span>
                  )}
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <p className="mt-4 text-sm text-gray-300 text-center leading-relaxed max-w-xs">
                  {profile.bio}
                </p>
              )}

              {/* Farcaster stats */}
              <div className="flex gap-6 mt-5">
                <div className="text-center">
                  <p className="text-base font-bold text-white">{formatCount(profile.followerCount)}</p>
                  <p className="text-xs text-gray-500">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-white">{formatCount(profile.followingCount)}</p>
                  <p className="text-xs text-gray-500">Following</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-white">{profile.fid}</p>
                  <p className="text-xs text-gray-500">FID</p>
                </div>
              </div>

              {/* Channel activity stats */}
              {profile.activity && profile.activity.casts > 0 && (
                <div className="mt-5 w-full max-w-xs">
                  <p className="text-xs text-gray-600 uppercase tracking-wider text-center mb-3">ZAO Channel Activity</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center px-2 py-2 rounded-lg bg-white/5">
                      <p className="text-sm font-bold text-white">{formatCount(profile.activity.casts)}</p>
                      <p className="text-[10px] text-gray-500">Casts</p>
                    </div>
                    <div className="text-center px-2 py-2 rounded-lg bg-white/5">
                      <p className="text-sm font-bold text-red-400">{formatCount(profile.activity.likes)}</p>
                      <p className="text-[10px] text-gray-500">Likes</p>
                    </div>
                    <div className="text-center px-2 py-2 rounded-lg bg-white/5">
                      <p className="text-sm font-bold text-green-400">{formatCount(profile.activity.recasts)}</p>
                      <p className="text-[10px] text-gray-500">Recasts</p>
                    </div>
                    <div className="text-center px-2 py-2 rounded-lg bg-white/5">
                      <p className="text-sm font-bold text-[#f5a623]">{formatCount(profile.activity.replies)}</p>
                      <p className="text-[10px] text-gray-500">Replies</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Follow button */}
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`mt-5 px-6 py-2 rounded-xl text-sm font-medium transition-colors ${
                  following
                    ? 'bg-white/10 text-white hover:bg-red-900/30 hover:text-red-400'
                    : 'bg-[#f5a623] text-black hover:bg-[#ffd700]'
                } disabled:opacity-50`}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-800 mx-4" />

            {/* Links section */}
            <div className="p-4 space-y-2">
              {/* Farcaster profile */}
              <a
                href={`https://warpcast.com/${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                View on Farcaster
              </a>

              {/* DM link */}
              <a
                href="/messages"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                Send Private Message
              </a>

              {/* Verified addresses */}
              {profile.verifiedAddresses.length > 0 && (
                <div className="px-3 pt-3">
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Verified Wallets</p>
                  {profile.verifiedAddresses.map((addr) => (
                    <p key={addr} className="text-xs text-gray-500 font-mono truncate mb-1">
                      {addr}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            User not found
          </div>
        )}
      </div>
    </>
  );
}
