'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface CommentAuthor {
  display_name: string;
  username: string;
  pfp_url: string | null;
  fid: number;
  zid: number | null;
}

interface Comment {
  id: string;
  body: string;
  created_at: string;
  author: CommentAuthor;
}

interface ProposalCommentsProps {
  proposalId: string;
  currentFid: number;
}

function timeAgo(ts: string): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function ProposalComments({ proposalId, currentFid }: ProposalCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/proposals/comment?proposal_id=${proposalId}`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments || []);
    }
    setLoading(false);
  }, [proposalId]);

  /* eslint-disable react-hooks/set-state-in-effect -- fetchComments sets state after async fetch */
  useEffect(() => { fetchComments(); }, [fetchComments]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/proposals/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: proposalId, body: text.trim() }),
      });
      if (res.ok) {
        setText('');
        await fetchComments();
      }
    } catch (err) { console.error('[ProposalComments] send failed:', err); }
    setSending(false);
  };

  // Suppress unused variable lint — currentFid reserved for future "delete own comment" feature
  void currentFid;

  return (
    <div className="mt-4 border-t border-gray-800 pt-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
        Comments {!loading && `(${comments.length})`}
      </p>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-800" />
              <div className="flex-1 h-8 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-600 mb-3">No comments yet</p>
      ) : (
        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              {c.author?.pfp_url ? (
                <div className="w-6 h-6 relative flex-shrink-0">
                  <Image src={c.author.pfp_url} alt="" fill className="rounded-full object-cover" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] text-gray-400">{c.author?.display_name?.[0]?.toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-medium text-white">{c.author?.display_name || c.author?.username}</span>
                  <span className="text-[10px] text-gray-600">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5 break-words">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          placeholder="Add a comment..."
          maxLength={2000}
          className="flex-1 bg-[#0d1b2a] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || sending}
          className="px-3 py-2 bg-[#f5a623] text-black text-xs font-medium rounded-lg hover:bg-[#ffd700] disabled:opacity-50 transition-colors"
        >
          {sending ? '...' : 'Post'}
        </button>
      </div>
    </div>
  );
}
