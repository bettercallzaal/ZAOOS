'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Member {
  id: string;
  fid: number | null;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  ensName: string | null;
  zid: string | null;
  tier: string;
  bio: string | null;
  tags: string[];
  platforms: Record<string, string | null>;
  respect: { total: number; fractalCount: number } | null;
  artistProfile: {
    category: string;
    thumbnailUrl: string | null;
    coverImageUrl: string | null;
    biography: string | null;
    isFeatured: boolean;
  } | null;
}

export default function MembersDirectoryPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'respect_holder' | 'community'>('all');

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort: 'respect', limit: '200' });
    if (tierFilter !== 'all') params.set('tier', tierFilter);
    if (search) params.set('search', search);

    fetch(`/api/members/directory?${params}`)
      .then(r => r.json())
      .then(d => setMembers(d.members || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, tierFilter]);

  const respectHolders = members.filter(m => m.tier === 'respect_holder');
  const community = members.filter(m => m.tier === 'community');

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white">
      {/* Header */}
      <nav className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-[#f5a623] font-bold text-sm">THE ZAO</Link>
        <span className="text-xs text-gray-500">{members.length} members</span>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold">ZAO Members</h1>
          <p className="text-xs text-gray-500 mt-1">The decentralized music community</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search members..."
            className="flex-1 bg-white/5 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623]/50"
          />
          <div className="flex rounded-lg overflow-hidden border border-gray-700/50">
            {(['all', 'respect_holder', 'community'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-2 text-xs transition-colors ${
                  tierFilter === t ? 'bg-[#f5a623]/10 text-[#f5a623]' : 'text-gray-500 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All' : t === 'respect_holder' ? 'Respect' : 'Community'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-6 text-xs text-gray-500">
          <span>{respectHolders.length} respect holders</span>
          <span>{community.length} community members</span>
        </div>

        {/* Member grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-20 bg-[#0d1b2a] rounded-xl animate-pulse" />)}
          </div>
        ) : members.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No members found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {members.map(m => (
              <Link
                key={m.id}
                href={`/members/${m.username || m.fid || m.id}`}
                className="relative flex items-center gap-3 px-4 py-3 bg-[#0d1b2a] rounded-xl border border-gray-800/50 hover:border-[#f5a623]/30 transition-colors overflow-hidden"
              >
                {/* Cover image background (if artist profile) */}
                {m.artistProfile?.coverImageUrl && (
                  <div className="absolute inset-0 opacity-10">
                    <Image src={m.artistProfile.coverImageUrl} alt="" fill className="object-cover" sizes="400px" />
                  </div>
                )}

                {/* PFP */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                  {(m.artistProfile?.thumbnailUrl || m.pfpUrl) ? (
                    <Image src={m.artistProfile?.thumbnailUrl || m.pfpUrl || ''} alt="" fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">
                      {(m.displayName || m.username || '?')[0]?.toUpperCase()}
                    </div>
                  )}
                  {m.artistProfile?.isFeatured && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#f5a623] rounded-full border border-[#0d1b2a]" title="Featured" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 relative">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-white truncate">
                      {m.displayName || m.username || 'Unknown'}
                    </span>
                    {m.zid && (
                      <span className="text-[8px] font-bold text-[#f5a623] bg-[#f5a623]/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        #{m.zid}
                      </span>
                    )}
                    {m.artistProfile?.category && m.artistProfile.category !== 'musician' && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-500 capitalize flex-shrink-0">
                        {m.artistProfile.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                    {m.username && <span>@{m.username}</span>}
                    {m.ensName && <span className="text-[#f5a623]">{m.ensName}</span>}
                    {m.artistProfile?.category === 'musician' && (
                      <span className="text-purple-400">Musician</span>
                    )}
                    {m.tier === 'respect_holder' && (
                      <span className="text-green-400">Respect</span>
                    )}
                  </div>
                  {(m.artistProfile?.biography || m.bio) && (
                    <p className="text-[10px] text-gray-600 truncate mt-0.5">
                      {m.artistProfile?.biography || m.bio}
                    </p>
                  )}
                </div>

                {/* Respect */}
                {m.respect && m.respect.total > 0 && (
                  <div className="text-right flex-shrink-0 relative">
                    <p className="text-xs font-mono text-[#f5a623]">{m.respect.total}R</p>
                    <p className="text-[9px] text-gray-600">{m.respect.fractalCount}f</p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-800/50 mt-8">
          <p className="text-[10px] text-gray-600">
            ZAO OS · <Link href="/" className="text-[#f5a623] hover:underline">zaoos.com</Link> · Powered by Farcaster
          </p>
        </div>
      </div>
    </div>
  );
}
