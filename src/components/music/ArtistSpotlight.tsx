'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePlayer } from '@/providers/audio';
import type { TrackMetadata } from '@/types/music';

interface TopTrack {
  id: string;
  url: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  streamUrl: string | null;
  platform: string;
  playCount: number;
  duration: number | null;
}

interface ArtistData {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string | null;
  coverImageUrl: string | null;
  category: string | null;
  biography: string | null;
  isFeatured: boolean;
  totalRespect: number;
  followerCount: number;
  trackCount: number;
  totalPlays: number;
  topTracks: TopTrack[];
}

interface Props {
  username: string;
  initialData?: ArtistData | null;
  onClose?: () => void;
}

export function ArtistSpotlight({ username, initialData, onClose }: Props) {
  const [artist, setArtist] = useState<ArtistData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const player = usePlayer();

  useEffect(() => {
    if (initialData) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/artists/${encodeURIComponent(username)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (!cancelled && data) setArtist(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [username, initialData]);

  const playTrack = useCallback((track: TopTrack) => {
    const metadata: TrackMetadata = {
      id: track.id,
      type: (track.platform as TrackMetadata['type']) || 'audio',
      trackName: track.title,
      artistName: track.artist,
      artworkUrl: track.artworkUrl || '',
      url: track.url,
      streamUrl: track.streamUrl || undefined,
      feedId: track.id,
    };
    player.play(metadata);
  }, [player]);

  const playAll = useCallback(() => {
    if (!artist?.topTracks.length) return;
    playTrack(artist.topTracks[0]);
  }, [artist, playTrack]);

  if (loading) return <ArtistSpotlightSkeleton />;
  if (!artist) return null;

  return (
    <div className="rounded-2xl overflow-hidden bg-[#0d1b2a] border border-white/10">
      {/* Cover banner */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-br from-[#f5a623]/30 to-[#0d1b2a]">
        {artist.coverImageUrl && (
          <Image
            src={artist.coverImageUrl}
            alt=""
            fill
            className="object-cover opacity-60"
            unoptimized
          />
        )}
        {onClose && (
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Artist info */}
      <div className="px-4 pb-4 -mt-10 relative">
        <div className="flex items-end gap-3 mb-3">
          <div className="w-20 h-20 rounded-full border-4 border-[#0d1b2a] overflow-hidden bg-gray-800 flex-shrink-0">
            {artist.pfpUrl ? (
              <Image src={artist.pfpUrl} alt={artist.displayName} width={80} height={80} className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full bg-[#f5a623]/20 flex items-center justify-center text-2xl text-[#f5a623]">
                {artist.displayName?.[0] || '?'}
              </div>
            )}
          </div>
          <div className="min-w-0 pb-1">
            <h3 className="text-lg font-bold text-white truncate">{artist.displayName}</h3>
            <p className="text-sm text-gray-400 truncate">@{artist.username}</p>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-2 mb-3">
          {artist.category && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-gray-300 capitalize">
              {artist.category}
            </span>
          )}
          {artist.totalRespect > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f5a623]/20 text-[#f5a623] flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              {artist.totalRespect.toLocaleString()}R
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-gray-400">
            {artist.followerCount.toLocaleString()} followers
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-gray-400">
            {artist.trackCount} tracks &middot; {artist.totalPlays.toLocaleString()} plays
          </span>
        </div>

        {/* Bio */}
        {(artist.biography || artist.bio) && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">
            {artist.biography || artist.bio}
          </p>
        )}

        {/* Top Tracks */}
        {artist.topTracks.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top Tracks</h4>
            <div className="space-y-1">
              {artist.topTracks.map((track, i) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
                >
                  <span className="text-xs text-gray-500 w-4 text-right">{i + 1}</span>
                  <div className="w-8 h-8 rounded bg-gray-800 overflow-hidden flex-shrink-0 relative">
                    {track.artworkUrl ? (
                      <Image src={track.artworkUrl} alt="" width={32} height={32} className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{track.title}</p>
                  </div>
                  <span className="text-xs text-gray-500">{(track.playCount || 0).toLocaleString()} plays</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {artist.topTracks.length > 0 && (
            <button
              onClick={playAll}
              className="flex-1 py-2 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-semibold hover:bg-[#f5a623]/90 transition-colors flex items-center justify-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Listen to all
            </button>
          )}
          <Link
            href={`/members/${artist.username}`}
            className="flex-1 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors text-center"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

function ArtistSpotlightSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-[#0d1b2a] border border-white/10 animate-pulse">
      <div className="h-32 sm:h-40 bg-white/5" />
      <div className="px-4 pb-4 -mt-10">
        <div className="flex items-end gap-3 mb-3">
          <div className="w-20 h-20 rounded-full bg-white/10 border-4 border-[#0d1b2a]" />
          <div className="space-y-2 pb-1">
            <div className="h-5 w-32 bg-white/10 rounded" />
            <div className="h-3 w-20 bg-white/5 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-white/5 rounded" />
          <div className="h-3 w-2/3 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
}
