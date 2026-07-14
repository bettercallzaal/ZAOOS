'use client';

import { useEffect, useState } from 'react';

interface Session {
  id: string;
  name: string;
  session_date: string | null;
}

interface Member {
  name: string;
  wallet: string | null;
  fid: number | null;
  totalRespect: number;
}

interface MatrixCell {
  memberId: string;
  sessionId: string;
  score: number;
}

interface MatrixData {
  sessions: Session[];
  members: Member[];
  cells: MatrixCell[];
  stats: {
    totalSessions: number;
    totalMembers: number;
    totalRespect: number;
  };
}

export function WeeksTab() {
  const [data, setData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/fractals/matrix')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-[#0d1b2a] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-500 text-center py-8">Failed to load weeks data.</p>;
  }

  const { sessions, members, cells, stats } = data;

  // Build a map of session_id -> cumulative respect (for growth chart)
  const cumulativeBySession: Record<string, number> = {};
  let runningTotal = 0;
  for (const session of sessions) {
    const sessionTotal = cells
      .filter((c) => c.sessionId === session.id)
      .reduce((sum, c) => sum + c.score, 0);
    runningTotal += sessionTotal;
    cumulativeBySession[session.id] = runningTotal;
  }

  // Build a map of (member_id, session_id) -> score for quick lookup
  const scoreMap = new Map<string, number>();
  for (const cell of cells) {
    scoreMap.set(`${cell.memberId}|${cell.sessionId}`, cell.score);
  }

  // Calculate max score for heatmap color intensity
  const maxScore = Math.max(...cells.map((c) => c.score), 1);
  const maxCumulative = Math.max(...Object.values(cumulativeBySession), 1);

  // Function to get color intensity (0-1) based on score
  const getIntensity = (score: number): number => {
    return score > 0 ? Math.min(score / maxScore, 1) : 0;
  };

  // Function to get gold color based on intensity
  const getGoldColor = (intensity: number): string => {
    if (intensity === 0) return 'rgba(245, 166, 35, 0.1)';
    // Gold #f5a623 with varying opacity: 0.1 to 1
    return `rgba(245, 166, 35, ${0.2 + intensity * 0.8})`;
  };

  // Render growth chart as SVG
  const chartWidth = 300;
  const chartHeight = 120;
  const paddingX = 40;
  const paddingY = 20;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingY * 2;

  const points = sessions.map((session, i) => {
    const x = paddingX + (i / Math.max(sessions.length - 1, 1)) * plotWidth;
    const y = paddingY + plotHeight - (cumulativeBySession[session.id] / maxCumulative) * plotHeight;
    return { x, y, value: cumulativeBySession[session.id] };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="pt-2 space-y-5">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          {
            label: 'Total Respect',
            value: stats.totalRespect.toLocaleString(),
            sub: 'Community cumulative',
          },
          {
            label: 'Weeks',
            value: stats.totalSessions.toString(),
            sub: 'Fractal sessions',
          },
          {
            label: 'People',
            value: stats.totalMembers.toString(),
            sub: 'Participants',
          },
          {
            label: 'Avg/Week',
            value:
              stats.totalSessions > 0
                ? Math.round(stats.totalRespect / stats.totalSessions).toString()
                : '0',
            sub: 'Respect per session',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#0d1b2a] rounded-xl p-3">
            <p className="text-lg font-bold text-[#f5a623]">{stat.value}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-[10px] text-gray-600">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Cumulative Growth Chart */}
      <div className="bg-[#0d1b2a] rounded-xl p-4">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Community Respect Growth
        </h3>
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingY + plotHeight * (1 - pct);
            return (
              <line
                key={`grid-${i}`}
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={1}
              />
            );
          })}

          {/* Line chart */}
          <path d={pathData} stroke="#f5a623" strokeWidth={2} fill="none" />

          {/* Area under curve */}
          <path
            d={`${pathData} L ${paddingX + plotWidth} ${paddingY + plotHeight} L ${paddingX} ${paddingY + plotHeight} Z`}
            fill="rgba(245, 166, 35, 0.1)"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <circle key={`point-${i}`} cx={p.x} cy={p.y} r={3} fill="#f5a623" />
          ))}
        </svg>
        <div className="flex justify-between mt-1 text-[10px] text-gray-600">
          <span>Week 1</span>
          <span>Latest</span>
        </div>
      </div>

      {/* People x Weeks Heatmap */}
      <div className="bg-[#0d1b2a] rounded-xl p-4">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Respect by Person & Week ({members.length} people, {sessions.length} weeks)
        </h3>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header row with week labels */}
            <div className="flex mb-1">
              <div className="w-32 flex-shrink-0" />
              {sessions.map((session, i) => (
                <div
                  key={session.id}
                  className="flex-shrink-0 w-8 text-center"
                  title={session.session_date ? new Date(session.session_date).toLocaleDateString() : 'Unknown'}
                >
                  <span className="text-[9px] text-gray-600">{i + 1}</span>
                </div>
              ))}
            </div>

            {/* Heatmap rows */}
            {members.map((member) => (
              <div key={member.name} className="flex mb-px">
                {/* Member name - sticky column */}
                <div className="w-32 flex-shrink-0 pr-2 text-left">
                  <span
                    className="text-[10px] text-gray-300 truncate block hover:text-white transition-colors"
                    title={member.name}
                  >
                    {member.name}
                  </span>
                  <span className="text-[8px] text-gray-600">
                    {member.totalRespect.toLocaleString()}
                  </span>
                </div>

                {/* Score cells */}
                {sessions.map((session) => {
                  const score = scoreMap.get(`${member.name}|${session.id}`) || 0;
                  const cellId = `${member.name}|${session.id}`;
                  return (
                    <div
                      key={cellId}
                      className="flex-shrink-0 w-8 h-8 rounded-sm cursor-pointer transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: getGoldColor(getIntensity(score)),
                      }}
                      onMouseEnter={() => setHoveredCell(cellId)}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={score > 0 ? `${member.name}: ${score}` : 'No participation'}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 text-[10px] text-gray-600">
          <p>Cell color intensity = respect earned that week. Darker = higher.</p>
        </div>
      </div>

      <p className="text-[10px] text-gray-600 text-center">
        Data from Fractal sessions. Updated weekly.
      </p>
    </div>
  );
}
