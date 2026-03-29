'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlayer } from '@/providers/audio';
import type { FeedTrack } from '@/app/api/music/feed/route';
import type { TrackMetadata } from '@/types/music';
import {
  FarcasterTrackCard,
  PLATFORM_LABELS,
  extractTitleFromText,
  type ResolvedMeta,
} from '@/components/music/FarcasterTrackCard';

const CHANNELS = [
  { id: 'all', label: 'All Farcaster' },
  { id: 'thezao', label: 'ZAO Channel' },
  { id: 'music', label: 'Music Channel' },
] as const;

type ChannelId = (typeof CHANNELS)[number]['id'];

export function FarcasterMusicFeed() {
  const [channel, setChannel] = useState<ChannelId>('all');
  const [tracks, setTracks] = useState<FeedTrack[]>([]);
  const [metadata, setMetadata] = useState<Record<string, ResolvedMeta>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const player = usePlayer();

  const fetchFeed = useCallback(async (ch: ChannelId, cur?: string) => {
    const isMore = !!cur;
    if (isMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({ channel: ch, limit: '15' });
      if (cur) params.set('cursor', cur);
      const res = await fetch(`/api/music/feed?${params}`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      const newTracks = data.tracks as FeedTrack[];

      if (isMore) {
        setTracks((prev) => [...prev, ...newTracks]);
      } else {
        setTracks(newTracks);
      }
      setCursor(data.nextCursor || null);
      setError(false);
      resolveMetadata(newTracks);
    } catch {
      if (!isMore) setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const resolveMetadata = async (feedTracks: FeedTrack[]) => {
    const unique = feedTracks.filter((t) => !metadata[t.musicUrl]);
    const results = await Promise.allSettled(
      unique.slice(0, 10).map(async (t) => {
        const res = await fetch(`/api/music/metadata?url=${encodeURIComponent(t.musicUrl)}`);
        if (!res.ok) return null;
        const meta = await res.json();
        return { url: t.musicUrl, meta };
      }),
    );

    const newMeta: Record<string, ResolvedMeta> = {};
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value?.meta) {
        const { url, meta } = r.value;
        newMeta[url] = {
          title: meta.trackName || '',
          artist: meta.artistName || '',
          artwork: meta.artworkUrl || '',
          streamUrl: meta.streamUrl,
        };
      }
    }
    if (Object.keys(newMeta).length > 0) {
      setMetadata((prev) => ({ ...prev, ...newMeta }));
    }
  };

  useEffect(() => { fetchFeed(channel); }, [channel, fetchFeed]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el || !cursor) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore && cursor) {
          fetchFeed(channel, cursor);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, loadingMore, channel, fetchFeed]);

  const handlePlay = (track: FeedTrack) => {
    const meta = metadata[track.musicUrl];
    const trackMeta: TrackMetadata = {
      id: track.castHash,
      type: track.platform,
      trackName: meta?.title || extractTitleFromText(track.castText),
      artistName: meta?.artist || track.authorUsername,
      artworkUrl: meta?.artwork || '',
      url: track.musicUrl,
      streamUrl: meta?.streamUrl,
      feedId: track.castHash,
    };
    player.play(trackMeta);
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        Discover on Farcaster
      </h2>

      {/* Channel Tabs */}
      <div className="flex gap-2 mb-4">
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            onClick={() => { setChannel(ch.id); setCursor(null); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              channel === ch.id
                ? 'bg-[#f5a623] text-[#0a1628]'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {ch.label}
          </button>
        ))}
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-white/10" />
                <div className="h-2.5 w-1/3 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Failed to load music feed.</p>
          <button onClick={() => fetchFeed(channel)} className="mt-2 text-xs text-[#f5a623] hover:underline">
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && tracks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No music found in this channel</p>
        </div>
      )}

      {/* Track List */}
      {!loading && !error && tracks.length > 0 && (
        <div className="space-y-2">
          {tracks.map((track) => (
            <FarcasterTrackCard
              key={track.castHash}
              track={track}
              meta={metadata[track.musicUrl]}
              platformInfo={PLATFORM_LABELS[track.platform] || PLATFORM_LABELS.audio}
              onPlay={() => handlePlay(track)}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {cursor && <div ref={observerRef} className="h-8" />}

      {/* Loading more */}
      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-[#f5a623]/30 border-t-[#f5a623] rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
