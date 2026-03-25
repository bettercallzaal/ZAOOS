'use client';

import { useState, useEffect, useCallback } from 'react';

const REACTION_EMOJIS = ['\uD83D\uDD25', '\u2764\uFE0F', '\uD83C\uDFB5', '\uD83D\uDC8E', '\uD83D\uDC4F', '\uD83E\uDD2F'];

interface TrackReactionsProps {
  songUrl: string;
  compact?: boolean;
  className?: string;
}

export function TrackReactions({ songUrl, compact = false, className = '' }: TrackReactionsProps) {
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Fetch reactions on mount
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/music/library/react?url=${encodeURIComponent(songUrl)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setReactions(data.reactions || {});
          setUserReactions(data.userReactions || []);
        }
      })
      .catch(() => {
        // Non-critical — silently ignore
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [songUrl]);

  const toggleReaction = useCallback(async (emoji: string) => {
    if (toggling) return;
    setToggling(emoji);

    // Optimistic update
    const wasReacted = userReactions.includes(emoji);
    const prevReactions = { ...reactions };
    const prevUserReactions = [...userReactions];

    if (wasReacted) {
      setUserReactions((prev) => prev.filter((e) => e !== emoji));
      setReactions((prev) => {
        const next = { ...prev };
        next[emoji] = Math.max((next[emoji] || 1) - 1, 0);
        if (next[emoji] === 0) delete next[emoji];
        return next;
      });
    } else {
      setUserReactions((prev) => [...prev, emoji]);
      setReactions((prev) => ({
        ...prev,
        [emoji]: (prev[emoji] || 0) + 1,
      }));
    }

    try {
      const res = await fetch('/api/music/library/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: songUrl, emoji }),
      });

      if (res.ok) {
        const data = await res.json();
        setReactions(data.reactions || {});
        // Update user reactions based on server response
        if (data.reacted) {
          setUserReactions((prev) => prev.includes(emoji) ? prev : [...prev, emoji]);
        } else {
          setUserReactions((prev) => prev.filter((e) => e !== emoji));
        }
      } else {
        // Revert on failure
        setReactions(prevReactions);
        setUserReactions(prevUserReactions);
      }
    } catch {
      // Revert on failure
      setReactions(prevReactions);
      setUserReactions(prevUserReactions);
    } finally {
      setToggling(null);
    }
  }, [toggling, userReactions, reactions, songUrl]);

  if (loading) return null;

  // In compact mode, only show emojis with > 0 reactions
  const visibleEmojis = compact && !showAll
    ? REACTION_EMOJIS.filter((e) => (reactions[e] || 0) > 0)
    : REACTION_EMOJIS;

  const hasHiddenEmojis = compact && !showAll && visibleEmojis.length < REACTION_EMOJIS.length;

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {visibleEmojis.map((emoji) => {
        const count = reactions[emoji] || 0;
        const isActive = userReactions.includes(emoji);
        const isToggling = toggling === emoji;

        return (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            disabled={isToggling}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all ${
              isActive
                ? 'bg-[#f5a623]/20 border border-[#f5a623]/40 text-[#f5a623]'
                : 'bg-white/5 border border-transparent hover:bg-white/10 text-gray-400 hover:text-gray-200'
            } ${isToggling ? 'opacity-60' : ''}`}
            aria-label={`React with ${emoji}`}
          >
            <span className="text-sm leading-none">{emoji}</span>
            {count > 0 && (
              <span className="text-[10px] tabular-nums leading-none">{count}</span>
            )}
          </button>
        );
      })}

      {hasHiddenEmojis && (
        <button
          onClick={() => setShowAll(true)}
          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 text-xs transition-colors"
          aria-label="Show all reactions"
        >
          +
        </button>
      )}
    </div>
  );
}
