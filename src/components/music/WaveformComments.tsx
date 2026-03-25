'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Comment {
  id: string;
  username: string;
  comment: string;
  timestampMs: number;
  createdAt: string;
}

interface WaveformCommentsProps {
  songUrl: string;
  duration: number;
  position: number;
  className?: string;
}

export function WaveformComments({ songUrl, duration, position, className = '' }: WaveformCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [hoveredComment, setHoveredComment] = useState<Comment | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Fetch comments on mount
  useEffect(() => {
    if (!songUrl) return;
    fetch(`/api/music/comments?url=${encodeURIComponent(songUrl)}`)
      .then((res) => (res.ok ? res.json() : { comments: [] }))
      .then((data) => setComments(data.comments || []))
      .catch(() => {});
  }, [songUrl]);

  // Focus input when adding
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/music/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: songUrl,
          comment: newComment.trim(),
          timestampMs: Math.round(position),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment].sort((a, b) => a.timestampMs - b.timestampMs));
        setNewComment('');
        setIsAdding(false);
      }
    } catch {
      // Silent fail
    } finally {
      setIsSubmitting(false);
    }
  }, [songUrl, newComment, position, isSubmitting]);

  const handleDeleteComment = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/music/comments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
        setHoveredComment(null);
      }
    } catch {
      // Silent fail
    }
  }, []);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!duration || duration <= 0) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Timeline bar with comment markers */}
      <div ref={timelineRef} className="relative h-8 flex items-end">
        {/* Track background */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-full" />

        {/* Playback progress */}
        <div
          className="absolute bottom-0 left-0 h-1 bg-[#f5a623]/30 rounded-full"
          style={{ width: `${Math.min((position / duration) * 100, 100)}%` }}
        />

        {/* Comment markers */}
        {comments.map((c) => {
          const leftPct = Math.min((c.timestampMs / duration) * 100, 100);
          return (
            <div
              key={c.id}
              className="absolute bottom-0 -translate-x-1/2 cursor-pointer group"
              style={{ left: `${leftPct}%` }}
              onMouseEnter={() => setHoveredComment(c)}
              onMouseLeave={() => setHoveredComment(null)}
              onTouchStart={() => setHoveredComment(c)}
            >
              {/* Marker dot */}
              <div className="w-2.5 h-2.5 rounded-full bg-[#f5a623] border border-[#0a1628] shadow-sm hover:scale-150 transition-transform mb-[-2px]" />

              {/* Floating bubble on hover */}
              {hoveredComment?.id === c.id && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 min-w-[160px] max-w-[240px] pointer-events-auto">
                  <div className="bg-gray-900/95 border border-white/10 rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-medium text-[#f5a623] truncate">
                        {c.username}
                      </span>
                      <span className="text-[9px] text-gray-500 flex-shrink-0">
                        {formatTime(c.timestampMs)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-200 break-words leading-relaxed">
                      {c.comment}
                    </p>
                    {/* Delete button — shows for all (API enforces ownership) */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteComment(c.id); }}
                      className="mt-1.5 text-[9px] text-gray-500 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  {/* Arrow */}
                  <div className="w-2 h-2 bg-gray-900/95 border-b border-r border-white/10 rotate-45 mx-auto -mt-1" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add comment UI */}
      <div className="mt-2 flex items-center gap-2">
        {isAdding ? (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] text-gray-500 flex-shrink-0 tabular-nums">
              @{formatTime(position)}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddComment();
                if (e.key === 'Escape') { setIsAdding(false); setNewComment(''); }
              }}
              maxLength={280}
              placeholder="Add a comment..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-[#f5a623]/50 transition-colors"
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || isSubmitting}
              className="text-xs text-[#f5a623] hover:text-[#ffd700] disabled:opacity-40 transition-colors flex-shrink-0"
            >
              {isSubmitting ? '...' : 'Post'}
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewComment(''); }}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-[#f5a623] transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Comment at {formatTime(position)}
          </button>
        )}
        {comments.length > 0 && !isAdding && (
          <span className="text-[10px] text-gray-600 ml-auto">
            {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
