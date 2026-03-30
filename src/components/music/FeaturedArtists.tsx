'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArtistSpotlight } from '@/components/music/ArtistSpotlight';

interface FeaturedArtist {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  coverImageUrl: string | null;
  category: string | null;
  trackCount: number;
}

export function FeaturedArtists() {
  const [artists, setArtists] = useState<FeaturedArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedUsername, setExpandedUsername] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/artists/featured')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled && data?.artists) setArtists(data.artists);
      })
      .catch(() => { if (!cancelled) setError('Failed to load featured artists'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <FeaturedArtistsSkeleton />;
  if (error) return (
    <section>
      <p className="text-red-400 text-sm py-4">{error}</p>
    </section>
  );
  if (artists.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-white">Featured Artists</h2>
        <span className="text-xs text-gray-500">{artists.length} artists</span>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory"
      >
        {artists.map(a => (
          <button
            key={a.fid}
            onClick={() => setExpandedUsername(expandedUsername === a.username ? null : a.username)}
            className="flex-shrink-0 w-[140px] snap-start rounded-xl overflow-hidden bg-white/5 border border-white/5 hover:border-[#f5a623]/30 transition-all group text-left"
          >
            {/* Cover / avatar area */}
            <div className="relative h-24 bg-gradient-to-br from-[#f5a623]/20 to-[#0d1b2a]">
              {a.coverImageUrl ? (
                <Image src={a.coverImageUrl} alt="" fill className="object-cover opacity-50 group-hover:opacity-70 transition-opacity" unoptimized />
              ) : a.pfpUrl ? (
                <Image src={a.pfpUrl} alt="" fill className="object-cover opacity-40 group-hover:opacity-60 transition-opacity" unoptimized />
              ) : null}
              <div className="absolute bottom-2 left-2 w-10 h-10 rounded-full border-2 border-[#0d1b2a] overflow-hidden bg-gray-800">
                {a.pfpUrl ? (
                  <Image src={a.pfpUrl} alt={a.displayName} width={40} height={40} className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#f5a623] text-sm font-bold">
                    {a.displayName?.[0] || '?'}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-2.5">
              <p className="text-sm font-semibold text-white truncate">{a.displayName}</p>
              {a.category && (
                <p className="text-xs text-gray-500 capitalize truncate mt-0.5">{a.category}</p>
              )}
              {a.trackCount > 0 && (
                <p className="text-xs text-gray-600 mt-1">{a.trackCount} tracks</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Expanded spotlight */}
      {expandedUsername && (
        <div className="mt-4">
          <ArtistSpotlight
            username={expandedUsername}
            onClose={() => setExpandedUsername(null)}
          />
        </div>
      )}
    </section>
  );
}

function FeaturedArtistsSkeleton() {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-36 bg-white/10 rounded animate-pulse" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[140px] rounded-xl overflow-hidden bg-white/5 animate-pulse">
            <div className="h-24 bg-white/5" />
            <div className="p-2.5 space-y-1.5">
              <div className="h-4 w-20 bg-white/10 rounded" />
              <div className="h-3 w-14 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
