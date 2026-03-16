'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Cast } from '@/types';

const POLL_INTERVAL = 15_000; // 15 s — balance between freshness and Neynar credit usage

export function useChat(channel: string = 'zao') {
  const [messages, setMessages] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const firstHashRef = useRef<string | null>(null); // dedup: skip setState if top cast unchanged
  const abortRef = useRef<AbortController | null>(null);

  const fetchMessages = useCallback(async () => {
    // Pause polling when tab is hidden to save credits
    if (document.hidden) return;

    // Abort any in-flight request for this channel
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/chat/messages?channel=${channel}`, { signal: controller.signal });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const casts: Cast[] = data.casts || [];

      // Skip re-render if feed hasn't changed (same top cast hash)
      const topHash = casts[0]?.hash ?? null;
      if (topHash && topHash === firstHashRef.current) return;
      firstHashRef.current = topHash;

      setMessages(casts);
      setError(null);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [channel]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    firstHashRef.current = null;
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, POLL_INTERVAL);

    // Resume polling immediately when tab becomes visible again
    const handleVisibility = () => {
      if (!document.hidden) fetchMessages();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      abortRef.current?.abort();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchMessages]);

  const clearSendError = useCallback(() => setSendError(null), []);

  const sendMessage = useCallback(async (text: string, parentHash?: string, embedHash?: string, crossPostChannels?: string[], embedUrls?: string[]) => {
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, parentHash, embedHash, embedUrls, channel, crossPostChannels }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }
      // Optimistic: add sent cast to messages immediately so user sees it
      const result = await res.json();
      if (result.cast) {
        const optimistic: Cast = {
          hash: result.cast.hash || `temp-${Date.now()}`,
          author: {
            fid: 0, // will be replaced on refresh
            username: '',
            display_name: '',
            pfp_url: '',
          },
          text,
          timestamp: new Date().toISOString(),
          embeds: [],
          reactions: { likes: [], recasts: [], likes_count: 0, recasts_count: 0 },
          replies: { count: 0 },
          parent_hash: parentHash || null,
        };
        setMessages((prev) => [optimistic, ...prev]);
      }
      // Refresh to get the real data from server
      setTimeout(() => {
        firstHashRef.current = null;
        fetchMessages();
      }, 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send';
      setError(msg);
      setSendError(msg);
      throw err;
    } finally {
      setSending(false);
    }
  }, [fetchMessages, channel]);

  const hideMessage = useCallback(async (castHash: string, reason?: string) => {
    const res = await fetch('/api/chat/hide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ castHash, reason }),
    });
    if (!res.ok) throw new Error('Failed to hide message');
    firstHashRef.current = null;
    await fetchMessages();
  }, [fetchMessages]);

  return { messages, loading, sending, error, sendError, clearSendError, sendMessage, hideMessage, refetch: fetchMessages };
}
