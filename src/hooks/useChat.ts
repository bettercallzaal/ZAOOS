'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Cast } from '@/types';

const POLL_INTERVAL = 30_000; // 30 s — was 8 s (reduces Neynar credit usage ~4×)

export function useChat(channel: string = 'zao') {
  const [messages, setMessages] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const firstHashRef = useRef<string | null>(null); // dedup: skip setState if top cast unchanged

  const fetchMessages = useCallback(async () => {
    // Pause polling when tab is hidden to save credits
    if (document.hidden) return;

    try {
      const res = await fetch(`/api/chat/messages?channel=${channel}`);
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
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchMessages]);

  const sendMessage = useCallback(async (text: string, parentHash?: string, embedHash?: string, crossPostChannels?: string[], embedUrls?: string[]) => {
    setSending(true);
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
      // Force refresh — small delay lets the DB write complete
      firstHashRef.current = null;
      await new Promise((r) => setTimeout(r, 500));
      await fetchMessages();
      // Second fetch in case DB write was slow
      setTimeout(() => {
        firstHashRef.current = null;
        fetchMessages();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
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

  return { messages, loading, sending, error, sendMessage, hideMessage, refetch: fetchMessages };
}
