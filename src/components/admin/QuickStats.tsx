'use client';

import { useState, useEffect } from 'react';

interface Stats {
  totalMembers: number;
  activeMembers: number;
  membersWithFid: number;
  membersWithoutFid: number;
  totalSessions: number;
  sessionsThisWeek: number;
  totalRespect: number;
  auditActionsThisWeek: number;
  dormantUsers: number;
}

export default function QuickStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetch('/api/admin/quick-stats')
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setStats(data);
      })
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const cards = [
    {
      label: 'Members',
      value: stats.totalMembers,
      sub: `${stats.activeMembers} active`,
    },
    {
      label: 'With FID',
      value: stats.membersWithFid,
      sub: `${stats.membersWithoutFid} missing`,
    },
    {
      label: 'Sessions',
      value: stats.totalSessions,
      sub: `${stats.sessionsThisWeek} this week`,
    },
    {
      label: 'Total Respect',
      value: stats.totalRespect.toLocaleString(),
      sub: null,
    },
    {
      label: 'Dormant 30d',
      value: stats.dormantUsers,
      sub: null,
      alert: stats.dormantUsers > 10,
    },
    {
      label: 'Admin Actions',
      value: stats.auditActionsThisWeek,
      sub: 'this week',
    },
  ];

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-2"
      >
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Quick Stats
      </button>
      {expanded && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-[#0d1b2a] rounded-xl p-3 border border-white/[0.08]"
            >
              <div
                className={`text-lg font-bold ${
                  card.alert ? 'text-red-400' : 'text-white'
                }`}
              >
                {card.value}
              </div>
              <div className="text-[10px] text-gray-400">{card.label}</div>
              {card.sub && (
                <div className="text-[10px] text-gray-500">{card.sub}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
