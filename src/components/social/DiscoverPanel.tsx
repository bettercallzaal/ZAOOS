'use client';

import { useState, useEffect, useCallback } from 'react';
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

type DiscoverTab = 'for-you' | 'zao' | 'search';

export function DiscoverPanel({ hasSigner }: { hasSigner: boolean }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [unfollowedMembers, setUnfollowedMembers] = useState<Suggestion[]>([]);
  const [searchResults, setSearchResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [followingSet, setFollowingSet] = useState(new Set<number>());
  const [loadingFollow, setLoadingFollow] = useState<number | null>(null);
  const [tab, setTab] = useState<DiscoverTab>('for-you');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/social/suggestions', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Failed');
        return r.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setSuggestions(data.suggestions || []);
          setUnfollowedMembers(data.unfollowedMembers || []);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError('Failed to load suggestions');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); };
  }, []);

  // Search Farcaster users
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search/users?q=${encodeURIComponent(query)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults((data.users || []).map((u: Record<string, unknown>) => ({
          fid: u.fid as number,
          username: u.username as string,
          displayName: (u.display_name as string) || '',
          pfpUrl: (u.pfp_url as string) || '',
          bio: (u.profile as { bio?: { text?: string } })?.bio?.text || null,
          followerCount: (u.follower_count as number) || 0,
          powerBadge: (u.power_badge as boolean) || false,
          isZaoMember: false,
          followsYou: (u.viewer_context as { followed_by?: boolean })?.followed_by || false,
        })));
      }
    } catch {
      // ignore
    }
    setSearchLoading(false);
  }, []);

  // Debounced search
  useEffect(() => {
    if (tab !== 'search') return;
    const timer = setTimeout(() => searchUsers(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, tab, searchUsers]);

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
    } catch (err) {
      console.error('[DiscoverPanel] follow failed:', err);
    }
    setLoadingFollow(null);
  };

  const renderCard = (user: Suggestion, compact = false) => {
    const isFollowed = followingSet.has(user.fid);
    return (
      <div
        key={user.fid}
        className={`flex items-start gap-3 px-4 ${compact ? 'py-2.5' : 'py-3'} hover:bg-white/[0.03] transition-colors`}
      >
        {user.pfpUrl ? (
          <div className={`${compact ? 'w-9 h-9' : 'w-10 h-10'} flex-shrink-0 relative`}>
            <Image src={user.pfpUrl} alt="" fill className="rounded-full object-cover" unoptimized />
          </div>
        ) : (
          <div className={`${compact ? 'w-9 h-9' : 'w-10 h-10'} rounded-full bg-gray-700 flex-shrink-0`} />
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
              <span className="text-[10px] font-bold bg-[#f5a623]/20 text-[#f5a623] px-1.5 py-0.5 rounded-full flex-shrink-0">ZAO</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">@{user.username}</span>
            {user.followsYou && (
              <span className="text-[10px] text-green-400/70 bg-green-400/10 px-1.5 py-0.5 rounded">Follows you</span>
            )}
            <span className="text-[10px] text-gray-600">{formatCount(user.followerCount)}</span>
          </div>
          {!compact && user.bio && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{user.bio}</p>
          )}
        </div>
        {hasSigner && (
          <button
            onClick={() => handleFollow(user.fid)}
            disabled={isFollowed || loadingFollow === user.fid}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isFollowed
                ? 'bg-gray-800 text-gray-500 cursor-default'
                : 'bg-[#f5a623] text-black hover:bg-[#ffd700]'
            } disabled:opacity-50`}
          >
            {loadingFollow === user.fid ? '...' : isFollowed ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
    );
  };

  const TABS: { key: DiscoverTab; label: string; icon: string }[] = [
    { key: 'for-you', label: 'For You', icon: '✨' },
    { key: 'zao', label: 'ZAO Members', icon: '🎵' },
    { key: 'search', label: 'Search', icon: '🔍' },
  ];

  return (
    <div className="pb-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
              tab === t.key
                ? 'bg-[#f5a623]/10 text-[#f5a623] font-medium'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search tab */}
      {tab === 'search' && (
        <div className="px-4 pt-2 pb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Farcaster users by name or username..."
              autoFocus
              className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg pl-9 pr-3 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]/50"
            />
          </div>
          {searchLoading && (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!searchLoading && searchQuery && searchResults.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-6">No users found for &ldquo;{searchQuery}&rdquo;</p>
          )}
          {!searchLoading && searchResults.map((u) => renderCard(u))}
          {!searchQuery && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">Find anyone on Farcaster</p>
              <p className="text-xs text-gray-600 mt-1">Search by name, username, or ENS</p>
            </div>
          )}
        </div>
      )}

      {/* For You tab */}
      {tab === 'for-you' && (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-500 mt-3">Finding people for you...</p>
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : (
            <>
              {/* Quick follow: unfollowed ZAO members as horizontal scroll */}
              {unfollowedMembers.length > 0 && (
                <div className="px-4 pt-3 pb-2">
                  <p className="text-[11px] text-[#f5a623] uppercase tracking-wider font-medium mb-2">ZAO Members to Follow</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {unfollowedMembers.slice(0, 10).map((u) => {
                      const isFollowed = followingSet.has(u.fid);
                      return (
                        <div key={u.fid} className="flex flex-col items-center gap-1.5 min-w-[72px]">
                          <div className="w-12 h-12 relative">
                            {u.pfpUrl ? (
                              <Image src={u.pfpUrl} alt="" fill className="rounded-full object-cover" unoptimized />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-700" />
                            )}
                          </div>
                          <span className="text-[10px] text-gray-300 text-center truncate w-full">{u.displayName?.split(' ')[0]}</span>
                          <button
                            onClick={() => handleFollow(u.fid)}
                            disabled={isFollowed || loadingFollow === u.fid}
                            className={`px-2.5 py-0.5 text-[10px] font-medium rounded-full transition-colors ${
                              isFollowed
                                ? 'bg-gray-800 text-gray-500'
                                : 'bg-[#f5a623]/15 text-[#f5a623] hover:bg-[#f5a623]/25'
                            }`}
                          >
                            {isFollowed ? '✓' : 'Follow'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggestions list */}
              {suggestions.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Suggested For You</p>
                  </div>
                  {suggestions.map((u) => renderCard(u))}
                </div>
              )}

              {suggestions.length === 0 && unfollowedMembers.length === 0 && (
                <div className="px-4 py-16 text-center">
                  <p className="text-sm text-gray-400">No suggestions right now</p>
                  <p className="text-xs text-gray-600 mt-1">You&apos;re well connected!</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ZAO Members tab */}
      {tab === 'zao' && (
        <>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : unfollowedMembers.length > 0 ? (
            <div>
              <div className="px-4 pt-3 pb-1">
                <p className="text-[11px] text-[#f5a623] uppercase tracking-wider font-medium">
                  {unfollowedMembers.length} members you don&apos;t follow yet
                </p>
              </div>
              {unfollowedMembers.map((u) => renderCard(u))}
            </div>
          ) : (
            <div className="px-4 py-16 text-center">
              <p className="text-sm text-[#f5a623]">You follow all ZAO members!</p>
              <p className="text-xs text-gray-600 mt-1">Check back as new members join</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
