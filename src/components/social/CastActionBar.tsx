'use client';

import { useState } from 'react';
import { likeCast, recastCast } from '@/lib/farcaster/neynarActions';

interface CastActionBarProps {
  castHash: string;
  /** Initial counts shown in the UI */
  initialLikes?: number;
  initialRecasts?: number;
  /** Whether the viewing user has already reacted */
  viewerLiked?: boolean;
  viewerRecasted?: boolean;
  /** Whether the current user has a signer (can post reactions) */
  hasSigner: boolean;
  /** Optional className for the wrapper */
  className?: string;
}

/**
 * Reusable like + recast action bar for any Farcaster cast.
 * Uses neynarActions (→ /api/neynar/like and /api/neynar/recast).
 */
export function CastActionBar({
  castHash,
  initialLikes = 0,
  initialRecasts = 0,
  viewerLiked = false,
  viewerRecasted = false,
  hasSigner,
  className,
}: CastActionBarProps) {
  const [liked, setLiked] = useState(viewerLiked);
  const [recasted, setRecasted] = useState(viewerRecasted);
  const [likes, setLikes] = useState(initialLikes);
  const [recasts, setRecasts] = useState(initialRecasts);
  const [likeLoading, setLikeLoading] = useState(false);
  const [recastLoading, setRecastLoading] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasSigner || likeLoading) return;

    const prev = liked;
    // Optimistic update
    setLiked(!prev);
    setLikes((n) => (prev ? Math.max(0, n - 1) : n + 1));
    setLikeLoading(true);

    try {
      await likeCast(castHash);
    } catch (err) {
      // Revert on failure
      console.error('[CastActionBar] like failed:', err);
      setLiked(prev);
      setLikes((n) => (prev ? n + 1 : Math.max(0, n - 1)));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleRecast = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasSigner || recastLoading || recasted) return; // recasts are one-way on Farcaster

    setRecasted(true);
    setRecasts((n) => n + 1);
    setRecastLoading(true);

    try {
      await recastCast(castHash);
    } catch (err) {
      console.error('[CastActionBar] recast failed:', err);
      setRecasted(false);
      setRecasts((n) => Math.max(0, n - 1));
    } finally {
      setRecastLoading(false);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className || ''}`}>
      {/* Like */}
      <button
        onClick={handleLike}
        disabled={!hasSigner || likeLoading}
        title={hasSigner ? (liked ? 'Unlike' : 'Like') : 'Connect signer to like'}
        className={`flex items-center gap-1 text-[11px] transition-colors disabled:opacity-40 ${
          liked
            ? 'text-red-400 hover:text-red-300'
            : 'text-gray-500 hover:text-red-400'
        }`}
        aria-label={liked ? 'Unlike cast' : 'Like cast'}
        aria-pressed={liked}
      >
        {likeLoading ? (
          <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        )}
        {likes > 0 && <span>{likes}</span>}
      </button>

      {/* Recast */}
      <button
        onClick={handleRecast}
        disabled={!hasSigner || recastLoading || recasted}
        title={
          !hasSigner
            ? 'Connect signer to recast'
            : recasted
            ? 'Already recasted'
            : 'Recast'
        }
        className={`flex items-center gap-1 text-[11px] transition-colors disabled:opacity-40 ${
          recasted
            ? 'text-green-400'
            : 'text-gray-500 hover:text-green-400'
        }`}
        aria-label={recasted ? 'Already recasted' : 'Recast'}
        aria-pressed={recasted}
      >
        {recastLoading ? (
          <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
          </svg>
        )}
        {recasts > 0 && <span>{recasts}</span>}
      </button>
    </div>
  );
}
