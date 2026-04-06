'use client';

import { useState, useEffect } from 'react';
import { usePlayer } from '@/providers/audio';
import { ArtworkImage } from '@/components/music/ArtworkImage';
import { MusicIcon } from './MusicPageUtils';

type AudiusTrendingTrack = {
  id: string;
  title: string;
  artwork: { '150x150'?: string; '480x480'?: string } | null;
  user: { name: string };
  permalink: string;
  duration: number;
};

export function TrendingSection() {
  const [tracks, setTracks] = useState<AudiusTrendingTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const player = usePlayer();

  useEffect(() => {
    const controller = new AbortController();

    fetch('https://api.audius.co/v1/tracks/trending?app_name=ZAO-OS&limit=8', {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((json) => {
        if (json?.data) {
          setTracks(json.data);
        } else {
          setError(true);
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const handlePlay = (track: AudiusTrendingTrack) => {
    const streamUrl = `https://api.audius.co/v1/tracks/${track.id}/stream?app_name=ZAO-OS`;
    player.play({
      id: track.id,
      trackName: track.title,
      artistName: track.user.name,
      artworkUrl: track.artwork?.['480x480'] || track.artwork?.['150x150'] || '',
      streamUrl,
      url: `https://audius.co${track.permalink}`,
      type: 'audius',
      feedId: `trending-${track.id}`,
    });
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Trending on Audius</h2>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[140px] animate-pulse">
              <div className="w-[140px] h-[140px] rounded-xl bg-gray-800 mb-2" />
              <div className="h-3.5 bg-gray-800 rounded w-3/4 mb-1" />
              <div className="h-3 bg-gray-800/60 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error || tracks.length === 0 ? (
        <div className="text-center py-10 rounded-xl bg-[#0d1b2a] border border-white/[0.08]">
          <MusicIcon className="w-8 h-8 text-[#f5a623]/30 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Trending unavailable</p>
          <p className="text-xs text-gray-600 mt-1">Check back later</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
          {tracks.map((track) => {
            const isThisTrack = player.metadata?.feedId === `trending-${track.id}`;
            const isThisPlaying = isThisTrack && player.isPlaying;

            return (
              <button
                key={track.id}
                onClick={() => handlePlay(track)}
                className="flex-shrink-0 w-[140px] group text-left"
              >
                {/* Album art */}
                <div className={`w-[140px] h-[140px] rounded-xl border mb-2 overflow-hidden relative transition-colors ${
                  isThisTrack
                    ? 'border-[#f5a623]/40 shadow-lg shadow-[#f5a623]/10'
                    : 'border-white/[0.08] group-hover:border-white/[0.08]'
                }`}>
                  <ArtworkImage
                    src={track.artwork?.['480x480'] || track.artwork?.['150x150'] || null}
                    alt={track.title}
                    fill
                    className="object-cover"
                    sizes="140px"
                  />
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                    isThisPlaying ? 'opacity-100 bg-black/40' : 'opacity-0 group-hover:opacity-100 bg-black/30'
                  }`}>
                    {isThisPlaying ? (
                      <div className="flex items-end gap-px">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="w-[3px] bg-[#f5a623] rounded-full animate-bounce"
                            style={{
                              height: `${6 + i * 3}px`,
                              animationDelay: `${i * 0.15}s`,
                              animationDuration: '0.6s',
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#f5a623]/90 flex items-center justify-center">
                        <svg className="w-5 h-5 ml-0.5 text-[#0a1628]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <p className={`text-sm font-medium truncate ${isThisTrack ? 'text-[#f5a623]' : 'text-white'}`}>
                  {track.title}
                </p>
                <p className="text-xs text-gray-500 truncate">{track.user.name}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
