'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NotificationBell } from '@/components/navigation/NotificationBell';

interface CommunityProfile {
  id: string;
  name: string;
  slug: string;
  cover_image_url: string | null;
  thumbnail_url: string | null;
  biography: string | null;
  category: string;
  is_featured: boolean;
  is_notable: boolean;
  tags: string[];
  twitter: string | null;
  instagram: string | null;
  spotify: string | null;
  soundcloud: string | null;
  website: string | null;
  youtube: string | null;
  tiktok: string | null;
  audius: string | null;
}

const CATEGORIES = ['all', 'musician', 'developer', 'artist', 'producer', 'songwriter', 'dj', 'other'];

export default function DirectoryPage() {
  const [profiles, setProfiles] = useState<CommunityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    queueMicrotask(() => setLoading(true));
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    params.set('limit', '100');

    fetch(`/api/directory?${params}`)
      .then(res => res.json())
      .then(data => {
        setProfiles(data.profiles || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, search]);

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <h1 className="text-lg font-bold">Directory</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{total} members</span>
          <div className="md:hidden"><NotificationBell /></div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search members..."
          className="w-full bg-[#0d1b2a] text-sm text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-[#f5a623] outline-none placeholder:text-gray-600"
        />

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                category === cat
                  ? 'bg-[#f5a623]/10 text-[#f5a623]'
                  : 'text-gray-500 hover:text-white bg-[#0d1b2a]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#0d1b2a] rounded-xl h-48 animate-pulse border border-gray-800" />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <p className="text-center text-gray-500 py-12 text-sm">No members found</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {profiles.map((p) => (
              <Link
                key={p.id}
                href={`/directory/${p.slug}`}
                className="group bg-[#0d1b2a] rounded-xl border border-gray-800 overflow-hidden hover:border-[#f5a623]/40 transition-all"
              >
                <div className="relative h-28 bg-gradient-to-br from-gray-800 to-gray-900">
                  {p.cover_image_url && (
                    <Image src={p.cover_image_url} alt={p.name} fill className="object-cover" unoptimized />
                  )}
                  {p.is_featured && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-bold bg-[#f5a623]/80 text-black rounded">
                      Featured
                    </span>
                  )}
                </div>

                <div className="p-3 -mt-6 relative">
                  <div className="w-12 h-12 rounded-full border-2 border-[#0d1b2a] overflow-hidden bg-gray-700 mb-2">
                    {p.thumbnail_url ? (
                      <Image src={p.thumbnail_url} alt={p.name} width={48} height={48} className="object-cover w-full h-full" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm">
                        {p.name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white truncate group-hover:text-[#f5a623] transition-colors">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-gray-500 capitalize">{p.category}</p>

                  <div className="flex gap-1 mt-2">
                    {p.twitter && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="X" />}
                    {p.instagram && <span className="w-1.5 h-1.5 rounded-full bg-pink-400" title="Instagram" />}
                    {p.spotify && <span className="w-1.5 h-1.5 rounded-full bg-green-400" title="Spotify" />}
                    {p.soundcloud && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" title="SoundCloud" />}
                    {p.youtube && <span className="w-1.5 h-1.5 rounded-full bg-red-400" title="YouTube" />}
                    {p.website && <span className="w-1.5 h-1.5 rounded-full bg-gray-400" title="Website" />}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
