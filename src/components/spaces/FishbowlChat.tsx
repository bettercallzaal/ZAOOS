'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ChatMessage {
  id: string;
  sender_fid: number;
  sender_username: string;
  text: string;
  created_at: string;
}

interface FishbowlChatProps {
  roomId: string;
}

export function FishbowlChat({ roomId }: FishbowlChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageTime = useRef<string | null>(null);

  const fetchMessages = useCallback(async () => {
    const params = new URLSearchParams({ roomId, limit: '50' });
    if (lastMessageTime.current) {
      params.set('after', lastMessageTime.current);
    }
    try {
      const res = await fetch(`/api/fishbowlz/chat?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const newMessages: ChatMessage[] = data.messages || [];
      if (newMessages.length > 0) {
        setMessages((prev) => {
          // Deduplicate by id
          const existingIds = new Set(prev.map((m) => m.id));
          const unique = newMessages.filter((m) => !existingIds.has(m.id));
          return [...prev, ...unique];
        });
        lastMessageTime.current = newMessages[newMessages.length - 1].created_at;
      }
    } catch {
      // Non-critical
    }
  }, [roomId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/fishbowlz/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, text: text.trim() }),
      });
      if (res.ok) {
        setText('');
        // Immediately fetch to show the new message
        await fetchMessages();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/10">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          💬 Chat
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-4">No messages yet</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="text-xs">
              <span className={`font-semibold ${msg.sender_fid === user?.fid ? 'text-[#f5a623]' : 'text-blue-400'}`}>
                @{msg.sender_username}
              </span>
              <span className="text-gray-300 ml-1.5">{msg.text}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {user && (
        <form onSubmit={sendMessage} className="p-3 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message..."
            maxLength={500}
            disabled={sending}
            className="flex-1 bg-[#0a1628] border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623] min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="px-3 py-2 bg-[#f5a623] text-[#0a1628] rounded-lg text-xs font-medium hover:bg-[#d4941f] disabled:opacity-50 transition-colors min-h-[36px]"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
