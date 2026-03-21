'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { communityConfig } from '@/../community.config';

const ZounzAuction = dynamic(() => import('@/components/zounz/ZounzAuction'), { ssr: false });

import Link from 'next/link';
import { ShareToFarcaster, shareTemplates } from '@/components/social/ShareToFarcaster';

const ICON_MAP: Record<string, string> = {
  magnet: '\uD83E\uDDF2',
  music: '\uD83C\uDFB5',
  castle: '\uD83C\uDFF0',
  rocket: '\uD83D\uDE80',
  coin: '\uD83E\uDE99',
  nouns: '\u2302',
  battle: '\u2694\uFE0F',
};

// Direct ZABAL-specific URLs for iframe embeds
const EMBED_URLS: Record<string, string> = {
  'SongJam': 'https://songjam.space/zabal',
  'Empire Builder': 'https://empirebuilder.world/profile/0x7234c36A71ec237c2Ae7698e8916e0735001E9Af',
  'Incented': 'https://incented.co/organizations/zabal',
  'MAGNETIQ': 'https://app.magnetiq.xyz',
  'Clanker': 'https://clanker.world',
  'ZOUNZ': 'https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883',
};

export default function EcosystemPanel() {
  const { partners } = communityConfig;
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {/* ZOUNZ Auction — Featured */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-3">ZOUNZ Auction</p>
        <ZounzAuction />
      </div>

      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs text-gray-500 uppercase tracking-wider">ZABAL Partner Apps</p>
        <ShareToFarcaster template={shareTemplates.ecosystem()} variant="compact" label="Share Ecosystem" />
        <p className="text-xs text-gray-600 px-1 mt-1">Tap a partner to open their ZABAL integration inline.</p>
      </div>

      {partners.map((partner) => {
        const isExpanded = expanded === partner.name;
        const embedUrl = EMBED_URLS[partner.name] || partner.url;
        const isInternal = embedUrl.startsWith('/');

        // Internal links (like /wavewarz) navigate directly instead of iframe
        if (isInternal) {
          return (
            <Link
              key={partner.name}
              href={embedUrl}
              className="block bg-[#0d1b2a] rounded-xl border border-gray-800 p-4 hover:border-[#f5a623]/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ICON_MAP[partner.icon] || '\uD83D\uDD17'}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white">{partner.name}</h3>
                  <p className="text-xs text-gray-400 truncate">{partner.description}</p>
                </div>
                <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </Link>
          );
        }

        return (
          <div
            key={partner.name}
            className="bg-[#0d1b2a] rounded-xl border border-gray-800 overflow-hidden transition-all"
          >
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
                </div>
                <div className="flex items-center justify-between px-4 py-2 bg-[#0d1b2a] border-t border-gray-800">
                  <p className="text-[10px] text-gray-600 truncate">{embedUrl.replace('https://', '')}</p>
                  <a
                    href={embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#f5a623] hover:text-[#ffd700] transition-colors"
                  >
                    Open in new tab
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
