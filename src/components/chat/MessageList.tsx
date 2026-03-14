'use client';

import { useEffect, useRef, useLayoutEffect } from 'react';
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
  onOpenProfile?: (fid: number) => void;
  onReply?: (hash: string, authorName: string, text: string) => void;
  loading: boolean;
  channelId?: string;
  sortMode?: 'newest' | 'oldest' | 'most_liked' | 'most_replied';
}

export function MessageList({ messages, isAdmin, currentFid, hasSigner, onHide, onOpenThread, onQuote, onOpenProfile, onReply, loading, channelId = 'zao', sortMode = 'newest' }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const prevChannelRef = useRef(channelId);

  // Force scroll to bottom helper
  const scrollToBottom = (instant = true) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    if (!instant) return;
    // Double-tap: scroll again after images/embeds may have loaded
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  };

  // Scroll to bottom on initial load and channel switch
  useLayoutEffect(() => {
    if (messages.length === 0) return;

    const channelChanged = prevChannelRef.current !== channelId;
    prevChannelRef.current = channelId;

    if (channelChanged || prevCountRef.current === 0) {
      // Initial load or channel switch — snap to bottom immediately
      scrollToBottom(true);
      // Also after a short delay for lazy-loaded content
      setTimeout(() => scrollToBottom(true), 100);
      setTimeout(() => scrollToBottom(true), 500);
    } else if (messages.length > prevCountRef.current) {
      // New message arrived — smooth scroll
      const el = containerRef.current;
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    }

    prevCountRef.current = messages.length;
  }, [messages.length, channelId]);

  // Reset count when channel changes
  useEffect(() => {
    prevCountRef.current = 0;
  }, [channelId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#f5a623]/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 016 21c-1.282 0-2.47-.402-3.445-1.087-.81.22-1.668.337-2.555.337C-4.97 20.25-9 16.556-9 12S-4.97 3.75 0 3.75 9 7.444 9 12z" />
            </svg>
          </div>
          <p className="text-white font-medium mb-1">No messages yet</p>
          <p className="text-sm text-gray-500">Be the first to post in #{channelId}</p>
        </div>
      </div>
    );
  }

  // For chronological sorts: reverse so oldest is at top (chat style)
  // For engagement sorts: keep order as-is (best at top, feed style)
  const isChatLayout = sortMode === 'newest' || sortMode === 'oldest';
  const displayMessages = isChatLayout ? [...messages].reverse() : messages;

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto" style={{ overflowAnchor: 'none' }}>
      {/* Spacer pushes messages to bottom in chat layout */}
      <div className={isChatLayout ? 'min-h-full flex flex-col justify-end' : ''}>
        <div className="py-2">
          {displayMessages.map((cast) => (
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
      </div>
      {/* Scroll anchor — browser keeps this element visible as content above expands */}
      <div style={{ overflowAnchor: 'auto', height: '1px' }} />
    </div>
  );
}
