'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

// ── Shared small components ────────────────────────────────────────────

export function MusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

export function PlayingBars() {
  return (
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
  );
}

// ── Track of the Day Banner (above tabs) ──────────────────────────────

export function TrackOfTheDayBanner() {
  const [featured, setFeatured] = useState<{
    track_title: string | null;
    track_artist: string | null;
    artwork_url: string | null;
    track_url: string;
    nominated_by_username: string | null;
    votes_count: number;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/music/track-of-day', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((data) => {
        if (data.selected) {
          setFeatured(data.selected);
        } else if (data.nominations?.length > 0) {
          // Show top nomination as preview
          setFeatured(data.nominations[0]);
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      });
    return () => controller.abort();
  }, []);

  if (!featured) return null;

  return (
    <div className="mb-4 rounded-xl bg-gradient-to-r from-[#f5a623]/10 via-[#0d1b2a] to-[#f5a623]/5 border border-[#f5a623]/20 p-3 sm:p-4">
      <div className="flex items-center gap-3">
        {/* Star icon */}
        <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
          {featured.artwork_url ? (
            <Image
              src={featured.artwork_url}
              alt={featured.track_title || 'Track artwork'}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a2a3a] to-[#0a1628]">
              <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-[#f5a623] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <span className="text-[10px] font-semibold text-[#f5a623] uppercase tracking-wider">
              Track of the Day
            </span>
          </div>
          <p className="text-sm font-semibold text-white truncate mt-0.5">
            {featured.track_title || 'Untitled Track'}
          </p>
          {featured.track_artist && (
            <p className="text-xs text-gray-400 truncate">
              {featured.track_artist}
            </p>
          )}
        </div>

        {/* Arrow linking to the TOTD section */}
        <button
          onClick={() => {
            const el = document.getElementById('section-totd');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="w-8 h-8 flex-shrink-0 rounded-full bg-[#f5a623]/10 flex items-center justify-center text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors"
          aria-label="View Track of the Day"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Skeleton for dynamic TrackOfTheDay loading ────────────────────────

export function TrackOfTheDayTabSkeleton() {
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
