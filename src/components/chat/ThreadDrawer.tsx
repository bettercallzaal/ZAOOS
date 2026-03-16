'use client';

import { useState, useEffect, useRef } from 'react';
import { Cast } from '@/types';
import { Message } from './Message';

interface ThreadDrawerProps {
  threadHash: string;
  isAdmin: boolean;
  hasSigner: boolean;
  currentFid: number;
  onHide: (hash: string) => void;
  onSend: (text: string, parentHash?: string) => Promise<void>;
  onClose: () => void;
}

export function ThreadDrawer({ threadHash, isAdmin, hasSigner, currentFid, onHide, onSend, onClose }: ThreadDrawerProps) {
  const [thread, setThread] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();

    async function fetchThread() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/chat/thread/${threadHash}`, { signal: abortController.signal });
        if (!res.ok) throw new Error('Failed to load thread');
        const data = await res.json();
        if (!cancelled) {
          const casts: Cast[] = Array.isArray(data) ? data : data.casts ?? [];
          setThread(casts);
        }
      } catch (err) {
        if (cancelled || abortController.signal.aborted) return;
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load thread');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchThread();
    const interval = setInterval(() => {
      if (!document.hidden) fetchThread();
    }, 30_000);
    const handleVisibility = () => { if (!document.hidden) fetchThread(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      abortController.abort();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [threadHash]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length]);

  const handleReply = async () => {
    const msg = replyText.trim();
    if (!msg) return;

    if (hasSigner) {
      setSending(true);
      try {
        await onSend(msg, threadHash);
        setReplyText('');
      } catch {
        // error handled by parent
      } finally {
        setSending(false);
      }
    } else {
      const encoded = encodeURIComponent(msg);
      const url = `https://warpcast.com/~/compose?text=${encoded}&channelKey=zao&parentCastHash=${threadHash}`;
      window.open(url, '_blank');
      setReplyText('');
    }
  };

  const parent = thread[0] ?? null;
  const replies = thread.slice(1);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:bg-black/30"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-0 md:inset-y-0 md:right-0 md:left-auto md:w-[420px] z-50 flex flex-col bg-[#0d1b2a] border-l border-gray-800 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0a1628]">
          <h3 className="text-sm font-semibold text-gray-300">Thread</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2"
            aria-label="Close thread"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Loading thread...</p>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          {!loading && !error && (
            <div className="py-2">
              {parent && (
                <div className="border-b border-gray-800 pb-2">
                  <Message
                    cast={parent}
                    isAdmin={isAdmin}
                    currentFid={currentFid}
                    hasSigner={hasSigner}
                    onHide={onHide}
                  />
                </div>
              )}

              {replies.length > 0 && (
                <div className="px-4 py-2">
                  <span className="text-xs text-[#f5a623] font-medium">
                    {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                  </span>
                </div>
              )}

              {replies.map((cast) => (
                <Message
                  key={cast.hash}
                  cast={cast}
                  isAdmin={isAdmin}
                  currentFid={currentFid}
                  hasSigner={hasSigner}
                  onHide={onHide}
                />
              ))}

              {!loading && replies.length === 0 && parent && (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No replies yet
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Reply input */}
        <div className="border-t border-gray-800 p-3 bg-[#0a1628]">
          <div className="flex gap-2 items-end">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (replyText.trim() && !sending) handleReply();
                }
              }}
              placeholder={hasSigner ? 'Reply...' : 'Reply via Farcaster...'}
              rows={1}
              maxLength={1024}
              disabled={sending}
              className="flex-1 bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2 resize-none placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623] disabled:opacity-50"
            />
            <button
              onClick={handleReply}
              disabled={!replyText.trim() || sending}
              className="bg-[#f5a623] text-[#0a1628] font-medium px-3 py-2 rounded-lg text-sm hover:bg-[#ffd700] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
