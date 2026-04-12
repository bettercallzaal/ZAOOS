'use client';

import { useState, useEffect } from 'react';

interface StakingEntry {
  address: string;
  conviction: string;
  staked: string;
  stakedFormatted: string;
  convictionFormatted: string;
  name?: string;
}

export function StakingLeaderboard() {
  const [entries, setEntries] = useState<StakingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/staking/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        setEntries(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Stakers</div>
          <div className="text-white text-xl font-bold">{entries.length}</div>
        </div>
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Staked</div>
          <div className="text-white text-xl font-bold">
            {entries.reduce((sum, e) => sum + Number(e.stakedFormatted.replace(/,/g, '')), 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Leader</div>
          <div className="text-[#f5a623] text-xl font-bold truncate">
            {entries[0]?.name || entries[0]?.address?.slice(0, 8) || '--'}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#0d1b2a] rounded-xl h-16 animate-pulse border border-white/[0.08]" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No stakers yet.</p>
          <a href="/stake" className="text-[#f5a623] text-sm mt-2 inline-block">
            Be the first to stake ZABAL
          </a>
        </div>
      ) : (
        <div className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#0d1b2a] border-b border-white/[0.08]">
                <tr>
                  <th className="text-left text-gray-500 text-xs uppercase px-4 py-3 w-12">#</th>
                  <th className="text-left text-gray-500 text-xs uppercase px-4 py-3">Staker</th>
                  <th className="text-right text-gray-500 text-xs uppercase px-4 py-3">Staked</th>
                  <th className="text-right text-gray-500 text-xs uppercase px-4 py-3">Conviction</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={entry.address} className="border-b border-white/[0.08] hover:bg-[#1a2a3a]/50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">
                        {entry.name || entry.address.slice(0, 6) + '...' + entry.address.slice(-4)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-mono">
                      {Number(entry.stakedFormatted).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-[#f5a623] font-mono">{entry.convictionFormatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-center mt-4 text-gray-600 text-xs">
        Conviction = tokens staked x seconds held
      </div>
    </div>
  );
}
