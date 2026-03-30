'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseBrowser } from '@/lib/db/supabase';

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number; // random horizontal offset %
}

const EMOJIS = [
  { emoji: '\u{1F525}', name: 'fire' },
  { emoji: '\u2764\uFE0F', name: 'heart' },
  { emoji: '\u{1F44F}', name: 'clap' },
  { emoji: '\u{1F3B5}', name: 'music' },
  { emoji: '\u{1F4AF}', name: '100' },
  { emoji: '\u{1F92F}', name: 'mind blown' },
];
const ANIMATION_MS = 1500;

interface RoomReactionsProps {
  roomId: string;
  fid: number;
}

export function RoomReactions({ roomId, fid }: RoomReactionsProps) {
  const [floating, setFloating] = useState<FloatingEmoji[]>([]);
  const counterRef = useRef(0);

  const addFloating = useCallback((emoji: string) => {
    const id = `${Date.now()}-${counterRef.current++}`;
    const x = 10 + Math.random() * 80;
    setFloating((prev) => [...prev.slice(-30), { id, emoji, x }]);
    setTimeout(() => {
      setFloating((prev) => prev.filter((e) => e.id !== id));
    }, ANIMATION_MS);
  }, []);

  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowser>['channel']> | null>(null);

  // Store the channel created in the useEffect so handleReact can reuse it
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const channel = supabase.channel(`room-reactions:${roomId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'reaction' }, (payload) => {
        const data = payload.payload as { emoji: string; fid: number };
        if (data.fid !== fid) {
          addFloating(data.emoji);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, fid, addFloating]);

  const handleReact = (emoji: string) => {
    addFloating(emoji);
    // Broadcast to others via the existing channel
    channelRef.current?.send({ type: 'broadcast', event: 'reaction', payload: { emoji, fid } });
  };

  return (
    <div className="relative">
      {/* Floating emojis overlay */}
      <div className="absolute bottom-full left-0 right-0 h-48 pointer-events-none overflow-hidden">
        {floating.map((item) => (
          <span
            key={item.id}
            className="absolute text-2xl animate-float-up"
            style={{ left: `${item.x}%`, bottom: 0 }}
          >
            {item.emoji}
          </span>
        ))}
      </div>

      {/* Emoji button bar */}
      <div className="flex items-center justify-center gap-1.5 px-3 py-2">
        {EMOJIS.map(({ emoji, name }) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            aria-label={`React with ${name}`}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1a2a3a]/60 hover:bg-[#1a2a3a] border border-gray-700/40 hover:border-gray-600 text-lg transition-all active:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* CSS animation */}
      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-180px) scale(1.3);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up ${ANIMATION_MS}ms ease-out forwards;
        }
      `}</style>
    </div>
  );
}
