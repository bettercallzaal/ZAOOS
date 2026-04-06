'use client';

import { useState } from 'react';
import type { AgentEvent } from './constants';
import { EVENT_TYPES, getAgent } from './constants';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AgentEventRow({ event }: { event: AgentEvent }) {
  const [expanded, setExpanded] = useState(false);
  const agent = getAgent(event.agent_name);
  const config = EVENT_TYPES[event.event_type] || EVENT_TYPES.heartbeat;

  return (
    <div
      className="border-b border-white/5 py-3 px-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <span className="shrink-0 w-16 text-gray-500 text-xs">
          {timeAgo(event.created_at)}
        </span>
        <span
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
          style={{ backgroundColor: agent ? `${agent.color}20` : '#333' }}
        >
          {agent?.emoji || '?'}
        </span>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${config.color}`}>
          {config.label}
        </span>
        <span className="text-sm text-gray-300 truncate flex-1">
          {event.summary || event.event_type}
        </span>
      </div>

      {expanded && event.payload && Object.keys(event.payload).length > 0 && (
        <div className="mt-2 ml-[6.5rem] text-xs">
          <pre className="bg-black/20 rounded-lg p-3 overflow-x-auto text-gray-400 whitespace-pre-wrap">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
