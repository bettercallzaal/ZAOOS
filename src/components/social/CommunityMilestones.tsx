'use client';

import { useState, useEffect } from 'react';

interface Milestone {
  icon: string;
  label: string;
  target: number;
  current: number;
}

const MILESTONES_CONFIG = [
  { icon: '👥', label: '50 Members', target: 50, key: 'members' },
  { icon: '🏆', label: '1,000 Total Respect', target: 1000, key: 'respect' },
  { icon: '🎙️', label: '100 Rooms Hosted', target: 100, key: 'rooms' },
  { icon: '🎵', label: '500 Tracks in Library', target: 500, key: 'tracks' },
];

export function CommunityMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [membersRes, respectRes, roomsRes, tracksRes] = await Promise.allSettled([
          fetch('/api/members/directory?limit=1', { signal: controller.signal }),
          fetch('/api/respect/leaderboard/embed?limit=1', { signal: controller.signal }),
          fetch('/api/spaces/past?days=365', { signal: controller.signal }),
          fetch('/api/music/feed?limit=1', { signal: controller.signal }),
        ]);
        const vals: Record<string, number> = { members: 0, respect: 0, rooms: 0, tracks: 0 };
        if (membersRes.status === 'fulfilled' && membersRes.value.ok) {
          const d = await membersRes.value.json();
          vals.members = d.total ?? d.members?.length ?? 0;
        }
        if (respectRes.status === 'fulfilled' && respectRes.value.ok) {
          const d = await respectRes.value.json();
          vals.respect = d.stats?.totalRespect ?? 0;
        }
        if (roomsRes.status === 'fulfilled' && roomsRes.value.ok) {
          const d = await roomsRes.value.json();
          vals.rooms = d.rooms?.length ?? d.total ?? 0;
        }
        if (tracksRes.status === 'fulfilled' && tracksRes.value.ok) {
          const d = await tracksRes.value.json();
          vals.tracks = d.total ?? d.tracks?.length ?? 0;
        }
        if (!controller.signal.aborted) {
          setMilestones(MILESTONES_CONFIG.map((m) => ({
            icon: m.icon, label: m.label, target: m.target, current: vals[m.key],
          })));
        }
      } catch { /* silent */ }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, []);

  if (loading) return (
    <div className="px-4 py-3 space-y-2">
      {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />)}
    </div>
  );
  if (!milestones.length) return null;

  return (
    <div className="px-4 py-3">
      <h3 className="text-sm font-semibold text-white mb-3">Community Milestones</h3>
      <div className="space-y-2">
        {milestones.map((m) => {
          const pct = Math.min(100, Math.round((m.current / m.target) * 100));
          const done = m.current >= m.target;
          return (
            <div key={m.label} className={`rounded-xl border p-3 ${done ? 'border-[#f5a623]/40 bg-[#f5a623]/5 shadow-[0_0_12px_rgba(245,166,35,0.15)]' : 'border-white/[0.05] bg-white/[0.03]'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm">{m.icon} {m.label}</span>
                <span className={`text-xs font-medium ${done ? 'text-[#f5a623]' : 'text-gray-400'}`}>{m.current}/{m.target}</span>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${done ? 'bg-[#f5a623]' : 'bg-[#f5a623]/50'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
