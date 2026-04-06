'use client';

import { useState, useEffect } from 'react';
import { RespectLeaderboard } from './RespectLeaderboard';
import dynamic from 'next/dynamic';

const MindshareLeaderboard = dynamic(
  () =>
    import('@/components/respect/MindshareLeaderboard').then(
      (m) => m.MindshareLeaderboard,
    ),
  { ssr: false },
);

const SongjamLeaderboard = dynamic(
  () =>
    import('@/components/respect/SongjamLeaderboard').then(
      (m) => m.SongjamLeaderboard,
    ),
  { ssr: false },
);

interface LeaderboardEntry {
  rank: number;
  name: string;
  wallet: string;
  fid: number | null;
  totalRespect: number;
  fractalRespect: number;
  fractalCount: number;
  onchainOG: number;
  onchainZOR: number;
  firstRespectAt: string | null;
  eventRespect: number;
  hostingRespect: number;
  bonusRespect: number;
  hostingCount: number;
}

type Tab = 'leaderboard' | 'mindshare' | 'songjam';

interface RespectPageClientProps {
  currentFid: number;
}

export function RespectPageClient({ currentFid }: RespectPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/respect/leaderboard');
        if (!res.ok) return;
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      } catch {
        // silently fail — each sub-component handles its own errors
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'mindshare', label: 'Mindshare' },
    { id: 'songjam', label: 'Songjam' },
  ];

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-1 bg-[#0d1b2a] rounded-xl p-1 border border-white/[0.08]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#f5a623] text-[#0a1628]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'leaderboard' && (
        <RespectLeaderboard currentFid={currentFid} />
      )}

      {activeTab === 'mindshare' && (
        <>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm mt-3">Loading mindshare data...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No respect data found.</p>
            </div>
          ) : (
            <MindshareLeaderboard entries={leaderboard} />
          )}
        </>
      )}

      {activeTab === 'songjam' && <SongjamLeaderboard />}
    </>
  );
}
