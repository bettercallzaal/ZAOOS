'use client';

interface StatsBarProps {
  contributors: number;
  totalRespect: number;
  topShare: number; // percentage
  leaderName: string;
}

export function StatsBar({
  contributors,
  totalRespect,
  topShare,
  leaderName,
}: StatsBarProps) {
  const stats = [
    {
      label: 'Contributors',
      value: contributors.toString(),
    },
    {
      label: 'Total Respect',
      value: totalRespect.toLocaleString(),
    },
    {
      label: 'Top Share',
      value: `${topShare.toFixed(1)}%`,
    },
    {
      label: 'Leader',
      value: leaderName || '—',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-[#0d1b2a] rounded-xl p-3 border border-white/[0.08] text-center"
        >
          <p className="text-base sm:text-lg font-bold text-white truncate">
            {s.value}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
