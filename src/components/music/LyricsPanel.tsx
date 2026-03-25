'use client';

import { useState, useEffect, useRef } from 'react';

interface LyricsPanelProps {
  trackName: string;
  artistName: string;
  className?: string;
}

export function LyricsPanel({ trackName, artistName, className = '' }: LyricsPanelProps) {
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trackName || !artistName) {
      setLyrics(null);
      setError(true);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    setLyrics(null);

    const params = new URLSearchParams({
      artist: artistName,
      title: trackName,
    });

    fetch(`/api/music/lyrics?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.lyrics) {
          setLyrics(data.lyrics);
          setSource(data.source || '');
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trackName, artistName]);

  // Auto-scroll to top when lyrics change
  useEffect(() => {
    if (lyrics && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [lyrics]);

  return (
    <div className={`flex flex-col ${className}`}>
      <div
        ref={containerRef}
        className="overflow-y-auto max-h-[50vh] px-6 py-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
      >
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Searching for lyrics...</span>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-gray-500">Lyrics not available for this track</p>
          </div>
        )}

        {!loading && lyrics && (
          <pre className="text-sm text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
            {lyrics}
          </pre>
        )}
      </div>

      {/* Attribution */}
      {!loading && lyrics && source && (
        <div className="px-6 py-2 border-t border-white/5">
          <p className="text-[10px] text-gray-600 text-center">
            Powered by {source}
          </p>
        </div>
      )}
    </div>
  );
}
