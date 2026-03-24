'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SessionsTab } from './SessionsTab';
import { FractalLeaderboardTab } from './FractalLeaderboardTab';
import { ProposalsTab } from './ProposalsTab';
import { AboutTab } from './AboutTab';
import { AnalyticsTab } from './AnalyticsTab';

type Tab = 'sessions' | 'leaderboard' | 'analytics' | 'proposals' | 'about';
const VALID_TABS: Tab[] = ['sessions', 'leaderboard', 'analytics', 'proposals', 'about'];

interface Props {
  currentFid: number;
  isAdmin: boolean;
}

export function FractalsClient({ currentFid, isAdmin }: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;
  const initialTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'sessions';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'sessions', label: 'Sessions' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'proposals', label: 'Proposals' },
    { id: 'about', label: 'About' },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <Link href="/home" className="text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h2 className="font-semibold text-sm text-white">Fractal Governance</h2>
          <p className="text-[10px] text-gray-500">ZAO Respect Game</p>
        </div>
        <a
          href="https://zao.frapps.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[#f5a623]/70 hover:text-[#f5a623] transition-colors border border-[#f5a623]/20 rounded px-2 py-1"
        >
          frapps.xyz
        </a>
      </header>

      <div className="flex border-b border-gray-800 bg-[#0d1b2a]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-[#f5a623] border-b-2 border-[#f5a623]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {activeTab === 'sessions' && <SessionsTab isAdmin={isAdmin} />}
        {activeTab === 'leaderboard' && <FractalLeaderboardTab currentFid={currentFid} />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'proposals' && <ProposalsTab isAdmin={isAdmin} currentFid={currentFid} />}
        {activeTab === 'about' && <AboutTab />}
      </div>
    </div>
  );
}
