'use client';

import { useEffect, useState } from 'react';
import type { AgentStatus } from '@/components/admin/agents/constants';
import type { WidgetProps } from '@/lib/os/types';

const DEFAULT_AGENTS: { name: string; label: string; status: 'active' | 'idle' }[] = [
  { name: 'zoe', label: 'ZOE', status: 'active' },
  { name: 'zoey', label: 'ZOEY', status: 'idle' },
  { name: 'builder', label: 'BUILDER', status: 'idle' },
  { name: 'scout', label: 'SCOUT', status: 'idle' },
];

export default function AgentStatusWidget({ onExpand }: WidgetProps) {
  const [agents, setAgents] =
    useState<{ name: string; label: string; status: string }[]>(DEFAULT_AGENTS);
  const [activeCount, setActiveCount] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const res = await fetch('/api/agents/status?view=squad');
        if (res.ok && !cancelled) {
          const data = await res.json();
          const squad = (data.agents || []) as AgentStatus[];
          if (squad.length > 0) {
            setAgents(
              squad.slice(0, 4).map((a) => ({
                name: a.name,
                label: a.label,
                status: a.status,
              })),
            );
            setActiveCount(squad.filter((a) => a.status === 'active').length);
          }
        }
      } catch {
        // Fallback to default
      }
    }

    loadStatus();
    const timer = setInterval(loadStatus, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label="Open agent fleet dashboard"
      className="flex w-full flex-col gap-2 rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-left transition-all hover:bg-white/[0.06] hover:border-white/10 focus-visible:ring-2 focus-visible:ring-[#f5a623]"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-white">Agent Fleet</span>
          <span className="text-[10px] text-[#f5a623] font-bold px-1.5 py-0.2 rounded bg-[#f5a623]/10 border border-[#f5a623]/20">
            ZOE
          </span>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {activeCount > 0 ? `${activeCount} online` : 'idle'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-0.5">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium transition-colors ${
              agent.name === 'zoe'
                ? 'bg-[#f5a623]/10 text-white border-[#f5a623]/30'
                : 'bg-white/[0.04] text-white/70 border-white/5'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                agent.status === 'active'
                  ? 'bg-emerald-400'
                  : agent.status === 'error'
                    ? 'bg-red-400'
                    : agent.status === 'approval_needed'
                      ? 'bg-[#f5a623]'
                      : 'bg-gray-500'
              }`}
            />
            <span className="tracking-wider">{agent.label}</span>
          </div>
        ))}
      </div>
    </button>
  );
}
