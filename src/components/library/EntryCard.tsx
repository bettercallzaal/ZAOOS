'use client';

import { useState } from 'react';
import EntryComments from './EntryComments';

interface Entry {
  id: string;
  fid: number;
  url: string | null;
  topic: string;
  note: string | null;
  tags: string[];
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  ai_summary: string | null;
  ai_status: 'pending' | 'complete' | 'failed';
  upvote_count: number;
  comment_count: number;
  created_at: string;
}

interface EntryCardProps {
  entry: Entry;
  voted: boolean;
  onVote: (entryId: string) => void;
  isAdmin?: boolean;
  onDelete?: (entryId: string) => void;
}

export default function EntryCard({ entry, voted, onVote, isAdmin, onDelete }: EntryCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [voteCount, setVoteCount] = useState(entry.upvote_count);
  const [hasVoted, setHasVoted] = useState(voted);
  const [commentCount, setCommentCount] = useState(entry.comment_count);

  const handleVote = async () => {
    setHasVoted(!hasVoted);
    setVoteCount((c) => (hasVoted ? c - 1 : c + 1));
    onVote(entry.id);
  };

  const timeAgo = getTimeAgo(entry.created_at);

  return (
    <div className="rounded-xl bg-[#0d1b2a] p-4 ring-1 ring-gray-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>FID {entry.fid}</span>
          <span>·</span>
          <span>{timeAgo}</span>
        </div>
        {isAdmin && onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        )}
      </div>

      <h3 className="text-lg font-semibold text-white mb-1">
        {entry.url ? (
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#f5a623] transition-colors"
          >
            {entry.topic}
          </a>
        ) : (
          entry.topic
        )}
      </h3>

      {entry.url && (
        <p className="text-xs text-gray-500 mb-2 truncate">{entry.url}</p>
      )}

      {entry.og_image && (
        <div className="mb-3 overflow-hidden rounded-lg">
          <img
            src={entry.og_image}
            alt=""
            className="w-full h-40 object-cover"
            loading="lazy"
          />
        </div>
      )}

      {entry.note && (
        <p className="text-sm text-gray-300 mb-3 italic">
          &ldquo;{entry.note}&rdquo;
        </p>
      )}

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#1a2a3a] px-2.5 py-0.5 text-xs text-[#f5a623]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mb-3 rounded-lg bg-[#0a1628] p-3 ring-1 ring-gray-800">
        <p className="text-xs font-medium text-[#f5a623] mb-1">AI Analysis</p>
        {entry.ai_status === 'pending' && (
          <p className="text-sm text-gray-400 animate-pulse">Generating summary...</p>
        )}
        {entry.ai_status === 'failed' && (
          <p className="text-sm text-gray-500">Summary unavailable</p>
        )}
        {entry.ai_status === 'complete' && entry.ai_summary && (
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{entry.ai_summary}</p>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={handleVote}
          className={`flex items-center gap-1 transition-colors ${
            hasVoted ? 'text-[#f5a623]' : 'text-gray-400 hover:text-[#f5a623]'
          }`}
        >
          <span>{hasVoted ? '▲' : '△'}</span>
          <span>{voteCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {commentCount} comment{commentCount !== 1 ? 's' : ''}
        </button>
      </div>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <EntryComments
            entryId={entry.id}
            onCommentAdded={() => setCommentCount((c) => c + 1)}
          />
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
