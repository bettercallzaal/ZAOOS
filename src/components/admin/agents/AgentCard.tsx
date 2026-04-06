'use client';

import { useState } from 'react';
import type { AgentStatus, AgentEvent } from './constants';
import { getStatusDot, EVENT_TYPES } from './constants';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AgentCard({
  agent,
  recentEvents,
}: {
  agent: AgentStatus;
  recentEvents?: AgentEvent[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border border-white/10 bg-[#1a2a4a] p-4 cursor-pointer hover:border-white/20 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="text-2xl">{agent.emoji}</span>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1a2a4a] ${getStatusDot(agent.status)}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm">{agent.label}</h3>
            <span className="text-xs text-gray-500">{agent.role}</span>
          </div>
          <p className="text-xs text-gray-400 truncate">
            {agent.current_task ||
              (agent.last_event
                ? `${agent.last_event.summary || 'No summary'} · ${timeAgo(agent.last_event.created_at)}`
                : 'No activity')}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs text-gray-500">{agent.events_24h} events/24h</span>
        </div>
      </div>

      {expanded && recentEvents && recentEvents.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
          {recentEvents.slice(0, 10).map((event) => {
            const config = EVENT_TYPES[event.event_type] || EVENT_TYPES.heartbeat;
            return (
              <div key={event.id} className="flex items-start gap-2 text-xs">
                <span>{config.icon}</span>
                <span className="text-gray-400 shrink-0">{timeAgo(event.created_at)}</span>
                <span className="text-gray-300 truncate">{event.summary || event.event_type}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
