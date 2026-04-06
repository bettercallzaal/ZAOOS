'use client';

import { useState, useMemo } from 'react';
import { Treemap } from './Treemap';
import type { TreemapEntry } from './Treemap';
import { StatsBar } from './StatsBar';
import { MobileLeaderboard } from './MobileLeaderboard';

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

interface MindshareLeaderboardProps {
  entries: LeaderboardEntry[];
}

export function MindshareLeaderboard({ entries }: MindshareLeaderboardProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  // Compute total and mindshare %
  const totalRespect = useMemo(
    () => entries.reduce((s, e) => s + e.totalRespect, 0),
    [entries],
  );

  const treemapEntries: TreemapEntry[] = useMemo(
    () =>
      entries.map((e) => ({
        rank: e.rank,
        name: e.name,
        wallet: e.wallet,
        fid: e.fid,
        totalRespect: e.totalRespect,
        mindshare:
          totalRespect > 0 ? (e.totalRespect / totalRespect) * 100 : 0,
      })),
    [entries, totalRespect],
  );

  const leader = treemapEntries[0];
  const topShare = leader?.mindshare ?? 0;

  const selectedEntry = selectedWallet
    ? treemapEntries.find((e) => e.wallet === selectedWallet) ?? null
    : null;

  const handleSelect = (entry: TreemapEntry | null) => {
    setSelectedWallet(entry?.wallet ?? null);
  };

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <StatsBar
        contributors={entries.length}
        totalRespect={totalRespect}
        topShare={topShare}
        leaderName={leader?.name ?? '—'}
      />

      {/* Desktop treemap (hidden on mobile) */}
      <div className="hidden sm:block bg-[#0d1b2a] rounded-xl border border-white/[0.08] overflow-hidden p-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-1">
          Mindshare Map
        </p>
        <Treemap
          entries={treemapEntries}
          onSelect={handleSelect}
          selected={selectedWallet}
        />
      </div>

      {/* Mobile cascade (hidden on desktop) */}
      <div className="sm:hidden">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-1">
          Mindshare
        </p>
        <MobileLeaderboard
          entries={treemapEntries}
          onSelect={handleSelect}
          selected={selectedWallet}
        />
      </div>

      {/* Selected member callout */}
      {selectedEntry && (
        <div className="bg-[#f5a623]/10 rounded-xl border border-[#f5a623]/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#f5a623]">
                {selectedEntry.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                #{selectedEntry.rank} &middot;{' '}
                {selectedEntry.totalRespect.toLocaleString()} R
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#f5a623]">
                {selectedEntry.mindshare.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500">mindshare</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedWallet(null)}
            className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Full member table */}
      <div className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.08]">
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            All Members
          </p>
        </div>
        <div className="divide-y divide-gray-800/60">
          {treemapEntries.map((e) => {
            const isSelected = selectedWallet === e.wallet;
            return (
              <button
                key={e.wallet || e.name}
                type="button"
                onClick={() => handleSelect(isSelected ? null : e)}
                className={`w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#f5a623]/5 ${
                  isSelected ? 'bg-[#f5a623]/10' : ''
                }`}
              >
                {/* Rank */}
                <span className="text-xs text-gray-500 w-6 text-center flex-shrink-0 font-medium">
                  {e.rank}
                </span>
                {/* Name */}
                <span
                  className={`flex-1 text-sm font-medium truncate ${
                    isSelected ? 'text-[#f5a623]' : 'text-white'
                  }`}
                >
                  {e.name}
                </span>
                {/* Mindshare bar */}
                <div className="hidden sm:flex items-center gap-2 w-32">
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f5a623] rounded-full"
                      style={{ width: `${Math.min(e.mindshare, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-12 text-right">
                    {e.mindshare.toFixed(1)}%
                  </span>
                </div>
                {/* Respect */}
                <span className="text-sm font-semibold text-white flex-shrink-0">
                  {e.totalRespect.toLocaleString()}
                </span>
                {/* Mobile share */}
                <span className="sm:hidden text-xs text-[#f5a623]/70 flex-shrink-0">
                  {e.mindshare.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
