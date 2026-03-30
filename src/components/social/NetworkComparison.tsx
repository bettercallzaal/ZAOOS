'use client';

import { useState, useEffect } from 'react';

interface SharedUser {
  fid: number;
  username: string;
  pfpUrl: string | null;
}

interface CompareData {
  sharedFollowers: number;
  sharedFollowing: number;
  totalYours: number;
  totalTheirs: number;
  totalYourFollowing: number;
  totalTheirFollowing: number;
  topShared: SharedUser[];
}

interface Props {
  targetFid: number;
  targetUsername: string;
}

export function NetworkComparison({ targetFid, targetUsername }: Props) {
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!targetFid) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetch(`/api/social/compare?targetFid=${targetFid}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Failed');
        return r.json();
      })
      .then((d) => {
        if (!controller.signal.aborted) setData(d);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err?.message !== 'Failed') console.error(err);
        setError('Could not compare networks');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => { controller.abort(); };
  }, [targetFid]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4 animate-pulse">
        <div className="h-3 w-32 bg-[#1a2a3a] rounded mb-3" />
        <div className="flex justify-center gap-2">
          <div className="w-20 h-20 rounded-full bg-[#1a2a3a]" />
          <div className="w-20 h-20 rounded-full bg-[#1a2a3a]" />
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  const { sharedFollowers, sharedFollowing, totalYours, totalTheirs, topShared } = data;
  const hasShared = sharedFollowers > 0 || sharedFollowing > 0;

  if (!hasShared) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4">
        <p className="text-xs text-gray-500 text-center">
          No shared connections found with @{targetUsername}
        </p>
      </div>
    );
  }

  // Venn diagram proportions
  const maxR = 36;
  const leftR = maxR;
  const rightR = maxR;
  const overlap = Math.min(
    maxR,
    Math.max(8, (sharedFollowers / Math.max(1, Math.min(totalYours, totalTheirs))) * maxR * 2)
  );

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
        Network Overlap
      </p>

      {/* Headline stat */}
      <p className="text-sm text-white mb-4 text-center">
        You and <span className="text-[#f5a623] font-medium">@{targetUsername}</span> share{' '}
        <span className="font-bold text-[#f5a623]">{sharedFollowers}</span> follower{sharedFollowers !== 1 ? 's' : ''}
        {sharedFollowing > 0 && (
          <>, <span className="font-bold text-[#f5a623]">{sharedFollowing}</span> following</>
        )}
      </p>

      {/* Venn diagram */}
      <div className="flex justify-center mb-4">
        <svg width="180" height="90" viewBox="0 0 180 90">
          {/* Left circle — yours */}
          <circle
            cx={55}
            cy={45}
            r={leftR}
            fill="rgba(245,166,35,0.15)"
            stroke="#f5a623"
            strokeWidth={1.5}
          />
          {/* Right circle — theirs */}
          <circle
            cx={125}
            cy={45}
            r={rightR}
            fill="rgba(99,102,241,0.15)"
            stroke="#6366f1"
            strokeWidth={1.5}
          />

          {/* Labels */}
          <text x={35} y={43} textAnchor="middle" fill="#f5a623" fontSize="14" fontWeight="bold">
            {totalYours > 999 ? `${(totalYours / 1000).toFixed(1)}k` : totalYours}
          </text>
          <text x={35} y={56} textAnchor="middle" fill="#9ca3af" fontSize="8">
            You
          </text>

          <text x={145} y={43} textAnchor="middle" fill="#6366f1" fontSize="14" fontWeight="bold">
            {totalTheirs > 999 ? `${(totalTheirs / 1000).toFixed(1)}k` : totalTheirs}
          </text>
          <text x={145} y={56} textAnchor="middle" fill="#9ca3af" fontSize="8">
            @{targetUsername.length > 8 ? targetUsername.slice(0, 8) + '..' : targetUsername}
          </text>

          {/* Overlap number */}
          <text x={90} y={43} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
            {sharedFollowers}
          </text>
          <text x={90} y={56} textAnchor="middle" fill="#9ca3af" fontSize="8">
            shared
          </text>
        </svg>
      </div>

      {/* Top shared connections */}
      {topShared.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
            Top Shared Connections
          </p>
          <div className="flex flex-wrap gap-2">
            {topShared.map((u) => (
              <a
                key={u.fid}
                href={`/members/${u.username}`}
                className="flex items-center gap-1.5 bg-[#0a1628] rounded-full px-2.5 py-1 hover:bg-[#1a2a3a] transition-colors"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                  {u.pfpUrl ? (
                    <img src={u.pfpUrl} alt={u.username} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-gray-600" />
                  )}
                </div>
                <span className="text-[11px] text-gray-300">@{u.username}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default NetworkComparison;
