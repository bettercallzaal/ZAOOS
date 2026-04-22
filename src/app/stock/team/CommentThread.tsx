'use client';

import { useEffect, useState } from 'react';

export type CommentEntityType =
  | 'sponsor'
  | 'artist'
  | 'timeline'
  | 'todo'
  | 'note'
  | 'volunteer'
  | 'budget';

interface Comment {
  id: string;
  entity_type: string;
  entity_id: string;
  author: { id: string; name: string } | null;
  body: string;
  created_at: string;
  parent_id: string | null;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function CommentThread({
  entityType,
  entityId,
}: {
  entityType: CommentEntityType;
  entityId: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await fetch(
        `/api/stock/team/comments?entity_type=${entityType}&entity_id=${entityId}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setComments(json.comments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch('/api/stock/team/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          body: trimmed,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Post failed');
      setComments((prev) => [...prev, json.comment]);
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Post failed');
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this comment?')) return;
    const res = await fetch('/api/stock/team/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== id));
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wider text-gray-500">Comments</div>

      {loading ? (
        <div className="text-xs text-gray-500">Loading...</div>
      ) : comments.length === 0 ? (
        <div className="text-xs text-gray-500 italic">No comments yet.</div>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="bg-[#0a1628] border border-white/5 rounded px-3 py-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="text-xs">
                  <span className="text-[#f5a623] font-medium">
                    {c.author?.name ?? 'Unknown'}
                  </span>
                  <span className="text-gray-500 ml-2">{relativeTime(c.created_at)}</span>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-xs text-gray-600 hover:text-red-400"
                  title="Delete (only your own)"
                >
                  x
                </button>
              </div>
              <div className="text-sm text-gray-200 whitespace-pre-wrap break-words">
                {c.body}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handlePost} className="space-y-1.5">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          maxLength={4000}
          className="w-full text-sm bg-[#0a1628] border border-white/10 rounded px-3 py-2 text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-[#f5a623]/40"
        />
        <div className="flex items-center justify-between">
          {error ? (
            <span className="text-xs text-red-400">{error}</span>
          ) : (
            <span className="text-xs text-gray-600">{body.length}/4000</span>
          )}
          <button
            type="submit"
            disabled={!body.trim() || posting}
            className="text-xs px-3 py-1 rounded border border-[#f5a623]/40 text-[#f5a623] hover:bg-[#f5a623]/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
