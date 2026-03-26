'use client';

import { useState, useEffect } from 'react';

interface Comment {
  id: string;
  fid: number;
  body: string;
  created_at: string;
}

interface EntryCommentsProps {
  entryId: string;
  onCommentAdded: () => void;
}

export default function EntryComments({ entryId, onCommentAdded }: EntryCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [entryId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/library/comments?entry_id=${entryId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || posting) return;

    setPosting(true);
    try {
      const res = await fetch('/api/library/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId, body: body.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setBody('');
        onCommentAdded();
      }
    } catch {
      // silent fail
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading comments...</p>;
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="text-sm">
          <span className="text-gray-400">FID {c.fid}</span>
          <span className="text-gray-600 mx-1">·</span>
          <span className="text-gray-300">{c.body}</span>
        </div>
      ))}

      <form onSubmit={handlePost} className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          maxLength={500}
          className="flex-1 rounded-lg bg-[#1a2a3a] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 focus:ring-[#f5a623]"
        />
        <button
          type="submit"
          disabled={!body.trim() || posting}
          className="rounded-lg bg-[#f5a623] px-3 py-2 text-sm font-medium text-[#0a1628] disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </div>
  );
}
