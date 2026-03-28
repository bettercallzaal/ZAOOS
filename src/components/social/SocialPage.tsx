'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAuth } from '@/hooks/useAuth';
import { FollowerCard, type FollowerUser } from './FollowerCard';
import { FollowerSkeletonList } from './FollowerSkeleton';
import dynamic from 'next/dynamic';
const CommunityGraph = dynamic(() => import('./CommunityGraph').then(m => m.CommunityGraph), { ssr: false });
const DiscoverPanel = dynamic(() => import('./DiscoverPanel').then(m => m.DiscoverPanel), { ssr: false });
const SocialAnalytics = dynamic(() => import('./SocialAnalytics').then(m => m.SocialAnalytics), { ssr: false });
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { PageHeader } from '@/components/navigation/PageHeader';
import { MiniSpaceBanner } from './MiniSpaceBanner';

type View = 'followers' | 'following' | 'community' | 'discover' | 'analytics';
type SortKey = 'recent' | 'relevant' | 'popular' | 'mutual' | 'zao' | 'trending';

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'relevant', label: 'Relevant' },
  { key: 'trending', label: 'Trending' },
  { key: 'popular', label: 'Popular' },
  { key: 'mutual', label: 'Mutual' },
  { key: 'zao', label: 'ZAO' },
];

export function SocialPage() {
  const { user } = useAuth();
  const [view, setView] = useState<View>('followers');
  const [sort, setSort] = useState<SortKey>('recent');
  const [search, setSearch] = useState('');
  const [powerBadgeOnly, setPowerBadgeOnly] = useState(false);
  const [hideSpam, setHideSpam] = useState(false);

  const [users, setUsers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [totalLabel, setTotalLabel] = useState('');
  const parentRef = useRef<HTMLDivElement>(null);

  // Advanced filters
  const [minFollowers, setMinFollowers] = useState(0);
  const [zaoOnly, setZaoOnly] = useState(false);
  const [mutualOnly, setMutualOnly] = useState(false);
  const [hasBio, setHasBio] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const isListView = view === 'followers' || view === 'following';

  const fetchAbortRef = useRef<AbortController | null>(null);

  const fetchUsers = useCallback(async (fid: number, type: 'followers' | 'following', sortKey: SortKey, nextCursor?: string) => {
    const isMore = !!nextCursor;
    if (isMore) setLoadingMore(true);
    else setLoading(true);

    // Abort previous non-pagination request
    if (!isMore) {
      fetchAbortRef.current?.abort();
    }
    const controller = new AbortController();
    if (!isMore) fetchAbortRef.current = controller;

    try {
      const url = `/api/users/${fid}/${type}?sort=${sortKey}${nextCursor ? `&cursor=${nextCursor}` : ''}`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();

      if (controller.signal.aborted) return;

      if (isMore) {
        setUsers((prev) => [...prev, ...data.users]);
      } else {
        setUsers(data.users);
      }
      setCursor(data.next?.cursor || null);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error('Failed to fetch:', err);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  // Fetch when tab/sort changes
  useEffect(() => {
    if (!user || !isListView) return;
    setCursor(null);
    fetchUsers(user.fid, view as 'followers' | 'following', sort);
    return () => {
      fetchAbortRef.current?.abort();
    };
  }, [user, view, sort, fetchUsers, isListView]);

  // Set total label from user profile
  useEffect(() => {
    if (!user || !isListView) return;
    const controller = new AbortController();
    fetch(`/api/users/${user.fid}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        const u = data.user || data;
        if (u) {
          setTotalLabel(
            view === 'followers'
              ? `${(u.follower_count ?? 0).toLocaleString()} followers`
              : `${(u.following_count ?? 0).toLocaleString()} following`
          );
        }
      })
      .catch(() => {});
    return () => { controller.abort(); };
  }, [user, view, isListView]);

  // Apply client-side filters
  const filtered = useMemo(() => {
    let result = users;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.username?.toLowerCase().includes(q) ||
          u.display_name?.toLowerCase().includes(q)
      );
    }

    if (powerBadgeOnly) {
      result = result.filter((u) => u.power_badge);
    }

    if (hideSpam) {
      result = result.filter(
        (u) => (u.experimental?.neynar_user_score ?? 1) >= 0.55
      );
    }

    if (minFollowers > 0) {
      result = result.filter((u) => u.follower_count >= minFollowers);
    }

    if (zaoOnly) {
      result = result.filter((u) => u.isZaoMember);
    }

    if (mutualOnly) {
      result = result.filter((u) => u.viewer_context?.following && u.viewer_context?.followed_by);
    }

    if (hasBio) {
      result = result.filter((u) => u.profile?.bio?.text && u.profile.bio.text.trim().length > 0);
    }

    return result;
  }, [users, search, powerBadgeOnly, hideSpam, minFollowers, zaoOnly, mutualOnly, hasBio]);

  const activeFilterCount = [powerBadgeOnly, hideSpam, minFollowers > 0, zaoOnly, mutualOnly, hasBio].filter(Boolean).length;

  // Virtual scrolling
  const virtualizer = useVirtualizer({
    count: filtered.length + (cursor ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  // Infinite scroll
  const lastItem = virtualizer.getVirtualItems().at(-1);
  useEffect(() => {
    if (!lastItem || !cursor || loadingMore || !user || !isListView) return;
    if (lastItem.index >= filtered.length - 5) {
      fetchUsers(user.fid, view as 'followers' | 'following', sort, cursor);
    }
  }, [lastItem, cursor, loadingMore, user, view, sort, filtered.length, fetchUsers, isListView]);

  if (!user) return null;

  const hasSigner = !!user.signerUuid;

  return (
    <div className="flex h-[100dvh] pb-14 md:pb-0 md:h-[calc(100dvh-2.5rem)] bg-[#0a1628] text-white overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 max-w-2xl mx-auto w-full">
        {/* Header */}
        <PageHeader
          title="Social Graph"
          subtitle={isListView && totalLabel ? totalLabel : 'Your Farcaster network'}
          rightAction={<div className="md:hidden"><NotificationBell /></div>}
        />

        {/* Live room banner — only renders when a room is active */}
        <MiniSpaceBanner />

        {/* Main view tabs */}
        <div className="flex border-b border-gray-800 bg-[#0d1b2a]">
          {([
            { key: 'followers' as View, label: 'Followers' },
            { key: 'following' as View, label: 'Following' },
            { key: 'community' as View, label: 'Community' },
            { key: 'analytics' as View, label: 'Analytics' },
            { key: 'discover' as View, label: 'Discover' },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                view === t.key
                  ? 'text-[#f5a623] border-b-2 border-[#f5a623]'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Community Graph View */}
        {view === 'community' && (
          <div className="flex-1 overflow-y-auto">
            <CommunityGraph />
          </div>
        )}

        {/* Analytics View */}
        {view === 'analytics' && (
          <div className="flex-1 overflow-y-auto">
            <SocialAnalytics currentFid={user.fid} />
          </div>
        )}

        {/* Discover View */}
        {view === 'discover' && (
          <div className="flex-1 overflow-y-auto">
            <DiscoverPanel hasSigner={hasSigner} />
          </div>
        )}

        {/* Followers/Following List View */}
        {isListView && (
          <>
            {/* Search */}
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg pl-9 pr-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]/50"
                />
              </div>
            </div>

            {/* Sort tabs */}
            <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
              {SORT_TABS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                    sort === s.key
                      ? 'bg-[#f5a623]/10 text-[#f5a623] font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-2 px-4 pb-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'border-[#f5a623]/50 text-[#f5a623] bg-[#f5a623]/5'
                    : 'border-gray-700/50 text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#f5a623] text-[#0a1628] text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>
              {/* Quick toggles */}
              {[
                { label: 'ZAO', active: zaoOnly, toggle: () => setZaoOnly(!zaoOnly) },
                { label: 'Mutual', active: mutualOnly, toggle: () => setMutualOnly(!mutualOnly) },
                { label: 'No spam', active: hideSpam, toggle: () => setHideSpam(!hideSpam) },
              ].map((t) => (
                <button
                  key={t.label}
                  onClick={t.toggle}
                  className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${
                    t.active
                      ? 'bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/40'
                      : 'text-gray-500 border-gray-700/50 hover:text-white hover:border-gray-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
              {filtered.length !== users.length && (
                <span className="text-[10px] text-gray-600 ml-auto">
                  {filtered.length}/{users.length}
                </span>
              )}
            </div>

            {/* Expanded filter panel */}
            {showFilters && (
              <div className="mx-4 mb-2 p-3 bg-[#0d1b2a] rounded-xl border border-gray-800 space-y-3">
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={powerBadgeOnly} onChange={(e) => setPowerBadgeOnly(e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-[#f5a623] focus:ring-[#f5a623]/50" />
                    <span className="text-xs text-gray-400">Power badge only</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={hasBio} onChange={(e) => setHasBio(e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-[#f5a623] focus:ring-[#f5a623]/50" />
                    <span className="text-xs text-gray-400">Has bio</span>
                  </label>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Min followers</label>
                  <div className="flex gap-1.5">
                    {[0, 10, 100, 1000, 10000].map((n) => (
                      <button
                        key={n}
                        onClick={() => setMinFollowers(n)}
                        className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${
                          minFollowers === n
                            ? 'bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/40'
                            : 'text-gray-500 border-gray-700/50 hover:text-white'
                        }`}
                      >
                        {n === 0 ? 'Any' : n >= 1000 ? `${n / 1000}K+` : `${n}+`}
                      </button>
                    ))}
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setPowerBadgeOnly(false); setHideSpam(false); setMinFollowers(0); setZaoOnly(false); setMutualOnly(false); setHasBio(false); }}
                    className="text-[11px] text-red-400 hover:text-red-300"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* User list with virtual scrolling */}
            <div ref={parentRef} className="flex-1 overflow-y-auto">
              {loading ? (
                <FollowerSkeletonList count={8} />
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <p className="text-sm text-gray-400">
                    {search ? 'No users match your search' : 'No users found'}
                  </p>
                </div>
              ) : (
                <div
                  style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const u = filtered[virtualRow.index];
                    if (!u) {
                      return (
                        <div
                          key="sentinel"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          {loadingMore && (
                            <div className="flex justify-center py-4">
                              <div className="w-5 h-5 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={u.fid}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <FollowerCard
                          user={u}
                          hasSigner={hasSigner}
                          currentFid={user.fid}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
