'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAuth } from '@/hooks/useAuth';
import { FollowerCard, type FollowerUser } from './FollowerCard';
import { FollowerSkeletonList } from './FollowerSkeleton';
import { CommunityGraph } from './CommunityGraph';
import { DiscoverPanel } from './DiscoverPanel';
import { NotificationBell } from '@/components/navigation/NotificationBell';

type View = 'followers' | 'following' | 'community' | 'discover';
type SortKey = 'recent' | 'relevant' | 'popular' | 'mutual' | 'zao';

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'relevant', label: 'Relevant' },
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
    fetch(`/api/search/users?q=${encodeURIComponent(user.username)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        const me = data.users?.find((u: { fid: number }) => u.fid === user.fid);
        if (me) {
          setTotalLabel(
            view === 'followers'
              ? `${me.follower_count?.toLocaleString() ?? '?'} followers`
              : `${me.following_count?.toLocaleString() ?? '?'} following`
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

    return result;
  }, [users, search, powerBadgeOnly, hideSpam]);

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
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-[#0d1b2a] flex-shrink-0">
          <a href="/chat" className="text-gray-400 hover:text-white transition-colors md:hidden" aria-label="Back to chat">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </a>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white">Social Graph</h1>
            {isListView && totalLabel && <p className="text-xs text-gray-500">{totalLabel}</p>}
          </div>
          <div className="md:hidden">
            <NotificationBell />
          </div>
        </header>

        {/* Main view tabs */}
        <div className="flex border-b border-gray-800 bg-[#0d1b2a]">
          {([
            { key: 'followers' as View, label: 'Followers' },
            { key: 'following' as View, label: 'Following' },
            { key: 'community' as View, label: 'Community' },
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

            {/* Filter toggles */}
            <div className="flex items-center gap-4 px-4 pb-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={powerBadgeOnly}
                  onChange={(e) => setPowerBadgeOnly(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-[#f5a623] focus:ring-[#f5a623]/50"
                />
                <span className="text-xs text-gray-400">Power badge</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideSpam}
                  onChange={(e) => setHideSpam(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-[#f5a623] focus:ring-[#f5a623]/50"
                />
                <span className="text-xs text-gray-400">Hide spam</span>
              </label>
              {filtered.length !== users.length && (
                <span className="text-xs text-gray-600 ml-auto">
                  {filtered.length} of {users.length}
                </span>
              )}
            </div>

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
