'use client';

import { useState } from 'react';
import { QuotedCastData } from '@/types';

interface ComposeBarProps {
  hasSigner: boolean;
  onSend: (text: string, parentHash?: string, embedHash?: string) => Promise<void>;
  sending?: boolean;
  channel?: string;
  quotedCast?: QuotedCastData | null;
  onClearQuote?: () => void;
}

export function ComposeBar({
  hasSigner,
  onSend,
  sending,
  channel = 'zao',
  quotedCast,
  onClearQuote,
}: ComposeBarProps) {
  const [text, setText] = useState('');

  const handleSubmit = async () => {
    const msg = text.trim();
    if (!msg) return;

    if (hasSigner) {
      try {
        await onSend(msg, undefined, quotedCast?.hash);
        setText('');
        onClearQuote?.();
      } catch {
        // Error handled by useChat hook
      }
    } else {
      const encoded = encodeURIComponent(msg);
      const url = `https://warpcast.com/~/compose?text=${encoded}&channelKey=${channel}`;
      window.open(url, '_blank');
      setText('');
    }
  };

  return (
    <div className="border-t border-gray-800 bg-[#0d1b2a]">
      {/* Quote preview */}
      {quotedCast && (
        <div className="px-3 pt-2">
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#0a1628] border border-gray-700">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-[#f5a623]">
                Quoting {quotedCast.author.display_name || quotedCast.author.username}
              </span>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{quotedCast.text}</p>
            </div>
            <button
              onClick={onClearQuote}
              className="text-gray-500 hover:text-white flex-shrink-0 mt-0.5"
              aria-label="Remove quote"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="p-3">
        <div className="flex gap-2 items-end">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (text.trim() && !sending) handleSubmit();
              }
            }}
            placeholder={
              quotedCast
                ? 'Add a comment...'
                : hasSigner
                  ? `Message #${channel}...`
                  : `Message #${channel}, post via Farcaster...`
            }
            rows={1}
            maxLength={1024}
            disabled={sending}
            className="flex-1 bg-[#1a2a3a] text-white text-sm rounded-lg px-4 py-2.5 resize-none placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623] disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || sending}
            className="bg-[#f5a623] text-[#0a1628] font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-[#ffd700] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            {sending ? (
              <span className="w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin" />
            ) : !hasSigner ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
            {sending ? 'Sending' : 'Post'}
          </button>
        </div>
        {!hasSigner && (
          <p className="text-xs text-gray-600 mt-1.5">Opens in Farcaster to post to /{channel} channel</p>
        )}
      </div>
    </div>
  );
}
