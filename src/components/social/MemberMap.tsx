'use client';

import { useState, useEffect, useMemo } from 'react';

interface Member {
  displayName: string;
  location: string | null;
}

/** Group members by location and show counts */
export function MemberMap() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/members/directory?limit=200', { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (!controller.signal.aborted) setMembers(data.members || []);
      })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const { groups, totalLocations } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of members) {
      if (!m.location) continue;
      // Normalize: trim, title-case first word
      const loc = m.location.trim();
      if (!loc) continue;
      counts[loc] = (counts[loc] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return { groups: sorted, totalLocations: sorted.length };
  }, [members]);

  if (loading) {
    return (
      <div className="mx-4 my-3 rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-32 mb-3" />
        <div className="h-3 bg-gray-800 rounded w-48" />
      </div>
    );
  }

  if (groups.length === 0) return null;

  const withLocation = groups.reduce((sum, [, c]) => sum + c, 0);

  return (
    <div className="mx-4 my-3 rounded-xl bg-white/[0.03] border border-white/[0.05] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <svg className="w-4 h-4 text-[#f5a623]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          Member Map
        </h3>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
          {totalLocations} location{totalLocations !== 1 ? 's' : ''} &middot; {withLocation} member{withLocation !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {groups.map(([loc, count]) => (
          <span
            key={loc}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#f5a623]" />
            {loc}
            {count > 1 && <span className="text-[10px] text-[#f5a623]/70">({count})</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
