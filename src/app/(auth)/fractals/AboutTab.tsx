'use client';

import { useState, useEffect } from 'react';

export function AboutTab() {
  const [stats, setStats] = useState<{
    totalSessions: number;
    totalMembers: number;
    ogTotalSupply: number;
    ogHolders: number;
  } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [analyticsRes, leaderboardRes] = await Promise.all([
          fetch('/api/fractals/analytics'),
          fetch('/api/respect/leaderboard'),
        ]);
        const analytics = analyticsRes.ok ? await analyticsRes.json() : null;
        const leaderboard = leaderboardRes.ok ? await leaderboardRes.json() : null;
        setStats({
          totalSessions: analytics?.overview?.totalSessions ?? 0,
          totalMembers: analytics?.overview?.totalMembers ?? 0,
          ogTotalSupply: Math.round(leaderboard?.stats?.ogTotalSupply ?? 0),
          ogHolders: leaderboard?.leaderboard?.filter((e: { ogRespect: number }) => e.ogRespect > 0).length ?? 0,
        });
      } catch { /* non-critical — falls back to null and shows dashes */ }
    }
    fetchStats();
  }, []);

  const FIBONACCI = [
    { rank: '1st', x1: 55, x2: 110 },
    { rank: '2nd', x1: 34, x2: 68 },
    { rank: '3rd', x1: 21, x2: 42 },
    { rank: '4th', x1: 13, x2: 26 },
    { rank: '5th', x1: 8, x2: 16 },
    { rank: '6th', x1: 5, x2: 10 },
  ];

  const LINKS = [
    { label: 'zao.frapps.xyz', href: 'https://zao.frapps.xyz', desc: 'Submit fractal results on-chain' },
    { label: 'Eden Fractal', href: 'https://edenfractal.com', desc: 'The fractal governance community ZAO participates in' },
    { label: 'thezao.com/zao-token', href: 'https://www.thezao.com/zao-token', desc: 'ZAO Respect token info' },
    { label: 'Optimystics', href: 'https://optimystics.io', desc: 'Builders of ORDAO, Fractalgram, and the fractal toolkit' },
    { label: 'ORDAO Docs', href: 'https://optimystics.io/ordao', desc: 'How ORDAO works — consent-based governance' },
    { label: 'The Respect Game', href: 'https://optimystics.io/introducing-the-respect-game', desc: 'Learn the fundamentals' },
    { label: 'Optimism Etherscan', href: 'https://optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532', desc: 'OREC contract — verify all on-chain results' },
  ];

  return (
    <div className="pt-2 space-y-6">
      {/* What is the Respect Game */}
      <div className="bg-[#0d1b2a] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white">What is the Respect Game?</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          ZAO runs weekly fractal governance sessions where members split into groups of 3-6. Each person
          shares recent contributions for ~4 minutes. The group then ranks contributions by consensus (2/3+
          agreement required). Rankings earn Respect tokens on Optimism — permanently on-chain.
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Respect is non-transferable. It reflects real community contribution over time, and gates
          governance rights via ORDAO (Optimistic Respect-based DAO).
        </p>
      </div>

      {/* How to Play */}
      <div className="bg-[#0d1b2a] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white">How to Play</h3>
        <div className="space-y-2">
          {[
            { step: '1', title: 'Join', desc: 'Show up to a ZAO Fractal session (Mondays 6pm EST or anytime with 4+ people)' },
            { step: '2', title: 'Present', desc: 'Share what you did this week to advance music, art, and technology (~4 min)' },
            { step: '3', title: 'Rank', desc: 'Group discusses and votes on who contributed most (2/3 consensus needed)' },
            { step: '4', title: 'Earn', desc: 'Top-ranked members earn more Respect via Fibonacci scoring (110 for 1st, 10 for 6th)' },
            { step: '5', title: 'Submit', desc: 'Results are submitted on-chain to OREC on Optimism via zao.frapps.xyz' },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-[#f5a623]/20 text-[#f5a623] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{item.step}</span>
              <div>
                <p className="text-xs font-medium text-white">{item.title}</p>
                <p className="text-[10px] text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voting Criteria */}
      <div className="bg-[#0d1b2a] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white">Voting Criteria</h3>
        <p className="text-[10px] text-gray-500 mb-2">When ranking, consider who best demonstrated:</p>
        {[
          { title: 'The ZAO Vision', desc: 'Advancing music, art, and technology' },
          { title: 'Contribution', desc: 'Impactful work that pushes the collective vision forward' },
          { title: 'Collaboration', desc: 'Teamwork, uplifting others, supporting the group' },
          { title: 'Innovation', desc: 'Creative thinking, groundbreaking ideas' },
          { title: 'Onboarding', desc: 'Helping newcomers join ZAO and Web3' },
          { title: 'Supporting ZAO Community Members', desc: 'Amplifying work on socials, attending shows, buying merch, or supporting them beyond the group' },
        ].map(c => (
          <div key={c.title} className="flex gap-2">
            <span className="text-[#f5a623] text-xs mt-0.5">-</span>
            <div>
              <span className="text-xs text-white font-medium">{c.title}:</span>
              <span className="text-xs text-gray-400 ml-1">{c.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two Types of Respect */}
      <div className="bg-[#0d1b2a] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white">Two Types of Respect</h3>
        <div className="space-y-2">
          <div className="bg-[#0a1628] rounded-lg p-3 border border-white/[0.08]">
            <p className="text-xs font-medium text-white">OG ZAO Respect (ERC-20)</p>
            <p className="text-[10px] text-gray-500 mt-1">One-time distributions for intros, articles, hosting, festivals. {stats ? `${stats.ogTotalSupply.toLocaleString()} total supply, ${stats.ogHolders} holders` : 'Loading...'}.</p>
            <a href="https://optimistic.etherscan.io/token/0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#f5a623]/60 hover:text-[#f5a623] mt-1 inline-block">View on Etherscan</a>
          </div>
          <div className="bg-[#0a1628] rounded-lg p-3 border border-[#f5a623]/20">
            <p className="text-xs font-medium text-[#f5a623]">ZOR Respect (ERC-1155 via ORDAO)</p>
            <p className="text-[10px] text-gray-500 mt-1">Weekly consensus results from the Respect Game. Submitted via OREC on Optimism. Soulbound (non-transferable).</p>
            <a href="https://optimistic.etherscan.io/address/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#f5a623]/60 hover:text-[#f5a623] mt-1 inline-block">View on Etherscan</a>
          </div>
        </div>
      </div>

      {/* ZAO's Fractal History */}
      <div className="bg-[#0d1b2a] rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-white">ZAO Fractal History</h3>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-[#0a1628] rounded-lg p-2">
            <p className="text-lg font-bold text-[#f5a623]">{stats ? stats.totalSessions : '—'}</p>
            <p className="text-[10px] text-gray-500">Sessions</p>
          </div>
          <div className="bg-[#0a1628] rounded-lg p-2">
            <p className="text-lg font-bold text-white">{stats ? stats.totalMembers : '—'}</p>
            <p className="text-[10px] text-gray-500">Total Members</p>
          </div>
        </div>
        <p className="text-[10px] text-gray-500">
          Founded by Zaal, who started at Optimism Fractal (week 6), then joined Eden Fractal, and launched ZAO Fractals. ZAO is the only music-focused fractal community in the ecosystem. Active in Eden Fractal on Base alongside 25+ fractal communities worldwide.
        </p>
      </div>

      {/* ORDAO Governance Model */}
      <div className="bg-[#0d1b2a] rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-white">ORDAO Governance</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          ORDAO uses optimistic consent — proposals pass unless enough Respect-weighted opposition blocks them. No-votes carry 2x weight to protect against bad proposals. This enables active members to govern efficiently while ensuring the community can veto harmful actions.
        </p>
        <div className="flex gap-2 mt-2">
          <div className="flex-1 bg-[#0a1628] rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-400">Executive</p>
            <p className="text-xs text-white">OREC</p>
          </div>
          <div className="flex-1 bg-[#0a1628] rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-400">Judicial</p>
            <p className="text-xs text-white">Respect Game</p>
          </div>
          <div className="flex-1 bg-[#0a1628] rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-400">Built by</p>
            <p className="text-xs text-white">Optimystics</p>
          </div>
        </div>
      </div>

      <div className="bg-[#0d1b2a] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Fibonacci Scoring</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-white/[0.08]">
              <th className="text-left pb-2">Rank</th>
              <th className="text-right pb-2">1x Era</th>
              <th className="text-right pb-2">2x Era</th>
            </tr>
          </thead>
          <tbody>
            {FIBONACCI.map((row) => (
              <tr key={row.rank} className="border-b border-white/[0.08]">
                <td className="py-1.5 text-gray-300">{row.rank}</td>
                <td className="py-1.5 text-right font-mono text-[#f5a623]">{row.x1} R</td>
                <td className="py-1.5 text-right font-mono text-[#f5a623]">{row.x2} R</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-gray-600 mt-3">
          Scores follow Fibonacci sequence — each rank earns ~60% more than the next (Weber Law).
          ZAO is currently in the 2x era.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Resources</p>
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-[#0d1b2a] rounded-xl px-4 py-3 border border-white/[0.08] hover:border-[#f5a623]/30 transition-colors"
          >
            <div>
              <p className="text-sm text-white">{link.label}</p>
              <p className="text-xs text-gray-500">{link.desc}</p>
            </div>
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
