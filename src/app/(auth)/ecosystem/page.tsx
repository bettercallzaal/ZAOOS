'use client';

import Link from 'next/link';
import { communityConfig } from '../../../../community.config';
import { NotificationBell } from '@/components/navigation/NotificationBell';

const ICON_MAP: Record<string, string> = {
  magnet: '\uD83E\uDDF2',
  music: '\uD83C\uDFB5',
  castle: '\uD83C\uDFF0',
  rocket: '\uD83D\uDE80',
  coin: '\uD83E\uDE99',
  battle: '\u2694\uFE0F',
};

// Direct ZABAL-specific URLs
const ZABAL_URLS: Record<string, string> = {
  'SongJam': 'https://songjam.space/zabal',
  'Empire Builder': 'https://empirebuilder.world/profile/0x7234c36A71ec237c2Ae7698e8916e0735001E9Af',
  'Incented': 'https://incented.co/organizations/zabal',
  'MAGNETIQ': 'https://app.magnetiq.xyz',
  'Clanker': 'https://clanker.world',
};

export default function EcosystemPage() {
  const { partners } = communityConfig;

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20">
      <header className="px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-300">Ecosystem</h2>
          <div className="flex items-center gap-2">
            <div className="md:hidden"><NotificationBell /></div>
            <Link href="/chat" className="text-xs text-gray-500 hover:text-white md:hidden">Back to Chat</Link>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="mb-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">ZABAL Partner Apps</p>
          <p className="text-xs text-gray-600 px-1 mt-1">Tap any card to open the ZABAL integration.</p>
        </div>

        <div className="space-y-3">
          {partners.map((partner) => {
            const zabalUrl = ZABAL_URLS[partner.name] || partner.url;
            const isInternal = zabalUrl.startsWith('/');

            const cardContent = (
              <div className="flex items-center gap-3">
                <span className="text-3xl">{ICON_MAP[partner.icon] || '\uD83D\uDD17'}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white group-hover:text-[#f5a623] transition-colors">
                    {partner.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{partner.description}</p>
                  <p className="text-[10px] text-[#f5a623]/50 mt-1 truncate">
                    {isInternal ? `zaoos.com${zabalUrl}` : zabalUrl.replace('https://', '')}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-[#f5a623] transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  {isInternal ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  )}
                </svg>
              </div>
            );

            if (isInternal) {
              return (
                <Link
                  key={partner.name}
                  href={zabalUrl}
                  className="group block bg-[#0d1b2a] rounded-xl p-5 border border-gray-800 hover:border-[#f5a623]/40 transition-all hover:bg-[#0d1b2a]/80"
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <a
                key={partner.name}
                href={zabalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-[#0d1b2a] rounded-xl p-5 border border-gray-800 hover:border-[#f5a623]/40 transition-all hover:bg-[#0d1b2a]/80"
              >
                {cardContent}
              </a>
            );
          })}
        </div>

        {/* $ZABAL token */}
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
