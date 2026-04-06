'use client';

import { useState, useEffect } from 'react';

interface DiscordStats {
  fractal: {
    totalRespect: number;
    participationCount: number;
    bestRank: number;
    averageLevel: number;
  };
  governance: {
    proposalsCreated: number;
    votesCast: number;
    totalRespectWeight: number;
  };
}

export default function DiscordActivity({ discordId }: { discordId: string | null }) {
  const [stats, setStats] = useState<DiscordStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!discordId) {
      setLoading(false);
      return;
    }
    fetch(`/api/discord/member-stats?discord_id=${encodeURIComponent(discordId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [discordId]);

  if (!discordId || loading || !stats) return null;

  const { fractal, governance } = stats;

  // Don't render if there's no meaningful activity
  const hasActivity =
    fractal.participationCount > 0 ||
    governance.proposalsCreated > 0 ||
    governance.votesCast > 0;

  if (!hasActivity) return null;

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] p-4 mb-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Discord Activity</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* Fractal Stats */}
        {fractal.participationCount > 0 && (
          <>
            <StatCard
              icon="🔷"
              label="Fractals"
              value={fractal.participationCount}
              sub="sessions joined"
            />
            <StatCard
              icon="✨"
              label="Respect Earned"
              value={fractal.totalRespect}
              sub="cumulative"
              highlight
            />
            <StatCard
              icon="🏆"
              label="Best Finish"
              value={`#${fractal.bestRank}`}
              sub={`avg level ${fractal.averageLevel}`}
            />
          </>
        )}

        {/* Governance Stats */}
        {governance.proposalsCreated > 0 && (
          <StatCard
            icon="📝"
            label="Proposals"
            value={governance.proposalsCreated}
            sub="created"
          />
        )}
        {governance.votesCast > 0 && (
          <StatCard
            icon="🗳"
            label="Votes Cast"
            value={governance.votesCast}
            sub="on proposals"
          />
        )}
        {governance.totalRespectWeight > 0 && (
          <StatCard
            icon="⚖️"
            label="Vote Weight"
            value={governance.totalRespectWeight}
            sub="Respect used"
            highlight
          />
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-[#0a1628] rounded-lg p-3">
      <p className="text-[10px] text-gray-500 mb-1">
        {icon} {label}
      </p>
      <p className={`text-lg font-bold ${highlight ? 'text-[#f5a623]' : 'text-white'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-[9px] text-gray-600">{sub}</p>
    </div>
  );
}
