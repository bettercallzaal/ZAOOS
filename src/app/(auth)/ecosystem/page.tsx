'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { PageHeader } from '@/components/navigation/PageHeader';
import { NEXUS_LINKS, type NexusCategory, type NexusLink } from '@/lib/nexus/links';

// ── Ecosystem App Definitions ─────────────────────────────────────────────────

interface SecondaryLink {
  label: string;
  url: string;
  icon: string;
}

interface EcosystemApp {
  name: string;
  icon: string;
  description: string;
  iframeUrl: string;
  secondaryLinks?: SecondaryLink[];
}

const ECOSYSTEM_APPS: EcosystemApp[] = [
  {
    name: 'WaveWarZ',
    icon: '\u2694\uFE0F',
    description: 'Music battles — trade SOL on outcomes in a Solana prediction market for music.',
    iframeUrl: 'https://www.wavewarz.com',
    secondaryLinks: [
      { label: 'Farcaster Channel', url: 'https://warpcast.com/~/channel/wavewarz', icon: '\uD83D\uDCAC' },
      { label: 'WaveWarZ Intelligence', url: 'https://wavewarz-intelligence.vercel.app', icon: '\uD83E\uDDE0' },
      { label: 'Analytics', url: 'https://analytics-wave-warz.vercel.app', icon: '\uD83D\uDCCA' },
    ],
  },
  {
    name: 'SongJam',
    icon: '\uD83C\uDFB5',
    description: 'Live audio spaces & ZABAL mention leaderboard — host rooms, earn points.',
    iframeUrl: 'https://songjam.space/zabal',
  },
  {
    name: 'MAGNETIQ',
    icon: '\uD83E\uDDF2',
    description: 'Proof of Meet hub — verify real-world connections and earn attestations.',
    iframeUrl: 'https://zabal.lol',
  },
  {
    name: 'ZOUNZ',
    icon: '\uD83C\uDFAD',
    description: 'ZABAL Nouns DAO — daily NFT auctions funding the community treasury on Base.',
    iframeUrl: 'https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883',
  },
  {
    name: 'Empire Builder',
    icon: '\uD83C\uDFF0',
    description: 'Token empire rewards — stake and earn in the ZABAL ecosystem.',
    iframeUrl: 'https://empirebuilder.world/profile/0x7234c36A71ec237c2Ae7698e8916e0735001E9Af',
  },
  {
    name: 'Incented',
    icon: '\uD83D\uDE80',
    description: 'Community campaigns — bounties and tasks that grow the ZAO.',
    iframeUrl: 'https://incented.co/organizations/zabal',
  },
  {
    name: 'Clanker',
    icon: '\uD83E\uDE99',
    description: '$ZABAL token launcher — the origin of the community token.',
    iframeUrl: 'https://clanker.world',
  },
  {
    name: 'ZAO Leaderboard',
    icon: '\uD83C\uDFC6',
    description: 'Respect leaderboard — see who has earned the most Respect in the ZAO.',
    iframeUrl: 'https://zao-leaderboard.vercel.app/embed?limit=20',
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [iframeStatus, setIframeStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [copied, setCopied] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [resourceSearch, setResourceSearch] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeApp = ECOSYSTEM_APPS[activeIndex];

  // Reset iframe state when switching apps
  useEffect(() => {
    setIframeStatus('loading');
    // If iframe doesn't fire onLoad within 8s, assume it was blocked
    if (iframeTimerRef.current) clearTimeout(iframeTimerRef.current);
    iframeTimerRef.current = setTimeout(() => {
      setIframeStatus((prev) => (prev === 'loading' ? 'error' : prev));
    }, 8000);
    return () => {
      if (iframeTimerRef.current) clearTimeout(iframeTimerRef.current);
    };
  }, [activeIndex]);

  const handleIframeLoad = useCallback(() => {
    if (iframeTimerRef.current) clearTimeout(iframeTimerRef.current);
    setIframeStatus('loaded');
  }, []);

  const handleIframeError = useCallback(() => {
    if (iframeTimerRef.current) clearTimeout(iframeTimerRef.current);
    setIframeStatus('error');
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeApp.iframeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = activeApp.iframeUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [activeApp.iframeUrl]);

  // Nexus links for the resources section
  const allLinks = flattenAllLinks(NEXUS_LINKS);
  const filteredLinks = resourceSearch
    ? allLinks.filter(
        (l) =>
          l.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
          l.description?.toLowerCase().includes(resourceSearch.toLowerCase()) ||
          l.tags?.some((t) => t.toLowerCase().includes(resourceSearch.toLowerCase())),
      )
    : allLinks;

  // Group nexus links by category
  const groupedCategories = NEXUS_LINKS.filter((cat) => {
    if (!resourceSearch) return true;
    // Check if any link in category matches
    const catLinks = flattenAllLinks([cat]);
    return catLinks.some(
      (l) =>
        l.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
        l.description?.toLowerCase().includes(resourceSearch.toLowerCase()) ||
        l.tags?.some((t) => t.toLowerCase().includes(resourceSearch.toLowerCase())),
    );
  });

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0a1628] text-white">
      {/* Header */}
      <PageHeader
        title="Ecosystem"
        subtitle="Apps & integrations"
        rightAction={<div className="md:hidden"><NotificationBell /></div>}
      />

      {/* App Selector Bar — sticky, horizontal scroll */}
      <div className="sticky top-0 z-20 bg-[#0d1b2a]/95 backdrop-blur-sm border-b border-gray-800 flex-shrink-0">
        <div className="flex gap-2 px-3 py-2.5 overflow-x-auto scrollbar-hide">
          {ECOSYSTEM_APPS.map((app, i) => (
            <button
              key={app.name}
              onClick={() => setActiveIndex(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                i === activeIndex
                  ? 'bg-[#f5a623] text-[#0a1628] shadow-lg shadow-[#f5a623]/20'
                  : 'bg-[#1a2a3a] text-gray-400 hover:bg-[#1a2a3a]/80 hover:text-gray-200'
              }`}
            >
              <span>{app.icon}</span>
              <span>{app.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* App Description */}
      <div className="px-4 py-2 bg-[#0d1b2a]/50 border-b border-gray-800/50 flex-shrink-0">
        <p className="text-xs text-gray-400">{activeApp.description}</p>
      </div>

      {/* Iframe Viewer — fills remaining height */}
      <div className="flex-1 relative min-h-[60vh]">
        {/* Loading State */}
        {iframeStatus === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a1628] z-10">
            <div className="w-8 h-8 border-2 border-[#f5a623]/30 border-t-[#f5a623] rounded-full animate-spin mb-3" />
            <p className="text-xs text-gray-500">Loading {activeApp.name}...</p>
          </div>
        )}

        {/* Error / Blocked State */}
        {iframeStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a1628] z-10 px-6">
            <div className="text-4xl mb-4">{activeApp.icon}</div>
            <h3 className="text-lg font-semibold text-white mb-2">{activeApp.name}</h3>
            <p className="text-sm text-gray-400 text-center mb-1">
              This app cannot be embedded directly.
            </p>
            <p className="text-xs text-gray-600 text-center mb-6 max-w-xs">
              Some sites restrict iframe embedding for security. You can open it externally instead.
            </p>
            <a
              href={activeApp.iframeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#f5a623] text-[#0a1628] rounded-lg font-medium text-sm hover:bg-[#ffd700] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Open {activeApp.name} externally
            </a>
          </div>
        )}

        {/* Iframe */}
        <iframe
          ref={iframeRef}
          key={activeApp.iframeUrl}
          src={activeApp.iframeUrl}
          title={activeApp.name}
          className="w-full h-full absolute inset-0 border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          allow="clipboard-write"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>

      {/* Action Bar */}
      <div className="flex-shrink-0 bg-[#0d1b2a] border-t border-gray-800 px-3 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* Open in new tab */}
          <a
            href={activeApp.iframeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a2a3a] rounded-lg text-xs text-gray-300 hover:bg-[#1a2a3a]/80 hover:text-white transition-colors flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Open in new tab
          </a>

          {/* Copy link */}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a2a3a] rounded-lg text-xs text-gray-300 hover:bg-[#1a2a3a]/80 hover:text-white transition-colors flex-shrink-0"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copy link
              </>
            )}
          </button>

          {/* Secondary links */}
          {activeApp.secondaryLinks?.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a2a3a] rounded-lg text-xs text-gray-300 hover:bg-[#1a2a3a]/80 hover:text-white transition-colors flex-shrink-0"
            >
              <span>{link.icon}</span>
              {link.label}
            </a>
          ))}
        </div>
      </div>

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

      {/* More Resources — Collapsible */}
      <div className="flex-shrink-0 border-t border-gray-800 bg-[#0d1b2a]">
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
            {/* Search */}
            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                placeholder="Search resources..."
                className="w-full pl-9 pr-3 py-2 bg-[#1a2a3a] rounded-lg text-xs text-white placeholder:text-gray-600 border border-gray-700/50 focus:border-[#f5a623]/40 focus:outline-none transition-colors"
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
              /* Flat search results */
              <div className="space-y-1.5">
                {filteredLinks.length === 0 && (
                  <p className="text-xs text-gray-600 py-4 text-center">No results for &ldquo;{resourceSearch}&rdquo;</p>
                )}
                {filteredLinks.map((link, i) => (
                  <ResourceLinkRow key={`${link.url}-${i}`} link={link} />
                ))}
              </div>
            ) : (
              /* Categorized view */
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

// ── Sub-components ────────────────────────────────────────────────────────────

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
