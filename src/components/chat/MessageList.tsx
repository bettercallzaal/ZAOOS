'use client';

import { useEffect, useRef } from 'react';
import { Cast } from '@/types';
import { Message } from './Message';

interface MessageListProps {
  messages: Cast[];
  isAdmin: boolean;
  onHide: (hash: string) => void;
  loading: boolean;
}

export function MessageList({ messages, isAdmin, onHide, loading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    // Auto-scroll when new messages arrive
    if (messages.length > prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading messages...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-1">No messages yet</p>
          <p className="text-sm">Be the first to post in #zao</p>
        </div>
      </div>
    );
  }

  // Reverse to show oldest first (Neynar returns newest first)
  const sorted = [...messages].reverse();

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="py-4">
        {sorted.map((cast) => (
          <Message
            key={cast.hash}
            cast={cast}
            isAdmin={isAdmin}
            onHide={onHide}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
