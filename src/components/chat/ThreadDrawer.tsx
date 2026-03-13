'use client';

import { useState, useEffect } from 'react';
import { Cast } from '@/types';
import { Message } from './Message';

interface ThreadDrawerProps {
  threadHash: string;
  isAdmin: boolean;
  onHide: (hash: string) => void;
  onClose: () => void;
}

export function ThreadDrawer({ threadHash, isAdmin, onHide, onClose }: ThreadDrawerProps) {
  const [thread, setThread] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchThread() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/chat/thread/${threadHash}`);
        if (!res.ok) throw new Error('Failed to load thread');
        const data = await res.json();
        if (!cancelled) {
          // data could be { casts: Cast[] } or Cast[] depending on API shape
          const casts: Cast[] = Array.isArray(data) ? data : data.casts ?? [];
          setThread(casts);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load thread');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchThread();
    return () => { cancelled = true; };
  }, [threadHash]);

  // Find parent (first cast) and replies
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
            className="text-gray-400 hover:text-white p-1"
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
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 text-sm">Loading thread...</div>
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
                  onHide={onHide}
                />
              ))}

              {!loading && replies.length === 0 && parent && (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No replies yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
