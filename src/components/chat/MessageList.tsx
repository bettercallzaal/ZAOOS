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
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

export function MessageList({ messages, isAdmin, currentFid, hasSigner, onHide, onOpenThread, onQuote, onOpenProfile, onReply, loading, channelId = 'zao', sortMode = 'newest', onLoadMore, hasMore = false, loadingMore = false }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
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

  // Intersection Observer for infinite scroll — triggers loadMore when sentinel is visible
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore(); },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);

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
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#f5a623]/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </div>
          <p className="text-white font-semibold text-base mb-1">No posts yet</p>
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
        {/* Sentinel for loading older messages */}
        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-2">
            {loadingMore ? (
              <div className="w-4 h-4 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-xs text-gray-600">Scroll up for older messages</span>
            )}
          </div>
        )}
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
