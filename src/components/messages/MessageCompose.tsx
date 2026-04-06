'use client';

import { useState, useRef, useEffect } from 'react';

interface MessageComposeProps {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  streamDisconnected?: boolean;
}

export function MessageCompose({ onSend, disabled, placeholder, streamDisconnected }: MessageComposeProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!text.trim() || sending || disabled) return;
    setSending(true);
    setSendError(null);
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
      setSendError('Message failed to send. Tap to retry.');
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
    <div className="flex-shrink-0 border-t border-white/[0.08] bg-[#0d1b2a]">
      <div className="p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Type a message...'}
            disabled={disabled}
            maxLength={4000}
            rows={1}
            className="flex-1 bg-[#1a2a3a] text-white text-base md:text-sm rounded-lg px-4 py-2.5 resize-none placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623] disabled:opacity-50 max-h-32"
            style={{ minHeight: '40px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              canSend
                ? 'bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700]'
                : 'bg-[#1a2a3a] text-gray-600'
            }`}
            aria-label="Send message"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
        <div className="flex items-center justify-center mt-1.5 gap-3">
          {sendError && (
            <button
              onClick={handleSend}
              className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors"
            >
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
              {sendError}
            </button>
          )}
          {!sendError && (
            <div className="flex items-center gap-1">
              <svg className="w-2.5 h-2.5 text-green-500/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="text-[10px] text-gray-600">encrypted</span>
              {streamDisconnected && (
                <span className="text-[10px] text-yellow-500/80 ml-1">· offline</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
