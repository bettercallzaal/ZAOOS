'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabaseBrowser } from '@/lib/db/supabase';

interface ChatMessage {
  id: string;
  fid: number;
  username: string;
  pfp_url: string;
  message: string;
  created_at: string;
}

interface RoomChatProps {
  roomId: string;
  fid: number;
  username: string;
  pfpUrl: string;
  onClose?: () => void;
}

export function RoomChat({ roomId, fid, onClose }: RoomChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/spaces/chat?roomId=${roomId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages ?? []);
    }
  }, [roomId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const channel = supabase
      .channel(`room-chat:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => [...prev.slice(-199), payload.new as ChatMessage]);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      await fetch('/api/spaces/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, message: text }),
      });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1b2a] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800">
        <span className="text-sm font-medium">Room Chat</span>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            &#10005;
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5">
        {messages.length === 0 && (
          <p className="text-xs text-gray-500 text-center mt-8">No messages yet. Say something!</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2 group">
            {msg.pfp_url ? (
              <img src={msg.pfp_url} alt="" className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-700 flex-shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xs font-semibold ${msg.fid === fid ? 'text-[#f5a623]' : 'text-gray-300'}`}>
                  {msg.username || `FID ${msg.fid}`}
                </span>
                <span className="text-[10px] text-gray-600">{formatTime(msg.created_at)}</span>
              </div>
              <p className="text-sm text-gray-200 break-words">{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="border-t border-gray-800 p-2 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
          className="flex-1 bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-[#f5a623] focus:outline-none placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="px-3 py-2 bg-[#f5a623] hover:bg-[#e09520] disabled:opacity-40 disabled:cursor-not-allowed text-black text-sm font-medium rounded-lg transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
