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
};

export default function EcosystemPage() {
  const { partners } = communityConfig;

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

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Partner Apps</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {partners.map((partner) => (
            <a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-[#0d1b2a] rounded-xl p-5 border border-gray-800 hover:border-[#f5a623]/40 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{ICON_MAP[partner.icon] || '\uD83D\uDD17'}</span>
                <h3 className="text-sm font-semibold text-white group-hover:text-[#f5a623] transition-colors">
                  {partner.name}
                </h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{partner.description}</p>
              <p className="text-[10px] text-[#f5a623]/60 mt-3 truncate">{partner.url.replace('https://', '')}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
