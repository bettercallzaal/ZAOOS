'use client';

import { useState, useEffect } from 'react';

interface ShareToChatButtonProps {
  songUrl: string;
  trackName?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Shares a music URL to the /zao chat channel via POST /api/chat/send.
 * The chat system auto-renders MusicEmbed for music URLs.
 */
export function ShareToChatButton({ songUrl, trackName, compact = false, className = '' }: ShareToChatButtonProps) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // Reset success indicator after 1.5s
  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(() => setStatus('idle'), 1500);
    return () => clearTimeout(t);
  }, [status]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'sending') return;

    setStatus('sending');
    try {
      const text = trackName ? `${songUrl}` : songUrl;
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          channel: 'zao',
          embedUrls: [songUrl],
        }),
      });
      if (!res.ok) throw new Error('Failed to share');
      setStatus('success');
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const label = status === 'success' ? 'Shared to chat' : 'Share to chat';

  return (
    <button
      onClick={handleShare}
      disabled={status === 'sending'}
      className={`flex items-center justify-center transition-colors ${
        compact
          ? 'p-1.5 text-gray-400 hover:text-[#f5a623] rounded disabled:opacity-50'
          : 'p-1.5 text-gray-400 hover:text-[#f5a623] rounded-lg hover:bg-white/5 disabled:opacity-50'
      } ${className}`}
      aria-label={label}
      title={label}
    >
      {status === 'sending' ? (
        <div className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} border-2 border-gray-600 border-t-[#f5a623] rounded-full animate-spin`} />
      ) : status === 'success' ? (
        <svg className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-green-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      )}
    </button>
  );
}
