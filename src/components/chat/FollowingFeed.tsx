'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Cast, QuotedCastData } from '@/types';
import { Message } from './Message';

interface FollowingFeedProps {
  isAdmin: boolean;
  currentFid: number;
  hasSigner: boolean;
  onHide: (hash: string) => void;
  onOpenThread?: (hash: string) => void;
  onQuote?: (cast: QuotedCastData) => void;
  onOpenProfile?: (fid: number) => void;
  onReply?: (hash: string, authorName: string, text: string) => void;
}

interface FollowingPage {
  casts: Cast[];
  nextCursor: string | null;
}

async function fetchPage(cursor: string | null): Promise<FollowingPage> {
  const params = new URLSearchParams({ limit: '25' });
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`/api/chat/following?${params}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Home feed: casts from the accounts the member follows on Farcaster. */
export function FollowingFeed({
  isAdmin,
  currentFid,
  hasSigner,
  onHide,
  onOpenThread,
  onQuote,
  onOpenProfile,
  onReply,
}: FollowingFeedProps) {
  const [casts, setCasts] = useState<Cast[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchPage(null);
      setCasts(page.casts);
      setNextCursor(page.nextCursor);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load your feed');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(nextCursor);
      setCasts((prev) => {
        const seen = new Set(prev.map((c) => c.hash));
        return [...prev, ...page.casts.filter((c) => !seen.has(c.hash))];
      });
      setNextCursor(page.nextCursor);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" aria-busy="true">
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && casts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-white font-semibold text-base mb-1">Could not load your feed</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 rounded-lg bg-[#f5a623]/10 text-[#f5a623] text-sm font-medium hover:bg-[#f5a623]/20 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (casts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-white font-semibold text-base mb-1">Your feed is empty</p>
          <p className="text-sm text-gray-500">
            Follow people on Farcaster and their casts show up here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
        <span className="text-[#f5a623] text-sm font-medium">Following</span>
        <button
          type="button"
          onClick={load}
          className="text-xs text-gray-500 hover:text-[#f5a623] transition-colors"
        >
          Refresh
        </button>
      </div>
      <div className="py-2">
        {casts.map((cast) => (
          <Message
            key={cast.hash}
            cast={cast}
            isAdmin={isAdmin}
            currentFid={currentFid}
            hasSigner={hasSigner}
            onHide={onHide}
            onOpenThread={onOpenThread}
            onQuote={onQuote}
            onOpenProfile={onOpenProfile}
            onReply={onReply}
          />
        ))}
      </div>
      {nextCursor && (
        <div className="flex justify-center py-4">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
