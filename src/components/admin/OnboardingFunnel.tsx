'use client';

import { useEffect, useState } from 'react';

interface FunnelStage {
  stage: string;
  count: number;
  description: string;
}

export default function OnboardingFunnel() {
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFunnel() {
      try {
        const res = await fetch('/api/admin/onboarding-funnel');
        if (!res.ok) throw new Error('Failed to load funnel data');
        const data = await res.json();
        setStages(data.stages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchFunnel();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-[#0d1b2a] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-[#0d1b2a] p-4 text-red-400">
        {error}
      </div>
    );
  }

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-400 mb-4">
        Member journey from invite to active contributor. Drop-offs show where
        people get stuck.
      </p>

      {stages.map((stage, i) => {
        const prev = i > 0 ? stages[i - 1] : null;
        const dropCount = prev ? prev.count - stage.count : 0;
        const dropPct =
          prev && prev.count > 0
            ? ((prev.count - stage.count) / prev.count) * 100
            : 0;

        return (
          <div key={stage.stage}>
            {prev && dropCount > 0 && (
              <div className="flex items-center gap-2 py-1 px-3 text-xs text-red-400">
                <span>&#9660;</span>
                <span>
                  -{dropPct.toFixed(0)}% ({dropCount} dropped)
                </span>
              </div>
            )}

            <div className="rounded-lg bg-[#0d1b2a] p-3">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-sm font-medium text-white">
                    {stage.stage}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    {stage.description}
                  </span>
                </div>
                <span className="text-sm font-bold text-[#f5a623]">
                  {stage.count}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#0a1628] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#f5a623] transition-all duration-500"
                  style={{
                    width: `${(stage.count / maxCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
