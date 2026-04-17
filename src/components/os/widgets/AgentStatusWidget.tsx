'use client';

import type { WidgetProps } from '@/lib/os/types';

export default function AgentStatusWidget({ size, onExpand }: WidgetProps) {
  const agents = [
    { name: 'VAULT', icon: '🏦', status: 'idle' },
    { name: 'BANKER', icon: '💰', status: 'idle' },
    { name: 'DEALER', icon: '🃏', status: 'idle' },
  ];

  return (
    <button
      type="button"
      onClick={onExpand}
      className="flex w-full flex-col gap-2 rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-left transition-colors hover:bg-white/[0.06]"
    >
      <div className="text-sm font-medium text-white">Agent Squad</div>
      <div className="flex gap-3">
        {agents.map((agent) => (
          <div key={agent.name} className="flex items-center gap-1.5">
            <span className="text-sm">{agent.icon}</span>
            <span className="text-xs text-white/50">{agent.name}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-green-400/60" />
          </div>
        ))}
      </div>
    </button>
  );
}
