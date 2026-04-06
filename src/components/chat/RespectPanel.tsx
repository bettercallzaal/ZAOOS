'use client';

import { useEffect, useState } from 'react';
import { useEscapeClose } from '@/hooks/useEscapeClose';

interface RespectEntry {
  rank: number;
  name: string;
  wallet: string;
  fid: number | null;
  username: string | null;
  ogRespect: number;
  zorRespect: number;
  totalRespect: number;
}

interface RespectData {
  leaderboard: RespectEntry[];
  stats: { totalMembers: number; totalOG: number; totalZOR: number };
  currentFid: number;
}

interface RespectPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RespectPanel({ isOpen, onClose }: RespectPanelProps) {
  const [data, setData] = useState<RespectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEscapeClose(onClose, isOpen);

   
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/respect/leaderboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen]);
   

  if (!isOpen) return null;

  const myEntry = data?.leaderboard.find((e) => e.fid === data.currentFid);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0a1628] z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] bg-[#0d1b2a] flex-shrink-0">
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close respect panel">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="font-semibold text-sm text-gray-300">Fractal Respect</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {myEntry && (
            <div className="bg-gradient-to-r from-[#f5a623]/10 to-[#ffd700]/5 rounded-xl p-5 border border-[#f5a623]/30">
              <p className="text-xs text-[#f5a623] uppercase tracking-wider mb-3">Your Respect</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-white">{myEntry.totalRespect.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {myEntry.ogRespect > 0 && `${myEntry.ogRespect.toLocaleString()} OG`}
                    {myEntry.ogRespect > 0 && myEntry.zorRespect > 0 && ' + '}
                    {myEntry.zorRespect > 0 && `${myEntry.zorRespect.toLocaleString()} ZOR`}
                    {myEntry.totalRespect === 0 && 'No respect earned yet'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-[#f5a623]">#{myEntry.rank}</p>
                  <p className="text-xs text-gray-400">of {data?.stats.totalMembers}</p>
                </div>
              </div>
            </div>
          )}

          {data && !myEntry && !loading && (
            <div className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] text-center">
              <p className="text-sm text-gray-400">
                Your wallet isn&apos;t linked yet. Ask an admin to add your FID to the allowlist.
              </p>
            </div>
          )}

          {data && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0d1b2a] rounded-xl p-3 border border-white/[0.08] text-center">
                <p className="text-xl font-bold text-white">{data.stats.totalMembers}</p>
                <p className="text-xs text-gray-500 mt-1">Members</p>
              </div>
              <div className="bg-[#0d1b2a] rounded-xl p-3 border border-white/[0.08] text-center">
                <p className="text-xl font-bold text-white">{data.stats.totalOG.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">OG Respect</p>
              </div>
              <div className="bg-[#0d1b2a] rounded-xl p-3 border border-white/[0.08] text-center">
                <p className="text-xl font-bold text-white">{data.stats.totalZOR.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">ZOR Respect</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading onchain data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          ) : data && data.leaderboard.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Leaderboard</p>
              {data.leaderboard.map((entry) => {
                const isMe = entry.fid === data.currentFid;
                return (
                  <div
                    key={entry.fid ?? entry.wallet}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                      isMe
                        ? 'bg-[#f5a623]/10 border-[#f5a623]/30'
                        : entry.rank <= 3
                          ? 'bg-[#f5a623]/5 border-[#f5a623]/20'
                          : 'bg-[#0d1b2a] border-white/[0.08]'
                    }`}
                  >
                    <span className="text-lg font-bold w-8 text-center">
                      {entry.rank === 1 ? '\uD83E\uDD47' : entry.rank === 2 ? '\uD83E\uDD48' : entry.rank === 3 ? '\uD83E\uDD49' : entry.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? 'text-[#f5a623]' : 'text-white'}`}>
                        {entry.name}{isMe && ' (you)'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {entry.username ? `@${entry.username}` : entry.fid ? `FID ${entry.fid}` : `${entry.wallet.slice(0, 6)}...${entry.wallet.slice(-4)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isMe ? 'text-[#f5a623]' : 'text-white'}`}>
                        {entry.totalRespect.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {entry.ogRespect > 0 && `${entry.ogRespect.toLocaleString()} OG`}
                        {entry.ogRespect > 0 && entry.zorRespect > 0 && ' + '}
                        {entry.zorRespect > 0 && `${entry.zorRespect.toLocaleString()} ZOR`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No respect data found.</p>
            </div>
          )}

          <p className="text-xs text-gray-600 text-center">
            Live onchain data from Optimism. Refreshes every 5 minutes.
          </p>
        </div>
      </div>
    </>
  );
}
