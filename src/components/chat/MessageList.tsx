'use client';

import { useEffect, useRef } from 'react';
import { Cast, QuotedCastData } from '@/types';
import { Message } from './Message';

interface MessageListProps {
  messages: Cast[];
  isAdmin: boolean;
  currentFid: number;
  hasSigner: boolean;
  onHide: (hash: string) => void;
  onOpenThread?: (hash: string) => void;
  onQuote?: (cast: QuotedCastData) => void;
  loading: boolean;
  channelId?: string;
}

export function MessageList({ messages, isAdmin, currentFid, hasSigner, onHide, onOpenThread, onQuote, loading, channelId = 'zao' }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const initialScrollDoneRef = useRef(false);

  // Reset scroll state when channel changes
  useEffect(() => {
    prevCountRef.current = 0;
    initialScrollDoneRef.current = false;
  }, [channelId]);

  useEffect(() => {
    if (messages.length === 0) return;

    if (!initialScrollDoneRef.current) {
      // First load — jump instantly to bottom
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
      initialScrollDoneRef.current = true;
    } else if (messages.length > prevCountRef.current) {
      // New message arrived — smooth scroll
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
          <p className="text-sm">Be the first to post in #{channelId}</p>
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
            currentFid={currentFid}
            hasSigner={hasSigner}
            onHide={onHide}
            onOpenThread={onOpenThread}
            onQuote={onQuote}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
