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
        <div key={i} className="rounded-xl bg-[#0a1628] border border-white/[0.08] overflow-hidden animate-pulse">
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

function SectionHeader() {
  return (
    <div className="space-y-1 mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-white">Permaweb Library</h2>
        <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-medium uppercase tracking-wider">
          Arweave
        </span>
      </div>
      <p className="text-sm text-gray-500">
        Music stored permanently on Arweave. Collect, own, and support artists forever.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-white/[0.08]/60 bg-gradient-to-br from-[#0d1b2a] to-[#0a1628] p-8 text-center space-y-5">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[#f5a623]/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-[#f5a623]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </div>
      <div className="space-y-2">
        <p className="text-white font-semibold text-lg">No tracks minted yet</p>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Mint your music to the permaweb and it lives forever.
          Stored on Arweave with 200+ years of guaranteed permanence.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-md mx-auto pt-2">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 space-y-1">
          <p className="text-[#f5a623] text-xs font-semibold">Permanent</p>
          <p className="text-[11px] text-gray-500">Stored on Arweave forever — no takedowns</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 space-y-1">
          <p className="text-[#f5a623] text-xs font-semibold">Ownable</p>
          <p className="text-[11px] text-gray-500">Fans can collect and truly own your music</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 space-y-1">
          <p className="text-[#f5a623] text-xs font-semibold">Licensed</p>
          <p className="text-[11px] text-gray-500">UDL licenses protect your creative rights</p>
        </div>
      </div>
      <p className="text-gray-600 text-xs">
        Use the <span className="text-[#f5a623]">Mint Track</span> button above to upload your first track.
      </p>
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
        <SectionHeader />
        <div className="h-10 bg-gray-800 rounded-lg animate-pulse w-full max-w-sm" />
        <SkeletonGrid />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <SectionHeader />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader />

      {assets.length > 0 && (
        <input
          type="text"
          placeholder="Search by artist or title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 rounded-lg bg-[#0a1628] border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623] transition-colors"
        />
      )}

      {assets.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">No tracks match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(asset => (
            <div
              key={asset.id}
              className="group rounded-xl bg-[#0a1628] border border-white/[0.08] overflow-hidden hover:border-[#f5a623]/40 transition-colors"
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
