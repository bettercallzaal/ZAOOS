'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Cast } from '@/types';

export function useChat(channel: string = 'zao') {
  const [messages, setMessages] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/messages?channel=${channel}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMessages(data.casts || []);
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
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 8000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMessages]);

  const sendMessage = useCallback(async (text: string, parentHash?: string) => {
    setSending(true);
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, parentHash, channel }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }
      await fetchMessages();
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
    await fetchMessages();
  }, [fetchMessages]);

  return { messages, loading, sending, error, sendMessage, hideMessage, refetch: fetchMessages };
}
