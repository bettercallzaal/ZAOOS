'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type Tab = 'active' | 'respect' | 'rooms';

interface LeaderEntry {
  rank: number;
  name: string;
  avatar: string | null;
  score: string;
}

export function CommunityLeaderboards() {
  const [tab, setTab] = useState<Tab>('active');
  const [data, setData] = useState<Record<Tab, LeaderEntry[]>>({ active: [], respect: [], rooms: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [activeRes, respectRes, roomsRes] = await Promise.allSettled([
          fetch('/api/members/directory?limit=5&sort=active', { signal: controller.signal }),
          fetch('/api/respect/leaderboard/embed?limit=5', { signal: controller.signal }),
          fetch('/api/spaces/hosts?limit=5', { signal: controller.signal }),
        ]);

        const result: Record<Tab, LeaderEntry[]> = { active: [], respect: [], rooms: [] };

        if (activeRes.status === 'fulfilled' && activeRes.value.ok) {
          const d = await activeRes.value.json();
          result.active = (d.members || []).slice(0, 5).map((m: { display_name?: string; username?: string; pfp_url?: string; cast_count?: number }, i: number) => ({
            rank: i + 1,
            name: m.display_name || m.username || 'Unknown',
            avatar: m.pfp_url || null,
            score: `${m.cast_count ?? 0} casts`,
          }));
        }

        if (respectRes.status === 'fulfilled' && respectRes.value.ok) {
          const d = await respectRes.value.json();
          result.respect = (d.leaderboard || []).slice(0, 5).map((e: { rank: number; name: string; pfpUrl?: string; totalRespect: number }) => ({
            rank: e.rank,
            name: e.name,
            avatar: e.pfpUrl || null,
            score: `${e.totalRespect.toLocaleString()} R`,
          }));
        }

        if (roomsRes.status === 'fulfilled' && roomsRes.value.ok) {
          const d = await roomsRes.value.json();
          result.rooms = (d.hosts || []).slice(0, 5).map((h: { display_name?: string; username?: string; pfp_url?: string; room_count?: number }, i: number) => ({
            rank: i + 1,
            name: h.display_name || h.username || 'Unknown',
            avatar: h.pfp_url || null,
            score: `${h.room_count ?? 0} rooms`,
          }));
        }

        if (!controller.signal.aborted) setData(result);
      } catch { /* silent */ }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'active', label: 'Most Active' },
    { key: 'respect', label: 'Top Respect' },
    { key: 'rooms', label: 'Room Heroes' },
  ];

  const entries = data[tab];
  const hasRooms = data.rooms.length > 0;
  const visibleTabs = hasRooms ? tabs : tabs.filter((t) => t.key !== 'rooms');

  if (loading) return (
    <div className="px-4 py-3">
      <div className="h-48 rounded-xl bg-white/[0.03] animate-pulse" />
    </div>
  );

  return (
    <div className="px-4 py-3">
      <h3 className="text-sm font-semibold text-white mb-2">Leaderboards</h3>
      {/* Tab switcher */}
      <div className="flex gap-1 mb-3">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              tab === t.key
                ? 'bg-[#f5a623]/10 text-[#f5a623] font-medium'
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Entries */}
      {entries.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-6">No data available yet</p>
      ) : (
        <div className="space-y-1">
          {entries.map((e) => (
            <div key={`${e.rank}-${e.name}`} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <span className={`w-5 text-xs font-bold text-center ${e.rank <= 3 ? 'text-[#f5a623]' : 'text-gray-600'}`}>
                {e.rank}
              </span>
              {e.avatar ? (
                <Image src={e.avatar} alt="" width={28} height={28} className="rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-[10px] text-gray-500">?</div>
              )}
              <span className="text-sm text-white truncate flex-1">{e.name}</span>
              <span className="text-xs text-gray-400 tabular-nums">{e.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
