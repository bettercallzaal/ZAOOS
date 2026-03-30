'use client';

import { useState, useEffect } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function cellColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'bg-white/[0.03]';
  const ratio = value / max;
  if (ratio < 0.25) return 'bg-[#f5a623]/10';
  if (ratio < 0.5) return 'bg-[#f5a623]/25';
  if (ratio < 0.75) return 'bg-[#f5a623]/50';
  return 'bg-[#f5a623]/80';
}

export function EngagementHeatmap() {
  const [heatmap, setHeatmap] = useState<number[][] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/social/engagement-heatmap', { signal: controller.signal })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.heatmap) setHeatmap(data.heatmap); })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-3">
        <div className="h-40 rounded-xl bg-white/[0.03] animate-pulse" />
      </div>
    );
  }

  if (!heatmap) return null;

  const max = Math.max(...heatmap.flat(), 1);

  return (
    <div className="px-4 py-3">
      <h3 className="text-sm font-semibold text-white mb-2">Follower Activity Heatmap</h3>
      <p className="text-[10px] text-gray-500 mb-3">When your followers are most active (UTC)</p>
      <div className="overflow-x-auto">
        <div className="min-w-[480px]">
          {/* Hour labels */}
          <div className="flex ml-8 mb-1">
            {HOURS.map((h) => (
              <div key={h} className="flex-1 text-center text-[8px] text-gray-600">
                {h % 3 === 0 ? `${h}` : ''}
              </div>
            ))}
          </div>
          {/* Grid rows */}
          {DAYS.map((day, di) => (
            <div key={day} className="flex items-center gap-1 mb-0.5">
              <span className="w-7 text-[9px] text-gray-500 text-right shrink-0">{day}</span>
              <div className="flex flex-1 gap-0.5">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className={`flex-1 aspect-square rounded-sm ${cellColor(heatmap[di][h], max)} transition-colors`}
                    title={`${day} ${h}:00 — ${heatmap[di][h]} casts`}
                  />
                ))}
              </div>
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-2">
            <span className="text-[8px] text-gray-600">Less</span>
            {['bg-white/[0.03]', 'bg-[#f5a623]/10', 'bg-[#f5a623]/25', 'bg-[#f5a623]/50', 'bg-[#f5a623]/80'].map((c) => (
              <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span className="text-[8px] text-gray-600">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
