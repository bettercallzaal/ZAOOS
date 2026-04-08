'use client';

import { useState, useCallback, useRef } from 'react';

const EMOJIS = ['🔥', '👏', '💯', '❤️', '😂', '🐟'];

interface FloatingReaction {
  id: number;
  emoji: string;
  x: number; // random horizontal position (0-100%)
}

interface ReactionsProps {
  roomId: string;
}

export function Reactions({ roomId }: ReactionsProps) {
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const counterRef = useRef(0);

  const addReaction = useCallback((emoji: string) => {
    const id = ++counterRef.current;
    const x = 10 + Math.random() * 80; // 10-90% horizontal range
    setReactions((prev) => [...prev, { id, emoji, x }]);

    // Remove after animation completes (2s)
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);

    // Optional: log reaction event (fire-and-forget)
    fetch('/api/fishbowlz/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'reaction',
        eventData: { emoji, roomId },
        roomId,
      }),
    }).catch(() => {});
  }, [roomId]);

  return (
    <>
      {/* Floating reactions container */}
      <div className="fixed bottom-32 right-4 lg:bottom-24 w-16 h-64 pointer-events-none z-40 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute animate-float-up text-2xl"
            style={{ left: `${r.x}%` }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Reaction buttons */}
      <div className="flex items-center gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => addReaction(emoji)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 active:scale-90 transition-all text-lg"
            aria-label={`React with ${emoji}`}
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
