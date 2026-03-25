'use client';

import { useState, useEffect, useCallback } from 'react';

interface LikeButtonProps {
  songUrl: string;
  compact?: boolean;
  className?: string;
}

export function LikeButton({ songUrl, compact = false, className = '' }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch initial like status
  useEffect(() => {
    if (!songUrl) return;
    let cancelled = false;

    fetch(`/api/music/library/like?url=${encodeURIComponent(songUrl)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setLiked(data.liked);
          setLikeCount(data.likeCount);
        }
      })
      .catch(() => {
        // Silent — non-critical
      });

    return () => {
      cancelled = true;
    };
  }, [songUrl]);

  const handleToggle = useCallback(async () => {
    if (loading || !songUrl) return;

    // Optimistic update
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? Math.max(0, likeCount - 1) : likeCount + 1);
    setLoading(true);

    try {
      const res = await fetch('/api/music/library/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: songUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.likeCount);
      } else {
        // Revert on error
        setLiked(prevLiked);
        setLikeCount(prevCount);
      }
    } catch {
      // Revert on error
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLoading(false);
    }
  }, [liked, likeCount, loading, songUrl]);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleToggle();
      }}
      disabled={loading}
      className={`inline-flex items-center gap-1 transition-colors disabled:opacity-60 ${
        compact ? 'p-1.5' : 'p-2'
      } ${
        liked
          ? 'text-[#f5a623] hover:text-[#ffd700]'
          : 'text-gray-500 hover:text-gray-300'
      } ${className}`}
      aria-label={liked ? 'Unlike song' : 'Like song'}
      title={liked ? 'Unlike' : 'Like'}
    >
      {/* Heart icon */}
      <svg
        className={compact ? 'w-4 h-4' : 'w-5 h-5'}
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={liked ? 0 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>

      {/* Like count — hidden in compact mode */}
      {!compact && likeCount > 0 && (
        <span className="text-xs tabular-nums">{likeCount}</span>
      )}
    </button>
  );
}
