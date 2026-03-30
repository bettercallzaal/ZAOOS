'use client';

import { useState, useEffect } from 'react';

interface Stats {
  totalMembers: number;
  activeThisWeek: number;
  totalRespect: number;
  roomsToday: number;
}

export function CommunityStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [membersRes, respectRes, roomsRes] = await Promise.allSettled([
          fetch('/api/members/directory?limit=10&active_since=7d', { signal: controller.signal }),
          fetch('/api/respect/leaderboard/embed?limit=1', { signal: controller.signal }),
          fetch('/api/spaces/past?days=1', { signal: controller.signal }),
        ]);

        let totalMembers = 0;
        let activeThisWeek = 0;
        if (membersRes.status === 'fulfilled' && membersRes.value.ok) {
          const data = await membersRes.value.json();
          activeThisWeek = data.total ?? data.members?.length ?? 0;
        }
        // Fetch total count separately (no active_since filter)
        const totalRes = await fetch('/api/members/directory?limit=10', { signal: controller.signal });
        if (totalRes.ok) {
          const totalData = await totalRes.json();
          totalMembers = totalData.total ?? totalData.members?.length ?? 0;
        }

        let totalRespect = 0;
        if (respectRes.status === 'fulfilled' && respectRes.value.ok) {
          const data = await respectRes.value.json();
          totalRespect = data.stats?.totalRespect ?? 0;
        }

        let roomsToday = 0;
        if (roomsRes.status === 'fulfilled' && roomsRes.value.ok) {
          const data = await roomsRes.value.json();
          roomsToday = data.rooms?.length ?? 0;
        }

        if (!controller.signal.aborted) {
          setStats({ totalMembers, activeThisWeek, totalRespect, roomsToday });
        }
      } catch {
        // silently fail
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 px-4 py-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 animate-pulse">
            <div className="h-5 bg-gray-800 rounded w-12 mb-1" />
            <div className="h-3 bg-gray-800 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { value: stats.totalMembers, label: 'Total Members' },
    { value: stats.activeThisWeek, label: 'Active This Week' },
    { value: stats.totalRespect.toLocaleString(), label: 'Total Respect' },
    { value: stats.roomsToday, label: 'Rooms Today' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 px-4 py-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
          <p className="text-lg font-bold text-[#f5a623]">{card.value}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
