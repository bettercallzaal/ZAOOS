'use client';

import { useState } from 'react';
import type { AgentEvent } from './constants';
import { getAgent, EVENT_TYPES } from './constants';
import AgentFilters from './AgentFilters';

interface TaskChain {
  id: string;
  task: string;
  steps: AgentEvent[];
}

function buildChains(events: AgentEvent[]): TaskChain[] {
  const chains: Map<string, AgentEvent[]> = new Map();

  for (const event of events) {
    if (event.event_type === 'heartbeat') continue;
    const key = event.summary?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30) || event.id;
    const existing = chains.get(key) || [];
    existing.push(event);
    chains.set(key, existing);
  }

  return Array.from(chains.entries())
    .map(([key, steps]) => ({
      id: key,
      task: steps[0]?.summary || 'Unknown task',
      steps: steps.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    }))
    .filter((chain) => chain.steps.length > 0)
    .sort((a, b) => {
      const aTime = new Date(a.steps[a.steps.length - 1].created_at).getTime();
      const bTime = new Date(b.steps[b.steps.length - 1].created_at).getTime();
      return bTime - aTime;
    })
    .slice(0, 20);
}

export default function PipelineFlow({ events }: { events: AgentEvent[] }) {
  const [agentFilter, setAgentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = events.filter((e) => {
    if (agentFilter && e.agent_name !== agentFilter) return false;
    if (typeFilter && e.event_type !== typeFilter) return false;
    return true;
  });

  const chains = buildChains(filtered);

  return (
    <div>
      <div className="px-4 py-3 border-b border-white/10">
        <AgentFilters
          agentFilter={agentFilter}
          typeFilter={typeFilter}
          onAgentChange={setAgentFilter}
          onTypeChange={setTypeFilter}
        />
      </div>

      <div className="p-4 space-y-4">
        {chains.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No task chains yet. Tasks will appear as agents work.
          </div>
        ) : (
          chains.map((chain) => (
            <div
              key={chain.id}
              className="rounded-xl border border-white/10 bg-[#1a2a4a] p-4"
            >
              <h3 className="text-sm font-semibold mb-3 text-gray-200 truncate">
                {chain.task}
              </h3>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                {chain.steps.map((step, i) => {
                  const agent = getAgent(step.agent_name);
                  const config = EVENT_TYPES[step.event_type] || EVENT_TYPES.heartbeat;
                  return (
                    <div key={step.id} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                        <span className="text-sm">{agent?.emoji}</span>
                        <div>
                          <span className="text-xs font-medium" style={{ color: agent?.color }}>
                            {agent?.label}
                          </span>
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                      {i < chain.steps.length - 1 && (
                        <span className="text-gray-600 hidden sm:inline">→</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
