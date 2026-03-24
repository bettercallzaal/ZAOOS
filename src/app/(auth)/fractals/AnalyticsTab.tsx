'use client';

import { useState, useEffect } from 'react';

interface Overview {
  totalRespect: number;
  totalFractalRespect: number;
  totalOGOnchain: number;
  totalZOROnchain: number;
  totalSessions: number;
  totalParticipations: number;
  uniqueParticipants: number;
  membersWithRespect: number;
  totalMembers: number;
  ogSessions: number;
  ordaoSessions: number;
}

interface TimelineEntry {
  name: string;
  date: string | null;
  era: string;
  participants: number;
}

interface RespectEntry {
  name: string;
  total: number;
  fractal: number;
  og: number;
  zor: number;
  events: number;
  hosting: number;
  bonus: number;
  sessions: number;
}

interface MemberHistory {
  sessionName: string;
  sessionDate: string | null;
  era: string;
  rank: number;
  score: number;
  participants: number;
  source: 'og' | 'ordao';
  txHash: string | null;
}

interface LedgerEntry {
  date: string | null;
  source: string;
  type: string;
  amount: number;
  detail: string;
}

interface RespectEvent {
  event_type: string;
  amount: number;
  description: string;
  event_date: string;
}

interface MemberProfile {
  member: Record<string, unknown>;
  history: MemberHistory[];
  ledger?: LedgerEntry[];
  events?: RespectEvent[];
  stats: {
    totalSessions: number;
    totalFractalRespect: number;
    firstPlace: number;
    avgRank: number;
    ogSessions: number;
    ordaoSessions: number;
  };
}

interface AnalyticsData {
  overview: Overview;
  participationTimeline: TimelineEntry[];
  respectCurve: RespectEntry[];
  topByFractal: { name: string; fractal_respect: number; fractal_count: number }[];
  topHosters: { name: string; value: number }[];
}

export function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);

  useEffect(() => {
    fetch('/api/fractals/analytics')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadMember = (walletOrName: string) => {
    setSelectedMember(walletOrName);
    setMemberLoading(true);
    fetch(`/api/fractals/member/${encodeURIComponent(walletOrName)}`)
      .then(r => r.json())
      .then(d => setMemberProfile(d))
      .catch(console.error)
      .finally(() => setMemberLoading(false));
  };

  if (loading) {
    return (
      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-[#0d1b2a] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-500 text-center py-8">Failed to load analytics.</p>;
  }

  const { overview, participationTimeline, respectCurve, topHosters } = data;
  const maxParticipants = Math.max(...participationTimeline.map(t => t.participants), 1);

  return (
    <div className="pt-2 space-y-5">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Total Respect', value: overview.totalRespect.toLocaleString(), sub: 'All sources combined' },
          { label: 'Sessions', value: overview.totalSessions.toString(), sub: `${overview.ogSessions} OG + ${overview.ordaoSessions} ORDAO` },
          { label: 'Participants', value: overview.uniqueParticipants.toString(), sub: `${overview.totalMembers} total members` },
          { label: 'On-Chain', value: `${overview.totalOGOnchain.toLocaleString()} OG`, sub: `${overview.totalZOROnchain.toLocaleString()} ZOR` },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0d1b2a] rounded-xl p-3">
            <p className="text-lg font-bold text-[#f5a623]">{stat.value}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-[10px] text-gray-600">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Era Comparison */}
      <div className="bg-[#0d1b2a] rounded-xl p-4">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Era Comparison</h3>
        <div className="flex gap-3">
          <div className="flex-1 bg-[#0a1628] rounded-lg p-3 border border-gray-800">
            <p className="text-xs text-gray-400">OG Era (1-73)</p>
            <p className="text-lg font-bold text-white">{overview.ogSessions}</p>
            <p className="text-[10px] text-gray-600">sessions, 1x/2x Fibonacci, ERC-20</p>
          </div>
          <div className="flex-1 bg-[#0a1628] rounded-lg p-3 border border-[#f5a623]/20">
            <p className="text-xs text-[#f5a623]">ORDAO Era (74+)</p>
            <p className="text-lg font-bold text-white">{overview.ordaoSessions}</p>
            <p className="text-[10px] text-gray-600">sessions, 2x Fibonacci, ERC-1155</p>
          </div>
        </div>
      </div>

      {/* Participation Timeline */}
      <div className="bg-[#0d1b2a] rounded-xl p-4">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Participation Over Time ({participationTimeline.length} sessions)
        </h3>
        <div className="flex items-end gap-px h-24 overflow-x-auto">
          {participationTimeline.map((entry, i) => {
            const height = (entry.participants / maxParticipants) * 100;
            const isOrdao = entry.era === '2x' && i >= participationTimeline.length - overview.ordaoSessions;
            return (
              <div
                key={`${entry.name}-${i}`}
                className="group relative flex-shrink-0"
                style={{ width: Math.max(4, 300 / participationTimeline.length) }}
              >
                <div
                  className={`w-full rounded-t-sm transition-colors ${
                    isOrdao ? 'bg-[#f5a623]' : 'bg-[#f5a623]/40'
                  } hover:bg-[#ffd700]`}
                  style={{ height: `${height}%` }}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-[#0a1628] border border-gray-700 rounded px-2 py-1 text-[10px] text-white whitespace-nowrap z-10">
                  {entry.name}: {entry.participants} members
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-600">Fractal 1</span>
          <span className="text-[10px] text-gray-600">Latest</span>
        </div>
      </div>

      {/* Respect Distribution */}
      <div className="bg-[#0d1b2a] rounded-xl p-4">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Respect Distribution (Top 20)
        </h3>
        <div className="space-y-1.5">
          {respectCurve.slice(0, 20).map((member, i) => {
            const maxTotal = respectCurve[0]?.total || 1;
            return (
              <button
                key={member.name}
                onClick={() => loadMember(member.name)}
                className="w-full flex items-center gap-2 text-left hover:bg-white/5 rounded-lg px-1 py-0.5 transition-colors"
              >
                <span className="w-5 text-[10px] text-gray-600 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white truncate">{member.name}</span>
                    <span className="text-[10px] text-gray-500">{member.sessions}s</span>
                  </div>
                  <div className="h-1.5 bg-[#0a1628] rounded-full mt-0.5 overflow-hidden">
                    <div className="h-full rounded-full flex">
                      <div className="bg-[#f5a623]" style={{ width: `${(member.fractal / maxTotal) * 100}%` }} />
                      <div className="bg-[#f5a623]/40" style={{ width: `${(member.events / maxTotal) * 100}%` }} />
                      <div className="bg-[#f5a623]/20" style={{ width: `${((member.hosting + member.bonus) / maxTotal) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#f5a623] shrink-0">{member.total.toLocaleString()}</span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 mt-3 text-[10px] text-gray-600">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f5a623]" /> Fractal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f5a623]/40" /> Events</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f5a623]/20" /> Hosting/Bonus</span>
        </div>
      </div>

      {/* Top Hosts */}
      {topHosters.length > 0 && (
        <div className="bg-[#0d1b2a] rounded-xl p-4">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Top Fractal Hosts</h3>
          <div className="space-y-1">
            {topHosters.slice(0, 5).map((h, i) => (
              <div key={h.name} className="flex items-center gap-2 text-xs">
                <span className="w-5 text-gray-600 text-right">{i + 1}</span>
                <span className="flex-1 text-gray-300 truncate">{h.name}</span>
                <span className="font-mono text-[#f5a623]">{h.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Drill-Down Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0d1b2a] w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[85vh] overflow-y-auto border border-gray-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-[#0d1b2a] z-10">
              <h3 className="text-sm font-semibold text-white">{selectedMember}</h3>
              <button
                onClick={() => { setSelectedMember(null); setMemberProfile(null); }}
                className="text-gray-500 hover:text-white p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {memberLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-[#0a1628] rounded animate-pulse" />)}
              </div>
            ) : memberProfile?.stats ? (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#0a1628] rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-[#f5a623]">{memberProfile.stats.totalSessions}</p>
                    <p className="text-[10px] text-gray-500">Sessions</p>
                  </div>
                  <div className="bg-[#0a1628] rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-[#f5a623]">{memberProfile.stats.totalFractalRespect}</p>
                    <p className="text-[10px] text-gray-500">Fractal R</p>
                  </div>
                  <div className="bg-[#0a1628] rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-white">{memberProfile.stats.avgRank}</p>
                    <p className="text-[10px] text-gray-500">Avg Rank</p>
                  </div>
                </div>

                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-[#f5a623]/10 text-[#f5a623]">
                    {memberProfile.stats.ogSessions} OG
                  </span>
                  <span className="px-2 py-1 rounded bg-[#f5a623]/20 text-[#f5a623]">
                    {memberProfile.stats.ordaoSessions} ORDAO
                  </span>
                  <span className="px-2 py-1 rounded bg-white/10 text-white">
                    {memberProfile.stats.firstPlace} first place
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Session History</p>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {memberProfile.history.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 bg-[#0a1628] rounded">
                        <span className={`w-6 font-bold ${
                          h.rank === 1 ? 'text-yellow-400' :
                          h.rank === 2 ? 'text-gray-300' :
                          h.rank === 3 ? 'text-amber-600' : 'text-gray-500'
                        }`}>
                          #{h.rank}
                        </span>
                        <span className="flex-1 text-gray-300 truncate">{h.sessionName}</span>
                        <span className="font-mono text-[#f5a623]">{h.score}</span>
                        {h.source === 'ordao' && (
                          <span className="text-[10px] px-1 rounded bg-[#f5a623]/10 text-[#f5a623]">on-chain</span>
                        )}
                        {h.txHash && (
                          <a
                            href={`https://optimistic.etherscan.io/tx/${h.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-[10px] text-[#f5a623]/50 hover:text-[#f5a623]"
                          >
                            tx
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Respect Ledger — full transparent timeline */}
                {memberProfile.ledger && memberProfile.ledger.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Respect Ledger</p>
                    <p className="text-[10px] text-gray-600 mb-2">Every respect point earned — when, how, and why</p>
                    <div className="space-y-1 max-h-72 overflow-y-auto">
                      {memberProfile.ledger.map((entry: { date: string | null; source: string; type: string; amount: number; detail: string }, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 bg-[#0a1628] rounded">
                          <span className="text-[10px] text-gray-600 w-16 flex-shrink-0 tabular-nums">
                            {entry.date || '—'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${
                            entry.source === 'fractal' ? 'bg-[#f5a623]/10 text-[#f5a623]' :
                            entry.source === 'event' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-purple-500/10 text-purple-400'
                          }`}>
                            {entry.source === 'fractal' ? 'Fractal' : entry.type}
                          </span>
                          <span className="flex-1 text-gray-400 truncate">{entry.detail}</span>
                          <span className="font-mono text-green-400 flex-shrink-0">+{entry.amount}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-600 mt-2">
                      Total: {memberProfile.ledger.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0)} respect from {memberProfile.ledger.length} entries
                    </p>
                  </div>
                )}

                {/* Non-fractal events breakdown */}
                {memberProfile.events && memberProfile.events.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Non-Fractal Respect</p>
                    <div className="space-y-1">
                      {memberProfile.events.map((e: { event_type: string; amount: number; description: string; event_date: string }, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 bg-[#0a1628] rounded">
                          <span className="text-[10px] text-gray-600 w-16 flex-shrink-0">{e.event_date || '—'}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 capitalize flex-shrink-0">{e.event_type}</span>
                          <span className="flex-1 text-gray-400 truncate">{e.description || e.event_type}</span>
                          <span className="font-mono text-green-400 flex-shrink-0">+{e.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="p-4 text-gray-500 text-sm">Member not found.</p>
            )}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-600 text-center">
        Data from Airtable (OG era) + ORDAO on-chain (Optimism). All on-chain data verifiable.
      </p>
    </div>
  );
}
