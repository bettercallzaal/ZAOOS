'use client';

import { useState } from 'react';
import type { AgentEvent } from './constants';
import AgentEventRow from './AgentEventRow';
import AgentFilters from './AgentFilters';

export default function WarRoomFeed({ events }: { events: AgentEvent[] }) {
  const [agentFilter, setAgentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = events.filter((e) => {
    if (agentFilter && e.agent_name !== agentFilter) return false;
    if (typeFilter && e.event_type !== typeFilter) return false;
    return true;
  });

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

      <div className="divide-y divide-white/5">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No events yet. Agents will appear here when they start logging.
          </div>
        ) : (
          filtered.map((event) => (
            <AgentEventRow key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  );
}
