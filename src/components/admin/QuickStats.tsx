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
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[#0d1b2a] rounded-xl p-3 border border-gray-800/50"
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
  );
}
