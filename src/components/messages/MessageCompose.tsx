'use client';

import { useState, useRef, useEffect } from 'react';

interface MessageComposeProps {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageCompose({ onSend, disabled, placeholder }: MessageComposeProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!text.trim() || sending || disabled) return;
    setSending(true);
    try {
      await onSend(text);
      setText('');
      // Reset height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = text.trim().length > 0 && !sending && !disabled;

  return (
    <div className="flex-shrink-0 border-t border-gray-800/60 bg-[#0d1b2a] px-3 sm:px-6 py-3">
      <div className="flex items-end gap-2.5">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Type a message...'}
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-[#1a2a3a] text-white text-sm rounded-2xl px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]/30 disabled:opacity-50 max-h-32 border border-gray-800/30"
            style={{ minHeight: '44px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`flex items-center justify-center w-11 h-11 rounded-2xl transition-all flex-shrink-0 ${
            canSend
              ? 'bg-[#f5a623] text-black hover:bg-[#ffd700] scale-100'
              : 'bg-[#1a2a3a] text-gray-600 scale-95'
          }`}
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
            </svg>
          )}
        </button>
      </div>
      <div className="flex items-center justify-center mt-1.5">
        <div className="flex items-center gap-1">
          <svg className="w-2.5 h-2.5 text-green-500/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span className="text-[9px] text-gray-700">encrypted</span>
        </div>
      </div>
    </div>
  );
}
