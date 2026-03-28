'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePlayer } from '@/providers/audio';
import CollectButton from './CollectButton';

interface ArweaveAsset {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  arweave_tx_id: string;
  cover_tx_id: string | null;
  collected_count: number;
  coverUrl: string | null;
  audioUrl: string;
  bazarUrl: string;
  collected: boolean;
  fid: number;
  created_at: string;
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-[#0a1628] border border-gray-800 overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-800" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-800 rounded w-1/2" />
            <div className="h-8 bg-gray-800 rounded w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MusicIconPlaceholder() {
  return (
    <div className="aspect-square bg-gray-800 flex items-center justify-center">
      <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    </div>
  );
}

export default function PermawebLibrary() {
  const [assets, setAssets] = useState<ArweaveAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { play } = usePlayer();

  useEffect(() => {
    async function fetchAssets() {
      try {
        const res = await fetch('/api/music/permaweb');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setAssets(data.assets || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return assets;
    const q = search.toLowerCase();
    return assets.filter(a =>
      a.artist.toLowerCase().includes(q) || a.title.toLowerCase().includes(q)
    );
  }, [assets, search]);

  const handlePlay = (asset: ArweaveAsset) => {
    play({
      id: asset.id,
      type: 'audio',
      artistName: asset.artist,
      trackName: asset.title,
      artworkUrl: asset.coverUrl || '',
      url: asset.audioUrl,
      feedId: asset.arweave_tx_id,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-800 rounded-lg animate-pulse w-full max-w-sm" />
        <SkeletonGrid />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search by artist or title..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm px-4 py-2 rounded-lg bg-[#0a1628] border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623] transition-colors"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p className="text-gray-400 text-lg">No tracks minted yet — be the first!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(asset => (
            <div
              key={asset.id}
              className="group rounded-xl bg-[#0a1628] border border-gray-800 overflow-hidden hover:border-[#f5a623]/40 transition-colors"
            >
              <div className="relative">
                {asset.coverUrl ? (
                  <img
                    src={asset.coverUrl}
                    alt={`${asset.title} cover`}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <MusicIconPlaceholder />
                )}

                <button
                  onClick={() => handlePlay(asset)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Play ${asset.title}`}
                >
                  <svg className="w-12 h-12 text-[#f5a623]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>

                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 text-[8px] font-medium uppercase tracking-wider">
                  Permanent
                </span>
              </div>

              <div className="p-3 space-y-1.5">
                <h3 className="text-sm font-semibold text-white truncate" title={asset.title}>
                  {asset.title}
                </h3>
                <p className="text-xs text-gray-400 truncate">{asset.artist}</p>

                {asset.genre && (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-medium">
                    {asset.genre}
                  </span>
                )}

                <div className="pt-1.5">
                  <CollectButton
                    assetTxId={asset.arweave_tx_id}
                    collectedCount={asset.collected_count}
                    bazarUrl={asset.bazarUrl}
                    compact
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
