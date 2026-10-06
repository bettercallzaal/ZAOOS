'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/db/supabase';
import type { Cast } from '@/types';

// Fallback polling interval: 60s when Realtime is active, 30s when inactive
const REALTIME_POLL_INTERVAL = 60_000;
const FALLBACK_POLL_INTERVAL = 30_000;

function rowToCast(row: Record<string, unknown>): Cast {
  const reactions = (row.reactions ?? {}) as {
    likes_count?: number;
    recasts_count?: number;
    likes?: { fid: number }[];
    recasts?: { fid: number }[];
  };
  return {
    hash: (row.hash as string) || '',
    author: {
      fid: (row.fid as number) || 0,
      username: (row.author_username as string) || '',
      display_name: (row.author_display as string) || '',
      pfp_url: (row.author_pfp as string) || '',
    },
    text: (row.text as string) || '',
    timestamp: (row.timestamp as string) || new Date().toISOString(),
    replies: { count: (row.replies_count as number) || 0 },
    reactions: {
      likes_count: reactions.likes_count ?? 0,
      recasts_count: reactions.recasts_count ?? 0,
      likes: reactions.likes ?? [],
      recasts: reactions.recasts ?? [],
    },
    parent_hash: (row.parent_hash as string) || null,
    embeds: (row.embeds as Cast['embeds']) || [],
  };
}

export function useChat(channel: string = 'zao') {
  const [messages, setMessages] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRealtime, setIsRealtime] = useState(false);
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
      const res = await fetch(`/api/chat/messages?channel=${channel}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const casts: Cast[] = data.casts || [];

      // Skip re-render if feed hasn't changed (same top cast hash)
      const topHash = casts[0]?.hash ?? null;
      if (topHash && topHash === firstHashRef.current) return;
      firstHashRef.current = topHash;

      setMessages(casts);
      setHasMore(data.hasMore ?? false);
      setError(null);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [channel]);

  // Realtime subscription for instant live updates via Supabase
  useEffect(() => {
    let supabase: ReturnType<typeof getSupabaseBrowser> | null = null;
    try {
      supabase = getSupabaseBrowser();
    } catch {
      // Missing env vars or test environment — graceful fallback to polling
      setIsRealtime(false);
    }

    if (!supabase) return;

    const channelSub = supabase
      .channel(`chat-casts-${channel}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'channel_casts',
          filter: `channel_id=eq.${channel}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (!row?.hash) return;
          const newCast = rowToCast(row);
          setMessages((prev) => {
            if (prev.some((m) => m.hash === newCast.hash)) return prev;
            return [newCast, ...prev];
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'channel_casts',
          filter: `channel_id=eq.${channel}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (!row?.hash) return;
          const updated = rowToCast(row);
          setMessages((prev) =>
            prev.map((m) => (m.hash === updated.hash ? { ...m, ...updated } : m)),
          );
        },
      )
      .subscribe((status) => {
        setIsRealtime(status === 'SUBSCRIBED');
      });

    return () => {
      setIsRealtime(false);
      supabase?.removeChannel(channelSub);
    };
  }, [channel]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      // messages are sorted newest-first from the API, so the oldest is the last element
      const oldestTimestamp = messages[messages.length - 1]?.timestamp;
      if (!oldestTimestamp) {
        setLoadingMore(false);
        return;
      }
      const res = await fetch(
        `/api/chat/messages?channel=${channel}&cursor=${oldestTimestamp}&limit=20`,
      );
      if (res.ok) {
        const data = await res.json();
        const older = (data.casts || []) as Cast[];
        setHasMore(data.hasMore ?? false);
        if (older.length > 0) {
          setMessages((prev) => {
            const existingHashes = new Set(prev.map((m) => m.hash));
            const newMessages = older.filter((m) => !existingHashes.has(m.hash));
            return [...prev, ...newMessages];
          });
        }
      }
    } catch {
      /* ignore */
    }
    setLoadingMore(false);
  }, [channel, messages, loadingMore, hasMore]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setHasMore(true);
    firstHashRef.current = null;
    fetchMessages();

    const intervalTime = isRealtime ? REALTIME_POLL_INTERVAL : FALLBACK_POLL_INTERVAL;
    intervalRef.current = setInterval(fetchMessages, intervalTime);

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
  }, [fetchMessages, isRealtime]);

  const clearSendError = useCallback(() => setSendError(null), []);

  const sendMessage = useCallback(
    async (
      text: string,
      parentHash?: string,
      embedHash?: string,
      crossPostChannels?: string[],
      embedUrls?: string[],
      embedFid?: number,
    ) => {
      setSending(true);
      setSendError(null);
      try {
        const res = await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            parentHash,
            embedHash,
            embedFid,
            embedUrls,
            channel,
            crossPostChannels,
          }),
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
    },
    [fetchMessages, channel],
  );

  const hideMessage = useCallback(
    async (castHash: string, reason?: string) => {
      const res = await fetch('/api/chat/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ castHash, reason }),
      });
      if (!res.ok) throw new Error('Failed to hide message');
      firstHashRef.current = null;
      await fetchMessages();
    },
    [fetchMessages],
  );

  return {
    messages,
    loading,
    sending,
    error,
    sendError,
    clearSendError,
    sendMessage,
    hideMessage,
    refetch: fetchMessages,
    loadMore,
    hasMore,
    loadingMore,
    isRealtime,
  };
}
