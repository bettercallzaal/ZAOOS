'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

interface NFTItem {
  name: string;
  collection: string;
  imageUrl: string | null;
  chain: 'eth' | 'base' | 'optimism';
  contractAddress: string;
  tokenId: string;
  url: string;
  isZounz: boolean;
}

const CHAIN_LABELS: Record<string, { label: string; color: string }> = {
  eth: { label: 'ETH', color: 'bg-blue-500/20 text-blue-400' },
  base: { label: 'Base', color: 'bg-blue-400/20 text-blue-300' },
  optimism: { label: 'OP', color: 'bg-red-500/20 text-red-400' },
};

export default function NFTGallery({ walletAddress }: { walletAddress: string }) {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');
  const [zounzOnly, setZounzOnly] = useState(false);

  useEffect(() => {
    if (!walletAddress) return;
    setLoading(true);
    fetch(`/api/members/nfts?address=${walletAddress}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load NFTs');
        return r.json();
      })
      .then(data => setNfts(data.nfts || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [walletAddress]);

  const collections = useMemo(() => {
    const names = [...new Set(nfts.map(n => n.collection))].sort();
    return names;
  }, [nfts]);

  const filtered = useMemo(() => {
    let result = nfts;
    if (chainFilter !== 'all') result = result.filter(n => n.chain === chainFilter);
    if (collectionFilter !== 'all') result = result.filter(n => n.collection === collectionFilter);
    if (zounzOnly) result = result.filter(n => n.isZounz);
    return result;
  }, [nfts, chainFilter, collectionFilter, zounzOnly]);

  if (loading) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] p-4 mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">NFTs</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-[#0a1628] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || nfts.length === 0) return null;

  const hasZounz = nfts.some(n => n.isZounz);
  const chainCounts = {
    all: nfts.length,
    eth: nfts.filter(n => n.chain === 'eth').length,
    base: nfts.filter(n => n.chain === 'base').length,
    optimism: nfts.filter(n => n.chain === 'optimism').length,
  };

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider">
          NFTs <span className="text-[#f5a623]">({filtered.length})</span>
        </p>
        {hasZounz && (
          <button
            onClick={() => setZounzOnly(!zounzOnly)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              zounzOnly
                ? 'bg-[#f5a623]/20 text-[#f5a623] border-[#f5a623]/40'
                : 'bg-transparent text-gray-500 border-white/[0.08] hover:text-[#f5a623] hover:border-[#f5a623]/30'
            }`}
          >
            ZOUNZ only
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* Chain pills */}
        <div className="flex gap-1">
          {(['all', 'eth', 'base', 'optimism'] as const).map(chain => {
            const count = chainCounts[chain];
            if (chain !== 'all' && count === 0) return null;
            return (
              <button
                key={chain}
                onClick={() => setChainFilter(chain)}
                className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${
                  chainFilter === chain
                    ? 'bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30'
                    : 'bg-[#0a1628] text-gray-500 border border-white/[0.08] hover:text-gray-300'
                }`}
              >
                {chain === 'all' ? 'All' : CHAIN_LABELS[chain].label} ({count})
              </button>
            );
          })}
        </div>

        {/* Collection dropdown */}
        {collections.length > 1 && (
          <select
            value={collectionFilter}
            onChange={e => setCollectionFilter(e.target.value)}
            className="text-[10px] px-2 py-1 rounded-lg bg-[#0a1628] text-gray-400 border border-white/[0.08] focus:outline-none focus:border-[#f5a623]/30 max-w-[180px] truncate"
          >
            <option value="all">All Collections ({collections.length})</option>
            {collections.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* NFT Grid */}
      {filtered.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-4">No NFTs match filters</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {filtered.map((nft, i) => (
            <a
              key={`${nft.contractAddress}-${nft.tokenId}-${i}`}
              href={nft.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative aspect-square rounded-lg overflow-hidden bg-[#0a1628] hover:ring-2 transition-all ${
                nft.isZounz
                  ? 'ring-2 ring-[#f5a623]/60 hover:ring-[#f5a623]'
                  : 'hover:ring-gray-600'
              }`}
            >
              {nft.imageUrl && (
                <Image
                  src={nft.imageUrl}
                  alt={nft.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                  unoptimized
                />
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-1.5">
                  <p className="text-[9px] text-white font-medium truncate">{nft.name}</p>
                  <p className="text-[8px] text-gray-400 truncate">{nft.collection}</p>
                </div>
              </div>

              {/* Chain badge */}
              <span className={`absolute top-1 right-1 text-[7px] px-1 py-0.5 rounded ${CHAIN_LABELS[nft.chain].color}`}>
                {CHAIN_LABELS[nft.chain].label}
              </span>

              {/* ZOUNZ badge */}
              {nft.isZounz && (
                <span className="absolute top-1 left-1 text-[7px] px-1 py-0.5 rounded bg-[#f5a623]/30 text-[#f5a623] font-bold">
                  ZOUNZ
                </span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
