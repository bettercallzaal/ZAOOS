'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePlayer } from '@/providers/audio';
import { ArtworkImage } from '@/components/music/ArtworkImage';
import type { TrackType } from '@/types/music';

// ── Types ─────────────────────────────────────────────────────────────────────

type Nomination = {
  id: string;
  track_url: string;
  track_title: string | null;
  track_artist: string | null;
  track_type: string | null;
  artwork_url: string | null;
  nominated_by_fid: number;
  nominated_by_username: string | null;
  votes_count: number;
  selected_date: string | null;
  created_at: string;
  user_voted: boolean;
};

type TrackOfDayData = {
  selected: Nomination | null;
  nominations: Nomination[];
  isPastCutoff: boolean;
  today: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function platformLabel(type: string | null): string {
  switch (type) {
    case 'spotify': return 'Spotify';
    case 'applemusic': return 'Apple Music';
    case 'soundcloud': return 'SoundCloud';
    case 'youtube': return 'YouTube';
    case 'tidal': return 'Tidal';
    case 'bandcamp': return 'Bandcamp';
    case 'audius': return 'Audius';
    case 'soundxyz': return 'Sound.xyz';
    case 'audio': return 'Audio';
    default: return type || 'Link';
  }
}

function getCountdownToEST6pm(): string {
  // 6pm EST = 23:00 UTC (approximate; handles EDT as well enough)
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const cutoff = new Date(`${today}T23:00:00.000Z`);

  if (now >= cutoff) return 'Selection closing soon';

  const diff = cutoff.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m until selection`;
  return `${minutes}m until selection`;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function TrackOfTheDay() {
  const [data, setData] = useState<TrackOfDayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [showNominate, setShowNominate] = useState(false);
  const [nominateUrl, setNominateUrl] = useState('');
  const [nominateTitle, setNominateTitle] = useState('');
  const [nominateArtist, setNominateArtist] = useState('');
  const [nominateArtwork, setNominateArtwork] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(getCountdownToEST6pm);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  const player = usePlayer();

  // ── Fetch data ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/music/track-of-day');
      if (!res.ok) throw new Error('Failed to fetch');
      const json: TrackOfDayData = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError('Failed to load Track of the Day');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Countdown timer
  useEffect(() => {
    if (data?.selected) return; // no countdown needed
    const interval = setInterval(() => {
      setCountdown(getCountdownToEST6pm());
    }, 60_000);
    return () => clearInterval(interval);
  }, [data?.selected]);

  // ── Vote handler ────────────────────────────────────────────────────────────

  const handleVote = async (trackId: string) => {
    if (votingId) return;
    setVotingId(trackId);

    try {
      const res = await fetch('/api/music/track-of-day/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Vote failed');
      }

      const { voted, voteCount } = await res.json();

      // Update local state optimistically
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          nominations: prev.nominations.map((n) =>
            n.id === trackId
              ? { ...n, user_voted: voted, votes_count: voteCount }
              : n,
          ),
        };
      });
    } catch (err) {
      console.error('Vote error:', err);
    } finally {
      setVotingId(null);
    }
  };

  // ── Nominate handler ────────────────────────────────────────────────────────

  const handleNominate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/music/track-of-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: nominateUrl.trim(),
          title: nominateTitle.trim(),
          artist: nominateArtist.trim(),
          artworkUrl: nominateArtwork.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Nomination failed');
      }

      // Reset form and refresh
      setNominateUrl('');
      setNominateTitle('');
      setNominateArtist('');
      setNominateArtwork('');
      setShowNominate(false);
      await fetchData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to nominate');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Play handler ────────────────────────────────────────────────────────────

  const handlePlay = async (nomination: Nomination) => {
    if (loadingTrackId) return;
    setLoadingTrackId(nomination.id);

    try {
      // Try fetching rich metadata first
      const res = await fetch(`/api/music/metadata?url=${encodeURIComponent(nomination.track_url)}`);
      if (!res.ok) throw new Error('Metadata fetch failed');
      const metadata = await res.json();
      player.play(metadata);
    } catch {
      // Fallback: play with basic metadata from nomination
      player.play({
        id: nomination.id,
        type: (nomination.track_type || 'audio') as TrackType,
        trackName: nomination.track_title || 'Untitled Track',
        artistName: nomination.track_artist || '',
        artworkUrl: nomination.artwork_url || '',
        url: nomination.track_url,
        feedId: `totd-${nomination.id}`,
      });
    } finally {
      setLoadingTrackId(null);
    }
  };

  // ── Loading / Error states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-2xl bg-[#0d1b2a] border border-[#1a2a3a] p-6 animate-pulse">
        <div className="h-6 w-48 bg-[#1a2a3a] rounded mb-4" />
        <div className="h-32 bg-[#1a2a3a] rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-[#1a2a3a] rounded" />
          <div className="h-16 bg-[#1a2a3a] rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-[#0d1b2a] border border-red-500/30 p-6 text-center">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={fetchData}
          className="mt-3 text-sm text-[#f5a623] hover:text-[#ffd700] transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  const selected = data?.selected;
  const nominations = data?.nominations || [];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl bg-[#0d1b2a] border border-[#1a2a3a] overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-[#1a2a3a]">
        <div className="flex items-center gap-2">
          <span className="text-[#f5a623] text-lg">&#9733;</span>
          <h2 className="text-white font-semibold text-base sm:text-lg">Track of the Day</h2>
        </div>
        {!selected && (
          <span className="text-xs sm:text-sm text-white/40">{countdown}</span>
        )}
      </div>

      {/* ── Selected Track (Hero) ──────────────────────────────────────── */}
      {selected ? (
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
            {/* Artwork */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden shrink-0 shadow-lg shadow-[#f5a623]/10">
              <ArtworkImage
                src={selected.artwork_url}
                alt={selected.track_title || 'Track artwork'}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 128px, 160px"
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="text-xs font-medium text-[#f5a623] uppercase tracking-wider mb-1">
                Today&apos;s Pick
              </div>
              <h3 className="text-white text-lg sm:text-xl font-bold truncate">
                {selected.track_title || 'Untitled Track'}
              </h3>
              <p className="text-white/60 text-sm sm:text-base truncate mt-0.5">
                {selected.track_artist || 'Unknown Artist'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a2a3a] text-white/50">
                  {platformLabel(selected.track_type)}
                </span>
                <span className="text-xs text-white/40">
                  {selected.votes_count} vote{selected.votes_count !== 1 ? 's' : ''}
                </span>
                {selected.nominated_by_username && (
                  <span className="text-xs text-white/40">
                    by @{selected.nominated_by_username}
                  </span>
                )}
              </div>

              {/* Play button */}
              <button
                onClick={() => handlePlay(selected)}
                disabled={loadingTrackId === selected.id}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {loadingTrackId === selected.id ? (
                  <span className="w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
                Play
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── No selection yet ────────────────────────────────────────── */
        <div className="p-4 sm:p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#f5a623]/10 mb-3">
            <svg className="w-8 h-8 text-[#f5a623]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <p className="text-white/70 text-sm">Voting in progress</p>
          <p className="text-white/40 text-xs mt-1">
            Nominate and vote for your favorite track
          </p>
        </div>
      )}

      {/* ── Nominations List ───────────────────────────────────────────── */}
      {nominations.length > 0 && (
        <div className="border-t border-[#1a2a3a]">
          <div className="px-4 py-3 sm:px-6">
            <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">
              Nominations ({nominations.length})
            </h3>
          </div>

          <div className="divide-y divide-[#1a2a3a]">
            {nominations.map((nom) => (
              <div
                key={nom.id}
                className="flex items-center gap-3 px-4 py-3 sm:px-6 hover:bg-[#1a2a3a]/50 transition-colors"
              >
                {/* Mini artwork */}
                <button
                  onClick={() => handlePlay(nom)}
                  disabled={loadingTrackId === nom.id}
                  className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 group"
                >
                  <ArtworkImage
                    src={nom.artwork_url}
                    alt={nom.track_title || 'Track'}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {loadingTrackId === nom.id ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {nom.track_title || 'Untitled Track'}
                  </p>
                  <p className="text-white/50 text-xs truncate">
                    {nom.track_artist || 'Unknown Artist'}
                    {nom.nominated_by_username && (
                      <span className="text-white/30"> &middot; @{nom.nominated_by_username}</span>
                    )}
                  </p>
                </div>

                {/* Platform badge */}
                <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-[#1a2a3a] text-white/40 shrink-0">
                  {platformLabel(nom.track_type)}
                </span>

                {/* Vote button */}
                <button
                  onClick={() => handleVote(nom.id)}
                  disabled={votingId === nom.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${
                    nom.user_voted
                      ? 'bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/40'
                      : 'bg-[#1a2a3a] text-white/60 hover:text-white hover:bg-[#1a2a3a]/80 border border-[#1a2a3a]'
                  } disabled:opacity-50`}
                >
                  {votingId === nom.id ? (
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill={nom.user_voted ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  )}
                  {nom.votes_count}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Nominate Button / Form ─────────────────────────────────────── */}
      <div className="border-t border-[#1a2a3a] p-4 sm:p-6">
        {!showNominate ? (
          <button
            onClick={() => setShowNominate(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-[#f5a623]/30 text-[#f5a623] text-sm font-medium hover:bg-[#f5a623]/5 hover:border-[#f5a623]/50 transition-colors"
          >
            + Nominate a Track
          </button>
        ) : (
          <form onSubmit={handleNominate} className="space-y-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">Track URL *</label>
              <input
                type="url"
                value={nominateUrl}
                onChange={(e) => setNominateUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                required
                className="w-full px-3 py-2 rounded-lg bg-[#0a1628] border border-[#1a2a3a] text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#f5a623]/50"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1">Title *</label>
                <input
                  type="text"
                  value={nominateTitle}
                  onChange={(e) => setNominateTitle(e.target.value)}
                  placeholder="Track title"
                  required
                  maxLength={200}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a1628] border border-[#1a2a3a] text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#f5a623]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Artist *</label>
                <input
                  type="text"
                  value={nominateArtist}
                  onChange={(e) => setNominateArtist(e.target.value)}
                  placeholder="Artist name"
                  required
                  maxLength={200}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a1628] border border-[#1a2a3a] text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#f5a623]/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Artwork URL (optional)</label>
              <input
                type="url"
                value={nominateArtwork}
                onChange={(e) => setNominateArtwork(e.target.value)}
                placeholder="https://example.com/artwork.jpg"
                className="w-full px-3 py-2 rounded-lg bg-[#0a1628] border border-[#1a2a3a] text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#f5a623]/50"
              />
            </div>

            {submitError && (
              <p className="text-red-400 text-xs">{submitError}</p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Nominate'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNominate(false);
                  setSubmitError(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#1a2a3a] text-white/60 text-sm hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
