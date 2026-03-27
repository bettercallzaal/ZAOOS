'use client';

import { useState, useEffect } from 'react';
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
  downvote_count: number;
  comment_count: number;
  created_at: string;
}

interface Voter {
  fid: number;
  vote_type: string;
}

interface EntryCardProps {
  entry: Entry;
  userVoteType: string | null; // 'up' | 'down' | null
  voters: Voter[];
  onVote: (entryId: string, voteType: 'up' | 'down') => void;
  isAdmin?: boolean;
  onDelete?: (entryId: string) => void;
}

export default function EntryCard({ entry, userVoteType, voters, onVote, isAdmin, onDelete }: EntryCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showVoters, setShowVoters] = useState(false);
  const [upCount, setUpCount] = useState(entry.upvote_count);
  const [downCount, setDownCount] = useState(entry.downvote_count ?? 0);
  const [currentVote, setCurrentVote] = useState<string | null>(userVoteType);
  const [commentCount, setCommentCount] = useState(entry.comment_count);
  const [voting, setVoting] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState(false);

  useEffect(() => {
    setCurrentVote(userVoteType);
  }, [userVoteType]);

  useEffect(() => {
    setUpCount(entry.upvote_count);
    setDownCount(entry.downvote_count ?? 0);
  }, [entry.upvote_count, entry.downvote_count]);

  useEffect(() => {
    setCommentCount(entry.comment_count);
  }, [entry.comment_count]);

  const handleVote = (type: 'up' | 'down') => {
    if (voting) return;
    setVoting(true);

    // Optimistic update
    if (currentVote === type) {
      // Toggle off
      if (type === 'up') setUpCount((c) => c - 1);
      else setDownCount((c) => c - 1);
      setCurrentVote(null);
    } else if (currentVote) {
      // Switching vote
      if (currentVote === 'up') {
        setUpCount((c) => c - 1);
        setDownCount((c) => c + 1);
      } else {
        setDownCount((c) => c - 1);
        setUpCount((c) => c + 1);
      }
      setCurrentVote(type);
    } else {
      // New vote
      if (type === 'up') setUpCount((c) => c + 1);
      else setDownCount((c) => c + 1);
      setCurrentVote(type);
    }

    onVote(entry.id, type);
    setTimeout(() => setVoting(false), 500);
  };

  const timeAgo = getTimeAgo(entry.created_at);
  const upVoters = voters.filter((v) => v.vote_type === 'up');
  const downVoters = voters.filter((v) => v.vote_type === 'down');
  const totalVoters = voters.length;

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

      {entry.og_image && !imgError && (
        <div className="mb-3 overflow-hidden rounded-lg">
          <img
            src={entry.og_image}
            alt=""
            className="w-full h-40 object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
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
          <div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {expandedSummary || entry.ai_summary.length <= 500
                ? entry.ai_summary
                : `${entry.ai_summary.slice(0, 500)}...`}
            </p>
            {entry.ai_summary.length > 500 && (
              <button
                onClick={() => setExpandedSummary(!expandedSummary)}
                className="text-xs text-[#f5a623] mt-1 hover:underline"
              >
                {expandedSummary ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Votes + Comments Actions */}
      <div className="flex items-center gap-4 text-sm">
        {/* Upvote */}
        <button
          onClick={() => handleVote('up')}
          aria-label={currentVote === 'up' ? 'Remove upvote' : 'Upvote'}
          className={`flex items-center gap-1 transition-colors ${
            currentVote === 'up' ? 'text-[#f5a623]' : 'text-gray-400 hover:text-[#f5a623]'
          }`}
        >
          <span>{currentVote === 'up' ? '▲' : '△'}</span>
          <span>{upCount}</span>
        </button>

        {/* Downvote */}
        <button
          onClick={() => handleVote('down')}
          aria-label={currentVote === 'down' ? 'Remove downvote' : 'Downvote'}
          className={`flex items-center gap-1 transition-colors ${
            currentVote === 'down' ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
          }`}
        >
          <span>{currentVote === 'down' ? '▼' : '▽'}</span>
          <span>{downCount}</span>
        </button>

        {/* Voter count — click to see who voted */}
        {totalVoters > 0 && (
          <button
            onClick={() => setShowVoters(!showVoters)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            {totalVoters} voter{totalVoters !== 1 ? 's' : ''}
          </button>
        )}

        {/* Comments */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {commentCount} comment{commentCount !== 1 ? 's' : ''}
        </button>
      </div>

      {/* Voter list */}
      {showVoters && totalVoters > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <p className="text-xs font-medium text-gray-400 mb-2">Votes</p>
          <div className="flex flex-wrap gap-2">
            {upVoters.map((v) => (
              <span
                key={`up-${v.fid}`}
                className="inline-flex items-center gap-1 rounded-full bg-[#1a2a3a] px-2.5 py-1 text-xs"
              >
                <span className="text-[#f5a623]">▲</span>
                <span className="text-gray-300">FID {v.fid}</span>
              </span>
            ))}
            {downVoters.map((v) => (
              <span
                key={`down-${v.fid}`}
                className="inline-flex items-center gap-1 rounded-full bg-[#1a2a3a] px-2.5 py-1 text-xs"
              >
                <span className="text-red-400">▼</span>
                <span className="text-gray-300">FID {v.fid}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
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
