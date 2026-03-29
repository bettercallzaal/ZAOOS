'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PageHeader } from '@/components/navigation/PageHeader';

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
  location: string | null;
  platforms: Record<string, string | null>;
  respect: { total: number; fractalCount: number } | null;
  artistProfile: {
    category: string;
    thumbnailUrl: string | null;
    coverImageUrl: string | null;
    biography: string | null;
    isFeatured: boolean;
  } | null;
  lastActiveAt: string | null;
}

interface Filters {
  search: string;
  tier: 'all' | 'respect_holder' | 'community';
  category: string;
  location: string;
  active_since: '' | '7d' | '30d' | '90d';
  has_ens: boolean;
  platform: string;
  min_respect: number;
  featured: boolean;
  sort: 'respect' | 'name' | 'recent' | 'active';
}

const defaultFilters: Filters = {
  search: '', tier: 'all', category: '', location: '',
  active_since: '', has_ens: false, platform: '', min_respect: 0,
  featured: false, sort: 'respect',
};

interface Preset {
  label: string;
  filters: Partial<Filters>;
}

const presets: Preset[] = [
  { label: 'Musicians with 100+ Respect', filters: { category: 'musician', min_respect: 100 } },
  { label: 'Active this week', filters: { active_since: '7d', sort: 'active' } },
  { label: 'Featured artists', filters: { featured: true } },
  { label: 'New members', filters: { sort: 'recent' } },
  { label: 'Has ENS identity', filters: { has_ens: true } },
  { label: 'On Audius', filters: { platform: 'audius' } },
  { label: 'On Spotify', filters: { platform: 'spotify' } },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface Props {
  initialMembers: Member[];
  initialFilterOptions: { categories: string[]; locations: string[] };
}

export default function MembersDirectoryClient({ initialMembers, initialFilterOptions }: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState(initialFilterOptions);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setFilters(f => ({ ...f, search: searchInput })), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Track whether filters differ from default (skip fetch on first render)
  const [isDefaultFilters, setIsDefaultFilters] = useState(true);

  const fetchMembers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort: filters.sort, limit: '200' });
    if (filters.tier !== 'all') params.set('tier', filters.tier);
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.location) params.set('location', filters.location);
    if (filters.active_since) params.set('active_since', filters.active_since);
    if (filters.has_ens) params.set('has_ens', 'true');
    if (filters.platform) params.set('platform', filters.platform);
    if (filters.min_respect > 0) params.set('min_respect', String(filters.min_respect));
    if (filters.featured) params.set('featured', 'true');

    fetch(`/api/members/directory?${params}`)
      .then(r => r.json())
      .then(d => {
        setMembers(d.members || []);
        if (d.filterOptions) setFilterOptions(d.filterOptions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  // Only fetch when filters change away from default
  useEffect(() => {
    if (isDefaultFilters) return;
    fetchMembers();
  }, [fetchMembers, isDefaultFilters]);

  const activeFilterCount = [
    filters.tier !== 'all',
    !!filters.category,
    !!filters.location,
    !!filters.active_since,
    filters.has_ens,
    !!filters.platform,
    filters.min_respect > 0,
    filters.featured,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters(defaultFilters);
    setSearchInput('');
    setMembers(initialMembers);
    setFilterOptions(initialFilterOptions);
    setIsDefaultFilters(true);
  };

  const applyPreset = (preset: Preset) => {
    setFilters({ ...defaultFilters, ...preset.filters });
    setSearchInput('');
    setIsDefaultFilters(false);
  };

  const handleFilterChange = (updater: (f: Filters) => Filters) => {
    setFilters(updater);
    setIsDefaultFilters(false);
  };

  const respectHolders = members.filter(m => m.tier === 'respect_holder');
  const community = members.filter(m => m.tier === 'community');

  const platformBadges = (m: Member) => {
    const badges: { key: string; label: string; color: string }[] = [];
    if (m.platforms.audius) badges.push({ key: 'audius', label: 'Audius', color: 'text-purple-300' });
    if (m.platforms.spotify) badges.push({ key: 'spotify', label: 'Spotify', color: 'text-green-400' });
    if (m.platforms.soundcloud) badges.push({ key: 'sc', label: 'SC', color: 'text-orange-400' });
    return badges;
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20">
      <PageHeader
        title="Members"
        subtitle="The decentralized music community"
        backHref="/"
        count={members.length}
      />

      <div className="max-w-3xl mx-auto px-4 py-4">

        {/* Quick presets */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] border border-gray-700/50 text-gray-400 hover:text-[#f5a623] hover:border-[#f5a623]/30 transition-colors flex-shrink-0"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Search + filter toggle */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={searchInput}
            onChange={e => {
              setSearchInput(e.target.value);
              setIsDefaultFilters(false);
            }}
            placeholder="Search by name, ENS, username..."
            className="flex-1 bg-white/5 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623]/50"
          />
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`px-3 py-2 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
              filtersOpen || activeFilterCount > 0
                ? 'border-[#f5a623]/50 text-[#f5a623] bg-[#f5a623]/5'
                : 'border-gray-700/50 text-gray-500 hover:text-white'
            }`}
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#f5a623] text-[#0a1628] text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4 mb-4 space-y-3">
            {/* Row 1: Tier + Sort */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Tier</label>
                <div className="flex rounded-lg overflow-hidden border border-gray-700/50">
                  {(['all', 'respect_holder', 'community'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => handleFilterChange(f => ({ ...f, tier: t }))}
                      className={`flex-1 px-2 py-1.5 text-[11px] transition-colors ${
                        filters.tier === t ? 'bg-[#f5a623]/10 text-[#f5a623]' : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      {t === 'all' ? 'All' : t === 'respect_holder' ? 'Respect' : 'Community'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Sort</label>
                <select
                  value={filters.sort}
                  onChange={e => handleFilterChange(f => ({ ...f, sort: e.target.value as Filters['sort'] }))}
                  className="w-full bg-[#0a1628] border border-gray-700/50 rounded-lg px-2 py-1.5 text-[11px] text-white"
                >
                  <option value="respect">Most Respect</option>
                  <option value="name">Name A-Z</option>
                  <option value="recent">Newest</option>
                  <option value="active">Recently Active</option>
                </select>
              </div>
            </div>

            {/* Row 2: Category + Platform */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={e => handleFilterChange(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-[#0a1628] border border-gray-700/50 rounded-lg px-2 py-1.5 text-[11px] text-white"
                >
                  <option value="">Any</option>
                  {filterOptions.categories.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Platform</label>
                <select
                  value={filters.platform}
                  onChange={e => handleFilterChange(f => ({ ...f, platform: e.target.value }))}
                  className="w-full bg-[#0a1628] border border-gray-700/50 rounded-lg px-2 py-1.5 text-[11px] text-white"
                >
                  <option value="">Any</option>
                  <option value="audius">Audius</option>
                  <option value="spotify">Spotify</option>
                  <option value="soundcloud">SoundCloud</option>
                  <option value="bluesky">Bluesky</option>
                  <option value="x">X</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>
            </div>

            {/* Row 3: Activity + Respect range */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Active</label>
                <select
                  value={filters.active_since}
                  onChange={e => handleFilterChange(f => ({ ...f, active_since: e.target.value as Filters['active_since'] }))}
                  className="w-full bg-[#0a1628] border border-gray-700/50 rounded-lg px-2 py-1.5 text-[11px] text-white"
                >
                  <option value="">Anytime</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Min Respect</label>
                <select
                  value={filters.min_respect}
                  onChange={e => handleFilterChange(f => ({ ...f, min_respect: Number(e.target.value) }))}
                  className="w-full bg-[#0a1628] border border-gray-700/50 rounded-lg px-2 py-1.5 text-[11px] text-white"
                >
                  <option value={0}>Any</option>
                  <option value={1}>1+ Respect</option>
                  <option value={50}>50+</option>
                  <option value={100}>100+</option>
                  <option value={200}>200+</option>
                  <option value={500}>500+</option>
                </select>
              </div>
            </div>

            {/* Row 4: Toggles */}
            <div className="flex gap-3 flex-wrap items-center">
              <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.has_ens}
                  onChange={e => handleFilterChange(f => ({ ...f, has_ens: e.target.checked }))}
                  className="rounded border-gray-700 bg-[#0a1628] text-[#f5a623] focus:ring-[#f5a623]"
                />
                Has ENS
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.featured}
                  onChange={e => handleFilterChange(f => ({ ...f, featured: e.target.checked }))}
                  className="rounded border-gray-700 bg-[#0a1628] text-[#f5a623] focus:ring-[#f5a623]"
                />
                Featured
              </label>

              <div className="flex-1" />

              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-[11px] text-red-400 hover:text-red-300 transition-colors">
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active filter chips (shown when panel is closed) */}
        {!filtersOpen && activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {filters.tier !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5a623]/10 text-[#f5a623] text-[10px]">
                {filters.tier === 'respect_holder' ? 'Respect Holders' : 'Community'}
                <button onClick={() => handleFilterChange(f => ({ ...f, tier: 'all' }))} className="hover:text-white">&times;</button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] capitalize">
                {filters.category}
                <button onClick={() => handleFilterChange(f => ({ ...f, category: '' }))} className="hover:text-white">&times;</button>
              </span>
            )}
            {filters.platform && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] capitalize">
                On {filters.platform}
                <button onClick={() => handleFilterChange(f => ({ ...f, platform: '' }))} className="hover:text-white">&times;</button>
              </span>
            )}
            {filters.active_since && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px]">
                Active {filters.active_since}
                <button onClick={() => handleFilterChange(f => ({ ...f, active_since: '' }))} className="hover:text-white">&times;</button>
              </span>
            )}
            {filters.min_respect > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5a623]/10 text-[#f5a623] text-[10px]">
                {filters.min_respect}+ Respect
                <button onClick={() => handleFilterChange(f => ({ ...f, min_respect: 0 }))} className="hover:text-white">&times;</button>
              </span>
            )}
            {filters.has_ens && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5a623]/10 text-[#f5a623] text-[10px]">
                Has ENS
                <button onClick={() => handleFilterChange(f => ({ ...f, has_ens: false }))} className="hover:text-white">&times;</button>
              </span>
            )}
            {filters.featured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5a623]/10 text-[#f5a623] text-[10px]">
                Featured
                <button onClick={() => handleFilterChange(f => ({ ...f, featured: false }))} className="hover:text-white">&times;</button>
              </span>
            )}
            <button onClick={clearFilters} className="text-[10px] text-gray-600 hover:text-red-400 transition-colors">
              Clear all
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-4 mb-4 text-xs text-gray-500">
          <span>{respectHolders.length} respect holders</span>
          <span>{community.length} community</span>
          {filters.sort !== 'respect' && <span className="text-gray-600">Sorted by {filters.sort}</span>}
        </div>

        {/* Member grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-20 bg-[#0d1b2a] rounded-xl animate-pulse" />)}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-3">No members match your filters</p>
            <button onClick={clearFilters} className="text-[#f5a623] text-sm hover:underline">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {members.map(m => (
              <Link
                key={m.id}
                href={`/members/${m.username || m.fid || m.id}`}
                className="relative flex items-center gap-3 px-4 py-3 bg-[#0d1b2a] rounded-xl border border-gray-800/50 hover:border-[#f5a623]/30 transition-colors overflow-hidden group"
              >
                {/* Cover image background */}
                {m.artistProfile?.coverImageUrl && (
                  <div className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.12] transition-opacity">
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
                    {m.artistProfile?.category && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-500 capitalize flex-shrink-0">
                        {m.artistProfile.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                    {m.username && <span>@{m.username}</span>}
                    {m.ensName && <span className="text-[#f5a623]">{m.ensName}</span>}
                    {m.location && <span>· {m.location}</span>}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {(m.artistProfile?.biography || m.bio) && (
                      <p className="text-[10px] text-gray-600 truncate flex-1">
                        {m.artistProfile?.biography || m.bio}
                      </p>
                    )}
                    {/* Platform badges */}
                    {platformBadges(m).length > 0 && (
                      <div className="flex gap-0.5 flex-shrink-0">
                        {platformBadges(m).map(b => (
                          <span key={b.key} className={`text-[8px] ${b.color}`}>{b.label}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Respect + activity */}
                <div className="text-right flex-shrink-0 relative">
                  {m.respect && m.respect.total > 0 ? (
                    <>
                      <p className="text-xs font-mono text-[#f5a623]">{m.respect.total}R</p>
                      <p className="text-[9px] text-gray-600">{m.respect.fractalCount}f</p>
                    </>
                  ) : m.tier === 'respect_holder' ? (
                    <span className="text-[9px] text-green-400/60">Respect</span>
                  ) : null}
                  {m.lastActiveAt && (
                    <p className="text-[8px] text-gray-700">{timeAgo(m.lastActiveAt)}</p>
                  )}
                </div>
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
