'use client';

import { useState } from 'react';
import Link from 'next/link';
import { communityConfig } from '../../../../community.config';
import { NotificationBell } from '@/components/navigation/NotificationBell';

const ICON_MAP: Record<string, string> = {
  magnet: '\uD83E\uDDF2',
  music: '\uD83C\uDFB5',
  castle: '\uD83C\uDFF0',
  rocket: '\uD83D\uDE80',
  coin: '\uD83E\uDE99',
};

// Direct ZABAL-specific URLs for iframe embeds
const EMBED_URLS: Record<string, string> = {
  'SongJam': 'https://songjam.space/zabal',
  'Empire Builder': 'https://empirebuilder.world/profile/0x7234c36A71ec237c2Ae7698e8916e0735001E9Af',
  'Incented': 'https://incented.co/organizations/zabal',
  'MAGNETIQ': 'https://app.magnetiq.xyz',
  'Clanker': 'https://clanker.world',
};

export default function EcosystemPage() {
  const { partners } = communityConfig;
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20">
      {/* Header */}
      <header className="px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-300">Ecosystem</h2>
          <div className="flex items-center gap-2">
            <div className="md:hidden"><NotificationBell /></div>
            <Link href="/chat" className="text-xs text-gray-500 hover:text-white md:hidden">Back to Chat</Link>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="mb-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">ZABAL Partner Apps</p>
          <p className="text-xs text-gray-600 px-1 mt-1">Tap a partner to open their ZABAL integration inline.</p>
        </div>

        <div className="space-y-3">
          {partners.map((partner) => {
            const isExpanded = expanded === partner.name;
            const embedUrl = EMBED_URLS[partner.name] || partner.url;

            return (
              <div
                key={partner.name}
                className="bg-[#0d1b2a] rounded-xl border border-gray-800 overflow-hidden transition-all"
              >
                {/* Partner card header — tap to expand/collapse */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : partner.name)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-[#0d1b2a]/80 transition-colors"
                >
                  <span className="text-2xl">{ICON_MAP[partner.icon] || '\uD83D\uDD17'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white">{partner.name}</h3>
                    <p className="text-xs text-gray-400 truncate">{partner.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={embedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-[#f5a623]/60 hover:text-[#f5a623] transition-colors"
                    >
                      Open
                    </a>
                    <svg
                      className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Iframe embed — shown when expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-800">
                    <div className="relative w-full bg-[#0a1628]" style={{ height: '70vh', minHeight: '400px' }}>
                      <iframe
                        src={embedUrl}
                        title={`${partner.name} — ZABAL Integration`}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation"
                        loading="lazy"
                        allow="clipboard-write"
                      />
                      {/* Loading overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-[#0d1b2a]/80 px-4 py-2 rounded-lg animate-pulse">
                          <p className="text-xs text-gray-400">Loading {partner.name}...</p>
                        </div>
                      </div>
                    </div>
                    {/* Action bar */}
                    <div className="flex items-center justify-between px-4 py-2 bg-[#0d1b2a] border-t border-gray-800">
                      <p className="text-[10px] text-gray-600 truncate">{embedUrl.replace('https://', '')}</p>
                      <a
                        href={embedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#f5a623] hover:text-[#ffd700] transition-colors flex items-center gap-1"
                      >
                        Open in new tab
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* $ZABAL token info */}
        <div className="bg-gradient-to-r from-[#f5a623]/10 to-[#ffd700]/5 rounded-xl p-4 border border-[#f5a623]/20 mt-6">
          <p className="text-xs text-[#f5a623] font-medium uppercase tracking-wider">$ZABAL on Base</p>
          <p className="text-xs text-gray-400 mt-1">
            Community token launched via Clanker on January 1, 2026. Powers the ZABAL coordination engine across all partner platforms.
          </p>
          <a
            href="https://basescan.org/token/0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#f5a623]/60 hover:text-[#f5a623] mt-2 inline-block"
          >
            View on Basescan
          </a>
        </div>
      </div>
    </div>
  );
}
