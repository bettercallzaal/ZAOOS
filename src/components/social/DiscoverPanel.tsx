'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Suggestion {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string | null;
  followerCount: number;
  powerBadge: boolean;
  isZaoMember: boolean;
  followsYou: boolean;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function DiscoverPanel({ hasSigner }: { hasSigner: boolean }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [unfollowedMembers, setUnfollowedMembers] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followingSet, setFollowingSet] = useState(new Set<number>());
  const [loadingFollow, setLoadingFollow] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/social/suggestions')
      .then((r) => {
        if (!r.ok) throw new Error('Failed');
        return r.json();
      })
      .then((data) => {
        setSuggestions(data.suggestions || []);
        setUnfollowedMembers(data.unfollowedMembers || []);
      })
      .catch(() => setError('Failed to load suggestions'))
      .finally(() => setLoading(false));
  }, []);

  const handleFollow = async (fid: number) => {
    if (!hasSigner || loadingFollow) return;
    setLoadingFollow(fid);
    try {
      const res = await fetch('/api/users/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFid: fid }),
      });
      if (res.ok) {
        setFollowingSet((prev) => new Set([...prev, fid]));
      }
    } catch {
      // silent
    }
    setLoadingFollow(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 mt-3">Finding people to follow...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  const renderCard = (user: Suggestion) => {
    const isFollowed = followingSet.has(user.fid);
    return (
      <div
        key={user.fid}
        className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
      >
        {user.pfpUrl ? (
          <div className="w-10 h-10 flex-shrink-0 relative">
            <Image src={user.pfpUrl} alt="" fill className="rounded-full object-cover" unoptimized />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white truncate">{user.displayName}</span>
            {user.powerBadge && (
              <svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
              </svg>
            )}
            {user.isZaoMember && (
              <span className="text-[10px] font-bold bg-[#f5a623]/20 text-[#f5a623] px-1.5 py-0.5 rounded-full flex-shrink-0">
                ZAO
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">@{user.username}</span>
            {user.followsYou && (
              <span className="text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">Follows you</span>
            )}
          </div>
          {user.bio && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{user.bio}</p>
          )}
          <span className="text-[11px] text-gray-600">{formatCount(user.followerCount)} followers</span>
        </div>
        {hasSigner && (
          <button
            onClick={() => handleFollow(user.fid)}
            disabled={isFollowed || loadingFollow === user.fid}
            className={`flex-shrink-0 px-4 py-1.5 text-xs font-medium rounded-lg transition-colors mt-1 ${
              isFollowed
                ? 'bg-gray-800 text-gray-500 cursor-default'
                : 'bg-[#f5a623] text-black hover:bg-[#ffd700]'
            } disabled:opacity-50`}
          >
            {loadingFollow === user.fid ? '...' : isFollowed ? 'Followed' : 'Follow'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="pb-4">
      {/* Unfollowed ZAO Members */}
      {unfollowedMembers.length > 0 && (
        <div>
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs text-[#f5a623] uppercase tracking-wider font-medium">
              ZAO Members You Don&apos;t Follow
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              Connect with other community members
            </p>
          </div>
          {unfollowedMembers.map(renderCard)}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              Suggested For You
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              People you might want to follow on Farcaster
            </p>
          </div>
          {suggestions.map(renderCard)}
        </div>
      )}

      {suggestions.length === 0 && unfollowedMembers.length === 0 && (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-gray-400">No suggestions right now</p>
          <p className="text-xs text-gray-600 mt-1">You&apos;re well connected!</p>
        </div>
      )}
    </div>
  );
}
