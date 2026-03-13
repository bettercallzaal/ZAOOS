'use client';

import { useState, useCallback, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (text: string) => Promise<void>;
  sending: boolean;
}

export function MessageInput({ onSend, sending }: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    try {
      await onSend(trimmed);
      setText('');
    } catch {
      // Error handled by useChat hook
    }
  }, [text, sending, onSend]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-800 p-3 bg-[#0d1b2a]">
      <div className="flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message #zao"
          rows={1}
          maxLength={1024}
          className="flex-1 bg-[#1a2a3a] text-white text-sm rounded-lg px-4 py-2.5 resize-none placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="bg-[#f5a623] text-[#0a1628] font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-[#ffd700] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
