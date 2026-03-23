'use client';

import { useState, useEffect, useCallback } from 'react';

interface PendingSubmission {
  id: string;
  url: string;
  title: string | null;
  artist: string | null;
  note: string | null;
  track_type: string;
  channel: string;
  submitted_by_username: string;
  submitted_by_display: string | null;
  submitted_by_fid: number;
  created_at: string;
  status: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SubmissionReviewQueue() {
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch('/api/music/submissions?status=pending&limit=100');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch {
      console.error('Failed to load pending submissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleReview = async (submissionId: string, action: 'approve' | 'reject') => {
    setReviewingId(submissionId);
    setFeedback(null);

    try {
      const res = await fetch('/api/music/submissions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId, action }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Review failed');
      }

      // Remove from list
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      setFeedback({
        type: 'success',
        msg: `Submission ${action === 'approve' ? 'approved' : 'rejected'}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Failed to review',
      });
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0d1b2a] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-white/10" />
          <div className="h-20 rounded bg-white/10" />
          <div className="h-20 rounded bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1b2a] p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white">Submission Review Queue</h2>
        {submissions.length > 0 && (
          <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#f5a623] px-2 text-xs font-bold text-black">
            {submissions.length}
          </span>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            feedback.type === 'success'
              ? 'bg-green-500/20 text-green-300'
              : 'bg-red-500/20 text-red-300'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Empty state */}
      {submissions.length === 0 && (
        <p className="text-sm text-gray-400">No pending submissions to review.</p>
      )}

      {/* Submission cards */}
      <div className="space-y-3">
        {submissions.map((sub) => {
          const isReviewing = reviewingId === sub.id;
          return (
            <div
              key={sub.id}
              className="rounded-lg border border-white/5 bg-[#1a2a3a] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                {/* Track info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">
                    {sub.title || 'Untitled'}
                    {sub.artist && (
                      <span className="ml-1 text-gray-400">by {sub.artist}</span>
                    )}
                  </p>
                  <a
                    href={sub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block truncate text-xs text-[#f5a623] hover:underline"
                  >
                    {sub.url}
                  </a>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span>
                      Submitted by{' '}
                      <span className="text-gray-300">
                        {sub.submitted_by_display || sub.submitted_by_username}
                      </span>
                    </span>
                    <span className="text-white/20">|</span>
                    <span>{timeAgo(sub.created_at)}</span>
                    <span className="text-white/20">|</span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5">{sub.track_type}</span>
                  </div>
                  {sub.note && (
                    <p className="mt-2 text-xs italic text-gray-400">&ldquo;{sub.note}&rdquo;</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleReview(sub.id, 'approve')}
                    disabled={isReviewing}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
                  >
                    {isReviewing ? '...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReview(sub.id, 'reject')}
                    disabled={isReviewing}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                  >
                    {isReviewing ? '...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
