'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { PageHeader } from '@/components/navigation/PageHeader';
import { NEXUS_LINKS, type NexusCategory, type NexusLink } from '@/lib/nexus/links';

// ── Mini App Discovery Types ───────────────────────────────────────────────────

interface MiniApp {
  name: string;
  description?: string;
  imageUrl?: string;
  url: string;
  author?: { fid: number; username: string; displayName: string };
}

// ── Ecosystem App Definitions ─────────────────────────────────────────────────

interface AppLink {
  label: string;
  url: string;
  icon: string;
}

interface EcosystemApp {
  name: string;
  icon: string;
  description: string;
  url: string;
  /** If true, render as an iframe instead of a card (only for sites we control) */
  embeddable?: boolean;
  links?: AppLink[];
}

const ECOSYSTEM_APPS: EcosystemApp[] = [
  {
    name: 'WaveWarZ',
    icon: '\u2694\uFE0F',
    description: 'Music battles - trade SOL on outcomes in a Solana prediction market for music.',
    url: 'https://www.wavewarz.com',
    links: [
      { label: 'Analytics', url: 'https://analytics-wave-warz.vercel.app', icon: '\uD83D\uDCCA' },
      { label: 'Intelligence', url: 'https://wavewarz-intelligence.vercel.app', icon: '\uD83E\uDDE0' },
      { label: 'Farcaster', url: 'https://warpcast.com/~/channel/wavewarz', icon: '\uD83D\uDCAC' },
    ],
  },
  {
    name: 'SongJam',
    icon: '\uD83C\uDFB5',
    description: 'Live audio spaces & ZABAL mention leaderboard - host rooms, earn points.',
    url: 'https://songjam.space/zabal',
  },
  {
    name: 'MAGNETIQ',
    icon: '\uD83E\uDDF2',
    description: 'Proof of Meet hub - verify real-world connections and earn attestations.',
    url: 'https://zabal.lol',
  },
  {
    name: 'ZOUNZ',
    icon: '\uD83C\uDFAD',
    description: 'ZABAL Nouns DAO - daily NFT auctions funding the community treasury on Base.',
    url: 'https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883',
  },
  {
    name: 'Empire Builder',
    icon: '\uD83C\uDFF0',
    description: 'Token empire rewards - stake and earn in the ZABAL ecosystem.',
    url: 'https://empirebuilder.world/profile/0x7234c36A71ec237c2Ae7698e8916e0735001E9Af',
  },
  {
    name: 'Incented',
    icon: '\uD83D\uDE80',
    description: 'Community campaigns - bounties and tasks that grow the ZAO.',
    url: 'https://incented.co/organizations/zabal',
  },
  {
    name: 'Clanker',
    icon: '\uD83E\uDE99',
    description: '$ZABAL token launcher - the origin of the community token.',
    url: 'https://clanker.world',
  },
  {
    name: 'ZAO Leaderboard',
    icon: '\uD83C\uDFC6',
    description: 'Respect leaderboard - see who has earned the most Respect in the ZAO.',
    url: 'https://zao-leaderboard.vercel.app/embed?limit=20',
    embeddable: true,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function flattenAllLinks(categories: NexusCategory[]): NexusLink[] {
  const result: NexusLink[] = [];
  for (const cat of categories) {
    if (cat.links) result.push(...cat.links);
    if (cat.subcategories) result.push(...flattenAllLinks(cat.subcategories));
  }
  return result;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EcosystemPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [resourceSearch, setResourceSearch] = useState('');

  // ── Discover state ────────────────────────────────────────────────────────
  const [showDiscover, setShowDiscover] = useState(false);
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [searchResults, setSearchResults] = useState<MiniApp[]>([]);
  const [catalogApps, setCatalogApps] = useState<MiniApp[]>([]);
  const [relevantApps, setRelevantApps] = useState<MiniApp[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch catalog + relevant when Discover view opens
  useEffect(() => {
    if (!showDiscover) return;
    if (catalogApps.length > 0) return;

    setDiscoverLoading(true);
    Promise.allSettled([
      fetch('/api/miniapp/discover?mode=catalog&limit=12').then((r) => r.json()),
      fetch('/api/miniapp/discover?mode=relevant&limit=8').then((r) => r.json()),
    ]).then(([catalogRes, relevantRes]) => {
      if (catalogRes.status === 'fulfilled') {
        const data = catalogRes.value;
        const items: MiniApp[] = data?.frames ?? data?.mini_apps ?? data?.apps ?? [];
        setCatalogApps(items);
      }
      if (relevantRes.status === 'fulfilled') {
        const data = relevantRes.value;
        const items: MiniApp[] = data?.frames ?? data?.mini_apps ?? data?.apps ?? [];
        setRelevantApps(items);
      }
    }).finally(() => setDiscoverLoading(false));
  }, [showDiscover, catalogApps.length]);

  // Debounced search
  useEffect(() => {
    if (!showDiscover) return;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!discoverSearch.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/miniapp/search?q=${encodeURIComponent(discoverSearch.trim())}`);
        const data = await res.json();
        const items: MiniApp[] = data?.frames ?? data?.mini_apps ?? data?.apps ?? data?.results ?? [];
        setSearchResults(items);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [discoverSearch, showDiscover]);

  const handleCopy = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // Nexus links for resources section
  const allLinks = flattenAllLinks(NEXUS_LINKS);
  const filteredLinks = resourceSearch
    ? allLinks.filter(
        (l) =>
          l.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
          l.description?.toLowerCase().includes(resourceSearch.toLowerCase()) ||
          l.tags?.some((t) => t.toLowerCase().includes(resourceSearch.toLowerCase())),
      )
    : allLinks;

  const groupedCategories = NEXUS_LINKS.filter((cat) => {
    if (!resourceSearch) return true;
    const catLinks = flattenAllLinks([cat]);
    return catLinks.some(
      (l) =>
        l.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
        l.description?.toLowerCase().includes(resourceSearch.toLowerCase()) ||
        l.tags?.some((t) => t.toLowerCase().includes(resourceSearch.toLowerCase())),
    );
  });

  // Split apps: embeddable vs external
  const embeddableApps = ECOSYSTEM_APPS.filter((a) => a.embeddable);
  const externalApps = ECOSYSTEM_APPS.filter((a) => !a.embeddable);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0a1628] text-white">
      {/* Header */}
      <PageHeader
        title="Ecosystem"
        subtitle="Apps & integrations"
        rightAction={<div className="md:hidden"><NotificationBell /></div>}
      />

      {/* Tab bar: Apps / Discover */}
      <div className="sticky top-0 z-20 bg-[#0d1b2a]/95 backdrop-blur-sm border-b border-white/[0.08] flex-shrink-0">
        <div className="flex gap-2 px-3 py-2.5">
          <button
            onClick={() => setShowDiscover(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !showDiscover
                ? 'bg-[#f5a623] text-[#0a1628] shadow-lg shadow-[#f5a623]/20'
                : 'bg-[#1a2a3a] text-gray-400 hover:text-gray-200'
            }`}
          >
            ZABAL Partners
          </button>
          <button
            onClick={() => setShowDiscover(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              showDiscover
                ? 'bg-[#1a3a5c] text-[#60b4ff] border border-[#60b4ff]/40 shadow-lg shadow-[#60b4ff]/10'
                : 'bg-[#0e2033] text-[#60b4ff]/70 border border-[#60b4ff]/20 hover:bg-[#1a3a5c]/60 hover:text-[#60b4ff]'
            }`}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
            </svg>
            Discover
          </button>
        </div>
      </div>

      {/* ── Discover View ──────────────────────────────────────────────────── */}
      {showDiscover ? (
        <div className="flex-1 overflow-y-auto bg-[#0a1628]">
          <div className="px-4 pt-4 pb-28 space-y-6">
            {/* Search bar */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={discoverSearch}
                onChange={(e) => setDiscoverSearch(e.target.value)}
                placeholder="Search Farcaster mini apps..."
                className="w-full pl-10 pr-9 py-2.5 bg-[#0e2033] border border-[#60b4ff]/20 rounded-xl text-sm text-white placeholder:text-gray-600 focus:border-[#60b4ff]/50 focus:outline-none transition-colors"
              />
              {discoverSearch && (
                <button
                  onClick={() => setDiscoverSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#60b4ff]/30 border-t-[#60b4ff] rounded-full animate-spin" />
              )}
            </div>

            {/* Search results */}
            {discoverSearch.trim() && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Search Results</h3>
                {searchLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <MiniAppCardSkeleton key={i} />
                    ))}
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="text-sm text-gray-600 py-6 text-center">No results for &ldquo;{discoverSearch}&rdquo;</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {searchResults.map((app, i) => (
                      <MiniAppCard key={`search-${app.url}-${i}`} app={app} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Featured (catalog) */}
            {!discoverSearch.trim() && (
              <>
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Featured Mini Apps</h3>
                  {discoverLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <MiniAppCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : catalogApps.length === 0 ? (
                    <p className="text-sm text-gray-600 py-4 text-center">No featured apps available</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {catalogApps.map((app, i) => (
                        <MiniAppCard key={`catalog-${app.url}-${i}`} app={app} />
                      ))}
                    </div>
                  )}
                </div>

                {(discoverLoading || relevantApps.length > 0) && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">For You</h3>
                    {discoverLoading ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <MiniAppCardSkeleton key={i} />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {relevantApps.map((app, i) => (
                          <MiniAppCard key={`relevant-${app.url}-${i}`} app={app} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── Partner Apps View ──────────────────────────────────────────────── */
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-28 space-y-4">
            {/* Partner app cards */}
            <div className="space-y-3">
              {externalApps.map((app) => (
                <PartnerCard key={app.name} app={app} copied={copied} onCopy={handleCopy} />
              ))}
            </div>

            {/* Embeddable sections (ZAO Leaderboard) */}
            {embeddableApps.map((app) => (
              <EmbedSection key={app.name} app={app} />
            ))}
          </div>
        </div>
      )}

      {/* $ZABAL Token Banner */}
      <div className="flex-shrink-0 bg-gradient-to-r from-[#f5a623]/10 to-[#ffd700]/5 border-t border-[#f5a623]/20 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#f5a623] font-medium uppercase tracking-wider">$ZABAL on Base</span>
            <p className="text-[10px] text-gray-500 mt-0.5">Community token launched via Clanker, Jan 1 2026</p>
          </div>
          <a
            href="https://basescan.org/token/0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#f5a623]/60 hover:text-[#f5a623] transition-colors whitespace-nowrap"
          >
            Basescan &rarr;
          </a>
        </div>
      </div>

      {/* More Resources - Collapsible */}
      <div className="flex-shrink-0 border-t border-white/[0.08] bg-[#0d1b2a]">
        <button
          onClick={() => setResourcesOpen(!resourcesOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#1a2a3a]/30 transition-colors"
        >
          <span className="text-xs font-medium text-gray-400">More Resources ({allLinks.length} links)</span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${resourcesOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {resourcesOpen && (
          <div className="px-4 pb-24">
            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                placeholder="Search resources..."
                className="w-full pl-9 pr-3 py-2 bg-[#1a2a3a] rounded-lg text-xs text-white placeholder:text-gray-600 border border-white/[0.08] focus:border-[#f5a623]/40 focus:outline-none transition-colors"
              />
              {resourceSearch && (
                <button
                  onClick={() => setResourceSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {resourceSearch ? (
              <div className="space-y-1.5">
                {filteredLinks.length === 0 && (
                  <p className="text-xs text-gray-600 py-4 text-center">No results for &ldquo;{resourceSearch}&rdquo;</p>
                )}
                {filteredLinks.map((link, i) => (
                  <ResourceLinkRow key={`${link.url}-${i}`} link={link} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {groupedCategories.map((cat) => (
                  <ResourceCategory key={cat.name} category={cat} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Partner Card ─────────────────────────────────────────────────────────────

function PartnerCard({
  app,
  copied,
  onCopy,
}: {
  app: EcosystemApp;
  copied: string | null;
  onCopy: (url: string) => void;
}) {
  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] overflow-hidden hover:border-[#f5a623]/20 transition-colors">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{app.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white">{app.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{app.description}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f5a623] text-[#0a1628] rounded-lg text-xs font-medium hover:bg-[#ffd700] transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Open
          </a>
          <button
            onClick={() => onCopy(app.url)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#1a2a3a] rounded-lg text-xs text-gray-300 hover:bg-[#1a2a3a]/80 hover:text-white transition-colors"
          >
            {copied === app.url ? (
              <span className="text-green-400">Copied!</span>
            ) : (
              <>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copy
              </>
            )}
          </button>

          {/* Secondary links */}
          {app.links?.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#1a2a3a] rounded-lg text-xs text-gray-300 hover:bg-[#1a2a3a]/80 hover:text-white transition-colors"
            >
              <span className="text-sm">{link.icon}</span>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Embed Section (for sites we control) ─────────────────────────────────────

function EmbedSection({ app }: { app: EcosystemApp }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (!loaded) setError(true);
    }, 10000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loaded]);

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08]">
        <span className="text-lg">{app.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white">{app.name}</h3>
          <p className="text-[10px] text-gray-500">{app.description}</p>
        </div>
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[#f5a623] hover:text-[#ffd700] transition-colors"
        >
          Open &rarr;
        </a>
      </div>

      <div className="relative" style={{ height: '400px' }}>
        {!loaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a1628]">
            <div className="w-6 h-6 border-2 border-[#f5a623]/30 border-t-[#f5a623] rounded-full animate-spin mb-2" />
            <p className="text-xs text-gray-500">Loading...</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a1628] px-6">
            <p className="text-sm text-gray-400 mb-4">Could not load embed</p>
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#f5a623] text-[#0a1628] rounded-lg font-medium text-sm hover:bg-[#ffd700] transition-colors"
            >
              Open externally
            </a>
          </div>
        )}
        <iframe
          src={app.url}
          title={app.name}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          allow="clipboard-write"
          onLoad={() => {
            setLoaded(true);
            if (timerRef.current) clearTimeout(timerRef.current);
          }}
          onError={() => {
            setError(true);
            if (timerRef.current) clearTimeout(timerRef.current);
          }}
        />
      </div>
    </div>
  );
}

// ── Mini App Sub-components ───────────────────────────────────────────────────

function MiniAppCard({ app }: { app: MiniApp }) {
  return (
    <div className="flex flex-col bg-[#0e2033] border border-[#60b4ff]/10 rounded-xl p-3 gap-2 hover:border-[#60b4ff]/30 transition-colors">
      <div className="flex items-start gap-2">
        {app.imageUrl ? (
          <img
            src={app.imageUrl}
            alt={app.name}
            className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-[#1a3a5c]"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-[#1a3a5c] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#60b4ff]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6M9 12h6M9 15h4" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{app.name}</p>
          {app.author && (
            <p className="text-[10px] text-gray-600 truncate">by {app.author.displayName || app.author.username}</p>
          )}
        </div>
      </div>

      {app.description && (
        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{app.description}</p>
      )}

      <a
        href={app.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-[#60b4ff]/10 hover:bg-[#60b4ff]/20 text-[#60b4ff] rounded-lg text-[10px] font-medium transition-colors"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
        Open
      </a>
    </div>
  );
}

function MiniAppCardSkeleton() {
  return (
    <div className="flex flex-col bg-[#0e2033] border border-[#60b4ff]/10 rounded-xl p-3 gap-2 animate-pulse">
      <div className="flex items-start gap-2">
        <div className="w-9 h-9 rounded-lg bg-[#1a3a5c] flex-shrink-0" />
        <div className="flex-1 space-y-1.5 pt-0.5">
          <div className="h-2.5 bg-[#1a3a5c] rounded w-3/4" />
          <div className="h-2 bg-[#1a3a5c] rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-1">
        <div className="h-2 bg-[#1a3a5c] rounded w-full" />
        <div className="h-2 bg-[#1a3a5c] rounded w-4/5" />
      </div>
      <div className="h-6 bg-[#1a3a5c] rounded-lg w-full mt-auto" />
    </div>
  );
}

// ── Resource Sub-components ──────────────────────────────────────────────────

function ResourceCategory({ category }: { category: NexusCategory }) {
  const [open, setOpen] = useState(false);
  const links = category.links || [];
  const subs = category.subcategories || [];

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left"
      >
        <svg
          className={`w-3 h-3 text-gray-600 transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-xs font-medium text-gray-300">{category.name}</span>
        {category.description && (
          <span className="text-[10px] text-gray-600 truncate">{category.description}</span>
        )}
      </button>

      {open && (
        <div className="ml-5 mt-1.5 space-y-1">
          {links.map((link, i) => (
            <ResourceLinkRow key={`${link.url}-${i}`} link={link} />
          ))}
          {subs.map((sub) => (
            <ResourceCategory key={sub.name} category={sub} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceLinkRow({ link }: { link: NexusLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#1a2a3a]/60 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-300 group-hover:text-white truncate">{link.title}</p>
        {link.description && (
          <p className="text-[10px] text-gray-600 truncate">{link.description}</p>
        )}
      </div>
      <svg className="w-3 h-3 text-gray-700 group-hover:text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    </a>
  );
}
