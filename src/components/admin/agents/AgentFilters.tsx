'use client';

import { AGENTS, EVENT_TYPES } from './constants';

export default function AgentFilters({
  agentFilter,
  typeFilter,
  onAgentChange,
  onTypeChange,
}: {
  agentFilter: string;
  typeFilter: string;
  onAgentChange: (value: string) => void;
  onTypeChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={agentFilter}
        onChange={(e) => onAgentChange(e.target.value)}
        className="bg-[#1a2a4a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 min-h-[36px]"
      >
        <option value="">All agents</option>
        {AGENTS.map((a) => (
          <option key={a.name} value={a.name}>
            {a.emoji} {a.label}
          </option>
        ))}
      </select>

      <select
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value)}
        className="bg-[#1a2a4a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 min-h-[36px]"
      >
        <option value="">All events</option>
        {Object.entries(EVENT_TYPES).map(([key, config]) => (
          <option key={key} value={key}>
            {config.icon} {config.label}
          </option>
        ))}
      </select>
    </div>
  );
}
