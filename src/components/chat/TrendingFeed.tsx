'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Cast, QuotedCastData } from '@/types';
import { Message } from './Message';

interface SophaCast extends Cast {
  _qualityScore?: number;
  _category?: string;
  _title?: string;
  _summary?: string;
  _curatorInfo?: { fid: number; username: string; display_name: string; pfp_url: string };
}

interface TrendingFeedProps {
  isAdmin: boolean;
  currentFid: number;
  hasSigner: boolean;
  onHide: (hash: string) => void;
  onOpenThread?: (hash: string) => void;
  onQuote?: (cast: QuotedCastData) => void;
  onOpenProfile?: (fid: number) => void;
  onReply?: (hash: string, authorName: string, text: string) => void;
}

function SkeletonCard() {
  return (
    <div className="flex gap-3 px-4 py-3 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-gray-700/50 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-24 bg-gray-700/50 rounded" />
          <div className="h-3 w-12 bg-gray-800/50 rounded" />
        </div>
        <div className="h-3 w-full bg-gray-700/30 rounded" />
        <div className="h-3 w-3/4 bg-gray-700/30 rounded" />
        <div className="flex gap-4 mt-2">
          <div className="h-3 w-10 bg-gray-800/40 rounded" />
          <div className="h-3 w-10 bg-gray-800/40 rounded" />
          <div className="h-3 w-10 bg-gray-800/40 rounded" />
        </div>
      </div>
    </div>
  );
}

export function TrendingFeed({
  isAdmin,
  currentFid,
  hasSigner,
  onHide,
  onOpenThread,
  onQuote,
  onOpenProfile,
  onReply,
}: TrendingFeedProps) {
  const [casts, setCasts] = useState<SophaCast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh state
  const touchStartY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const PULL_THRESHOLD = 60;

  const fetchTrending = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/chat/trending?limit=25&time_window=24h');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setCasts(data.casts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setPullDistance(0);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartY.current) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 100));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      fetchTrending(true);
    } else {
      setPullDistance(0);
    }
    touchStartY.current = 0;
  }, [pullDistance, refreshing, fetchTrending]);

  if (loading) {
    return (
      <div className="flex-1 overflow-hidden">
        {/* Header accent */}
        <div className="px-4 py-3 bg-gradient-to-r from-amber-500/5 to-transparent border-b border-amber-500/10">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm">Trending on Farcaster</span>
          </div>
        </div>
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
          </div>
          <p className="text-white font-semibold text-base mb-1">Failed to load trending</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => fetchTrending()}
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
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#f5a623]/10 flex items-center justify-center">
            <span className="text-2xl">🔥</span>
          </div>
          <p className="text-white font-semibold text-base mb-1">Nothing trending right now</p>
          <p className="text-sm text-gray-500">Check back in a bit for popular casts</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center transition-all"
          style={{ height: `${pullDistance}px` }}
        >
          <div
            className={`w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full ${
              pullDistance >= PULL_THRESHOLD ? 'animate-spin' : ''
            }`}
            style={{
              transform: `rotate(${pullDistance * 3}deg)`,
              opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
            }}
          />
        </div>
      )}

      {/* Refreshing indicator */}
      {refreshing && (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Header accent bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-500/5 to-transparent border-b border-amber-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-sm font-medium">Curated by Sopha</span>
          <span className="text-xs text-gray-600">Deep Social on Farcaster</span>
        </div>
        <button
          onClick={() => fetchTrending(true)}
          disabled={refreshing}
          className="text-xs text-gray-500 hover:text-[#f5a623] transition-colors disabled:opacity-50"
          aria-label="Refresh trending"
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.016 4.356v4.992" />
          </svg>
        </button>
      </div>

      {/* Trending casts */}
      <div className="py-2">
        {casts.map((cast, index) => (
          <div key={cast.hash} className="relative">
            {/* Rank badge */}
            <div className="absolute left-1.5 top-3.5 z-10">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold">
                {index + 1}
              </span>
            </div>
            {/* Sopha curation metadata */}
            {(cast._title || cast._category || cast._qualityScore) && (
              <div className="ml-8 mr-4 mt-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                {cast._title && (
                  <p className="text-xs font-medium text-amber-300">{cast._title}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {cast._category && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/80">{cast._category}</span>
                  )}
                  {cast._qualityScore && (
                    <span className="text-[10px] text-gray-500">Quality: {cast._qualityScore}/100</span>
                  )}
                  {cast._curatorInfo && (
                    <span className="text-[10px] text-gray-600">Curated by @{cast._curatorInfo.username}</span>
                  )}
                </div>
                {cast._summary && (
                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{cast._summary}</p>
                )}
              </div>
            )}
            {/* Engagement highlight bar */}
            <div className="border-l-2 border-amber-500/20 ml-1">
              <Message
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
            </div>
          </div>
        ))}
      </div>

      {/* Sopha attribution */}
      <div className="px-4 py-4 border-t border-gray-800/50">
        <a
          href="https://sopha.social"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <span>Powered by Sopha</span>
          <span>🧠</span>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </div>
  );
}
