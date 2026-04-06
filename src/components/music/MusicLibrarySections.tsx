'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePlayer } from '@/providers/audio';
import { ArtworkImage } from '@/components/music/ArtworkImage';
import { timeAgoSimple as timeAgo } from '@/lib/format/timeAgo';
import { PlayingBars } from './MusicPageUtils';
import type { TrackType } from '@/types/music';

// ── Liked Songs Section ─────────────────────────────────────────────────

type LikedSong = {
  id: string;
  url: string;
  platform: string;
  title: string;
  artist: string | null;
  artwork_url: string | null;
  stream_url: string | null;
  duration: number;
  created_at: string;
};

export function LikedSongsSection() {
  const [songs, setSongs] = useState<LikedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const player = usePlayer();

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/music/library/like?list=true', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((data) => {
        setSongs(data.songs || []);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const handlePlay = useCallback(async (song: LikedSong) => {
    if (player.metadata?.url === song.url) {
      if (player.isPlaying) player.pause();
      else player.resume();
      return;
    }

    setLoadingTrackId(song.id);
    try {
      const res = await fetch(`/api/music/metadata?url=${encodeURIComponent(song.url)}`);
      if (!res.ok) throw new Error('Metadata fetch failed');
      const metadata = await res.json();
      player.play(metadata);
    } catch {
      player.play({
        id: song.id,
        type: (song.platform || 'audio') as TrackType,
        trackName: song.title || 'Untitled Track',
        artistName: song.artist || '',
        artworkUrl: song.artwork_url || '',
        url: song.url,
        streamUrl: song.stream_url || (song.platform === 'audius' ? `https://api.audius.co/v1/tracks/${song.id}/stream?app_name=ZAO-OS` : undefined),
        feedId: `liked-${song.id}`,
      });
    } finally {
      setLoadingTrackId(null);
    }
  }, [player]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <h2 className="text-lg font-bold text-white">Liked Songs</h2>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#0d1b2a] border border-white/[0.08] animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error || songs.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-[#0d1b2a] border border-white/[0.08]">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-red-400/40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-400">No liked songs yet</p>
          <p className="text-xs text-gray-500 mt-1">Tap the heart on any track</p>
        </div>
      ) : (
        <div className="space-y-2">
          {songs.map((song) => {
            const isCurrentTrack = player.metadata?.url === song.url;
            const isTrackPlaying = isCurrentTrack && player.isPlaying;
            const isTrackLoading = loadingTrackId === song.id;

            return (
              <button
                key={song.id}
                onClick={() => handlePlay(song)}
                disabled={isTrackLoading}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                  isCurrentTrack
                    ? 'bg-[#0d1b2a] border-[#f5a623]/30'
                    : 'bg-[#0d1b2a] border-white/[0.08] hover:border-white/[0.08]'
                }`}
              >
                {/* Artwork */}
                <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-[#1a2a3a] to-[#0a1628] relative">
                  <ArtworkImage
                    src={song.artwork_url}
                    alt={song.title || 'Track artwork'}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                  {isTrackPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <PlayingBars />
                    </div>
                  )}
                  {isTrackLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${
                    isCurrentTrack ? 'text-[#f5a623]' : 'text-white'
                  }`}>
                    {song.title || 'Untitled Track'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {song.artist && (
                      <span className="text-xs text-gray-400 truncate max-w-[150px]">
                        {song.artist}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded capitalize flex-shrink-0">
                      {song.platform === 'applemusic' ? 'Apple Music' : song.platform === 'soundxyz' ? 'Sound.xyz' : song.platform}
                    </span>
                  </div>
                </div>

                {/* Heart icon (filled) */}
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── History Section ─────────────────────────────────────────────────────

type HistorySong = {
  id: string;
  url: string;
  platform: string;
  title: string;
  artist: string | null;
  artwork_url: string | null;
  stream_url: string | null;
  duration: number;
  play_count: number;
  last_played_at: string | null;
  created_at: string;
};

export function HistorySection() {
  const [songs, setSongs] = useState<HistorySong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const player = usePlayer();

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/music/library?sort=played&limit=20', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((data) => {
        // Filter to only songs that have been played (have last_played_at)
        const played = (data.songs || []).filter((s: HistorySong) => s.last_played_at);
        setSongs(played);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const handlePlay = useCallback(async (song: HistorySong) => {
    if (player.metadata?.url === song.url) {
      if (player.isPlaying) player.pause();
      else player.resume();
      return;
    }

    setLoadingTrackId(song.id);
    try {
      const res = await fetch(`/api/music/metadata?url=${encodeURIComponent(song.url)}`);
      if (!res.ok) throw new Error('Metadata fetch failed');
      const metadata = await res.json();
      player.play(metadata);
    } catch {
      player.play({
        id: song.id,
        type: (song.platform || 'audio') as TrackType,
        trackName: song.title || 'Untitled Track',
        artistName: song.artist || '',
        artworkUrl: song.artwork_url || '',
        url: song.url,
        streamUrl: song.stream_url || undefined,
        feedId: `history-${song.id}`,
      });
    } finally {
      setLoadingTrackId(null);
    }
  }, [player]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-lg font-bold text-white">Listening History</h2>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#0d1b2a] border border-white/[0.08] animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error || songs.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-[#0d1b2a] border border-white/[0.08]">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f5a623]/10 to-[#f5a623]/5 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-[#f5a623]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-400">No listening history yet</p>
          <p className="text-xs text-gray-500 mt-1">Play some tracks to see them here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {songs.map((song) => {
            const isCurrentTrack = player.metadata?.url === song.url;
            const isTrackPlaying = isCurrentTrack && player.isPlaying;
            const isTrackLoading = loadingTrackId === song.id;

            return (
              <button
                key={song.id}
                onClick={() => handlePlay(song)}
                disabled={isTrackLoading}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                  isCurrentTrack
                    ? 'bg-[#0d1b2a] border-[#f5a623]/30'
                    : 'bg-[#0d1b2a] border-white/[0.08] hover:border-white/[0.08]'
                }`}
              >
                {/* Artwork */}
                <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-[#1a2a3a] to-[#0a1628] relative">
                  <ArtworkImage
                    src={song.artwork_url}
                    alt={song.title || 'Track artwork'}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                  {isTrackPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <PlayingBars />
                    </div>
                  )}
                  {isTrackLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${
                    isCurrentTrack ? 'text-[#f5a623]' : 'text-white'
                  }`}>
                    {song.title || 'Untitled Track'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {song.artist && (
                      <span className="text-xs text-gray-400 truncate max-w-[150px]">
                        {song.artist}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded capitalize flex-shrink-0">
                      {song.platform === 'applemusic' ? 'Apple Music' : song.platform === 'soundxyz' ? 'Sound.xyz' : song.platform}
                    </span>
                  </div>
                </div>

                {/* Last played time */}
                <div className="flex flex-col items-end flex-shrink-0">
                  {song.last_played_at && (
                    <span className="text-[10px] text-gray-500">
                      {timeAgo(song.last_played_at)}
                    </span>
                  )}
                  {song.play_count > 1 && (
                    <span className="text-[10px] text-gray-600 mt-0.5">
                      {song.play_count} plays
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
