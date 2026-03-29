'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePlayer } from '@/providers/audio';
import { timeAgoSimple as timeAgo } from '@/lib/format/timeAgo';
import { MusicIcon } from './MusicPageUtils';
import type { TrackType } from '@/types/music';

export type Submission = {
  id: string;
  url: string;
  title: string | null;
  artist: string | null;
  track_type: string;
  submitted_by_username: string;
  submitted_by_display: string | null;
  created_at: string;
  vote_count: number;
  user_voted: boolean;
};

export function SubmissionsSection({
  submissions,
  setSubmissions,
  loading,
  player,
}: {
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
  loading: boolean;
  player: ReturnType<typeof usePlayer>;
}) {
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [artworkCache, setArtworkCache] = useState<Record<string, string>>({});

  const handlePlay = useCallback(async (sub: Submission) => {
    // If already playing this track, toggle pause/resume
    if (player.metadata?.url === sub.url) {
      if (player.isPlaying) {
        player.pause();
      } else {
        player.resume();
      }
      return;
    }

    setLoadingTrackId(sub.id);
    try {
      const res = await fetch(`/api/music/metadata?url=${encodeURIComponent(sub.url)}`);
      if (!res.ok) throw new Error('Metadata fetch failed');
      const metadata = await res.json();

      // Cache artwork for this submission
      if (metadata.artworkUrl) {
        setArtworkCache((prev) => ({ ...prev, [sub.id]: metadata.artworkUrl }));
      }

      player.play(metadata);
    } catch {
      // Fallback: play with basic metadata
      player.play({
        id: sub.id,
        type: sub.track_type as TrackType,
        trackName: sub.title || 'Untitled Track',
        artistName: sub.artist || '',
        artworkUrl: '',
        url: sub.url,
        feedId: `submission-${sub.id}`,
      });
    } finally {
      setLoadingTrackId(null);
    }
  }, [player]);

  const handleVote = useCallback(async (sub: Submission) => {
    if (votingId) return;
    setVotingId(sub.id);

    // Capture previous state for rollback
    const prevVoted = sub.user_voted;
    const prevCount = sub.vote_count;

    // Optimistic update
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === sub.id
          ? {
              ...s,
              user_voted: !s.user_voted,
              vote_count: s.user_voted ? s.vote_count - 1 : s.vote_count + 1,
            }
          : s,
      ),
    );

    try {
      const res = await fetch('/api/music/submissions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: sub.id }),
      });

      if (!res.ok) throw new Error('Vote failed');

      const { voted, voteCount } = await res.json();

      // Reconcile with server truth
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === sub.id
            ? { ...s, user_voted: voted, vote_count: voteCount }
            : s,
        ),
      );
    } catch {
      // Revert optimistic update on error
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === sub.id
            ? { ...s, user_voted: prevVoted, vote_count: prevCount }
            : s,
        ),
      );
    } finally {
      setVotingId(null);
    }
  }, [votingId, setSubmissions]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Community Submissions</h2>
        <Link
          href="/chat"
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors"
        >
          Submit
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#0d1b2a] border border-gray-800 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-800" />
              <div className="w-10 h-10 rounded-lg bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-[#0d1b2a] border border-gray-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f5a623]/10 to-[#f5a623]/5 flex items-center justify-center mx-auto mb-3">
            <MusicIcon className="w-7 h-7 text-[#f5a623]/40" />
          </div>
          <p className="text-sm font-medium text-gray-400">No submissions yet</p>
          <p className="text-xs text-gray-500 mt-1">Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((sub) => {
            const isCurrentTrack = player.metadata?.url === sub.url;
            const isTrackPlaying = isCurrentTrack && player.isPlaying;
            const isTrackLoading = loadingTrackId === sub.id;
            const artwork = artworkCache[sub.id];

            return (
              <div
                key={sub.id}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors ${
                  isCurrentTrack
                    ? 'bg-[#0d1b2a] border-[#f5a623]/30'
                    : 'bg-[#0d1b2a] border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Play button */}
                <button
                  onClick={() => handlePlay(sub)}
                  disabled={isTrackLoading}
                  className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-colors ${
                    isCurrentTrack
                      ? 'bg-[#f5a623] text-[#0a1628]'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                  aria-label={isTrackPlaying ? 'Pause' : 'Play'}
                >
                  {isTrackLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isTrackPlaying ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Artwork 40x40 */}
                <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gradient-to-br from-[#1a2a3a] to-[#0a1628] flex items-center justify-center overflow-hidden">
                  {artwork || (isCurrentTrack && player.metadata?.artworkUrl) ? (
                    <Image
                      src={artwork || player.metadata?.artworkUrl || ''}
                      alt={sub.title || 'Track artwork'}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <MusicIcon className="w-4 h-4 text-[#f5a623]/30" />
                  )}
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${
                    isCurrentTrack ? 'text-[#f5a623]' : 'text-white'
                  }`}>
                    {sub.title || 'Untitled Track'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {sub.artist && (
                      <span className="text-xs text-gray-400 truncate max-w-[120px]">
                        {sub.artist}
                      </span>
                    )}
                    <span className="text-xs text-gray-600 truncate">
                      @{sub.submitted_by_username}
                    </span>
                  </div>
                </div>

                {/* Vote button */}
                <button
                  onClick={() => handleVote(sub)}
                  disabled={votingId === sub.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                    sub.user_voted
                      ? 'bg-[#f5a623]/15 text-[#f5a623]'
                      : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                  }`}
                  aria-label={sub.user_voted ? 'Remove vote' : 'Upvote'}
                >
                  <span className="text-sm">{'\uD83D\uDD25'}</span>
                  {sub.vote_count > 0 && (
                    <span>{sub.vote_count}</span>
                  )}
                </button>

                {/* Time ago */}
                <span className="text-[10px] text-gray-600 flex-shrink-0 hidden sm:block">
                  {timeAgo(sub.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
