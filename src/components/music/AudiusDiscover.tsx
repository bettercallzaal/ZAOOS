'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/providers/audio';
import { useQueue } from '@/contexts/QueueContext';
import {
  useAudiusTrending,
  useAudiusUnderground,
  useAudiusSearch,
  getStreamUrl,
  type AudiusTrack,
} from '@/hooks/useAudius';
import type { TrackMetadata } from '@/types/music';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GENRES = [
  'All',
  'Electronic',
  'Hip-Hop/Rap',
  'R&B/Soul',
  'Pop',
  'Rock',
  'Lo-fi',
  'Jazz',
  'Classical',
  'Latin',
  'Ambient',
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function toTrackMetadata(track: AudiusTrack): TrackMetadata {
  return {
    id: track.id,
    type: 'audius' as const,
    trackName: track.title,
    artistName: track.user.name,
    artworkUrl: track.artwork?.['480x480'] || track.artwork?.['150x150'] || '',
    url: `https://audius.co${track.permalink}`,
    streamUrl: getStreamUrl(track.id),
    feedId: `audius-${track.id}`,
  };
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AudiusDiscover() {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queueToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (queueToastTimerRef.current) clearTimeout(queueToastTimerRef.current); }, []);

  const player = usePlayer();
  const { addToQueue } = useQueue();
  const trending = useAudiusTrending(selectedGenre);
  const underground = useAudiusUnderground();
  const { results: searchResults, loading: searchLoading, search } = useAudiusSearch();
  const [queueToast, setQueueToast] = useState<string | null>(null);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => search(value), 400);
    },
    [search],
  );

  const handlePlay = useCallback(
    (track: AudiusTrack) => {
      player.play(toTrackMetadata(track));
    },
    [player],
  );

  const handleAddToQueue = useCallback(
    (track: AudiusTrack) => {
      addToQueue(toTrackMetadata(track));
      setQueueToast('Added to queue');
      if (queueToastTimerRef.current) clearTimeout(queueToastTimerRef.current);
      queueToastTimerRef.current = setTimeout(() => setQueueToast(null), 1500);
    },
    [addToQueue],
  );

  return (
    <div className="space-y-8 relative">
      {/* Queue toast */}
      {queueToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#f5a623] text-[#0a1628] text-sm font-medium rounded-xl shadow-lg shadow-[#f5a623]/20 animate-fade-in pointer-events-none">
          {queueToast}
        </div>
      )}

      {/* ── Section Header ───────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🔍</span> Discover on Audius
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Browse trending and underground tracks from Audius
        </p>
      </div>

      {/* ── Search ───────────────────────────────────────────────── */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search Audius tracks..."
          className="w-full px-4 py-3 pl-10 rounded-xl bg-white/5 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623]/50 focus:ring-1 focus:ring-[#f5a623]/30 transition-all"
        />
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      </div>

      {/* ── Search Results ───────────────────────────────────────── */}
      {searchQuery.trim() && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Search Results
          </h3>
          {searchLoading ? (
            <TrackListSkeleton count={4} />
          ) : searchResults.length === 0 ? (
            <EmptyState message="No tracks found" />
          ) : (
            <div className="space-y-2">
              {searchResults.slice(0, 20).map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isPlaying={player.metadata?.id === track.id && player.isPlaying}
                  onPlay={handlePlay}
                  onAddToQueue={handleAddToQueue}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Genre Filter Bar ─────────────────────────────────────── */}
      {!searchQuery.trim() && (
        <>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedGenre === genre
                    ? 'bg-[#f5a623] text-[#0a1628] shadow-md shadow-[#f5a623]/20'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* ── Trending Tracks ──────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Trending{selectedGenre !== 'All' ? ` — ${selectedGenre}` : ''}
            </h3>
            {trending.isLoading ? (
              <TrackListSkeleton count={8} />
            ) : trending.error ? (
              <EmptyState message="Failed to load trending tracks" />
            ) : !trending.data?.length ? (
              <EmptyState message="No trending tracks found" />
            ) : (
              <div className="space-y-2">
                {trending.data.slice(0, 20).map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    isPlaying={player.metadata?.id === track.id && player.isPlaying}
                    onPlay={handlePlay}
                    onAddToQueue={handleAddToQueue}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Underground / Emerging ───────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Underground
            </h3>
            {underground.isLoading ? (
              <UndergroundSkeleton />
            ) : underground.error ? (
              <EmptyState message="Failed to load underground tracks" />
            ) : !underground.data?.length ? (
              <EmptyState message="No underground tracks found" />
            ) : (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {underground.data.slice(0, 15).map((track) => (
                  <UndergroundCard
                    key={track.id}
                    track={track}
                    isPlaying={player.metadata?.id === track.id && player.isPlaying}
                    onPlay={handlePlay}
                    onAddToQueue={handleAddToQueue}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Track Card — list item style (trending + search results)
// ---------------------------------------------------------------------------

function TrackCard({
  track,
  isPlaying,
  onPlay,
  onAddToQueue,
}: {
  track: AudiusTrack;
  isPlaying: boolean;
  onPlay: (track: AudiusTrack) => void;
  onAddToQueue: (track: AudiusTrack) => void;
}) {
  const artwork = track.artwork?.['480x480'] || track.artwork?.['150x150'];

  return (
    <div className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
      {/* Play area */}
      <button
        onClick={() => onPlay(track)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        {/* Artwork */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
          {artwork ? (
            <Image
              src={artwork}
              alt={track.title}
              fill
              className="object-cover"
              unoptimized
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a2a3a] to-[#0a1628]">
              <MusicNoteIcon className="w-6 h-6 text-[#f5a623]/40" />
            </div>
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
            {isPlaying ? (
              <PlayingBars />
            ) : (
              <PlayIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {track.title}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {track.user.name}
          </p>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
            <span className="flex items-center gap-0.5">
              <PlayCountIcon className="w-3 h-3" />
              {formatCount(track.play_count)}
            </span>
            <span className="flex items-center gap-0.5">
              <HeartIcon className="w-3 h-3" />
              {formatCount(track.favorite_count)}
            </span>
            <span>{formatDuration(track.duration)}</span>
          </div>
        </div>
      </button>

      {/* Add to queue button */}
      <button
        onClick={(e) => { e.stopPropagation(); onAddToQueue(track); }}
        className="flex-shrink-0 p-2 text-gray-500 hover:text-[#f5a623] hover:bg-[#f5a623]/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label={`Add ${track.title} to queue`}
        title="Add to queue"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {/* Playing indicator */}
      {isPlaying && (
        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[#f5a623] animate-pulse" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Underground Card — horizontal scroll card style
// ---------------------------------------------------------------------------

function UndergroundCard({
  track,
  isPlaying,
  onPlay,
  onAddToQueue,
}: {
  track: AudiusTrack;
  isPlaying: boolean;
  onPlay: (track: AudiusTrack) => void;
  onAddToQueue: (track: AudiusTrack) => void;
}) {
  const artwork = track.artwork?.['480x480'] || track.artwork?.['150x150'];

  return (
    <div className="flex-shrink-0 w-36 sm:w-40 group text-left">
      {/* Artwork */}
      <button
        onClick={() => onPlay(track)}
        className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-lg overflow-hidden bg-gray-800"
      >
        {artwork ? (
          <Image
            src={artwork}
            alt={track.title}
            fill
            className="object-cover"
            unoptimized
            sizes="160px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a2a3a] to-[#0a1628]">
            <MusicNoteIcon className="w-10 h-10 text-[#f5a623]/40" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
          {isPlaying ? (
            <PlayingBars />
          ) : (
            <PlayIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
        {/* Add to queue overlay button */}
        <button
          onClick={(e) => { e.stopPropagation(); onAddToQueue(track); }}
          className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-[#f5a623] text-white hover:text-[#0a1628] rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all z-10"
          aria-label={`Add ${track.title} to queue`}
          title="Add to queue"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </button>

      {/* Info */}
      <button onClick={() => onPlay(track)} className="w-full text-left">
        <p className="text-sm font-semibold text-white truncate mt-2">
          {track.title}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {track.user.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
          <span>{formatCount(track.play_count)} plays</span>
          <span>{formatDuration(track.duration)}</span>
        </div>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Loaders
// ---------------------------------------------------------------------------

function TrackListSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-gray-700/50 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700/50 rounded w-3/4" />
            <div className="h-3 bg-gray-700/30 rounded w-1/2" />
            <div className="h-2 bg-gray-700/20 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function UndergroundSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-36 sm:w-40 animate-pulse">
          <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-lg bg-gray-700/50" />
          <div className="h-4 bg-gray-700/50 rounded w-3/4 mt-2" />
          <div className="h-3 bg-gray-700/30 rounded w-1/2 mt-1" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <MusicNoteIcon className="w-10 h-10 text-gray-600 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function MusicNoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

function PlayCountIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function PlayingBars() {
  return (
    <div className="flex items-end gap-[2px] h-4">
      <div className="w-[3px] bg-[#f5a623] rounded-full animate-[bounce_0.6s_ease-in-out_infinite]" style={{ height: '60%' }} />
      <div className="w-[3px] bg-[#f5a623] rounded-full animate-[bounce_0.6s_ease-in-out_infinite_0.15s]" style={{ height: '100%' }} />
      <div className="w-[3px] bg-[#f5a623] rounded-full animate-[bounce_0.6s_ease-in-out_infinite_0.3s]" style={{ height: '40%' }} />
    </div>
  );
}
