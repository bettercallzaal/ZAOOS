'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AgentStatus, AgentEvent } from './constants';
import SquadCircle from './SquadCircle';
import WarRoomFeed from './WarRoomFeed';
import PipelineFlow from './PipelineFlow';

type View = 'squad' | 'pipeline' | 'warroom';

const VIEWS: { id: View; label: string; icon: string }[] = [
  { id: 'squad', label: 'Squad', icon: '⭕' },
  { id: 'pipeline', label: 'Pipeline', icon: '➡️' },
  { id: 'warroom', label: 'War Room', icon: '📡' },
];

export default function AgentDashboard() {
  const [view, setView] = useState<View>('squad');
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [squadRes, feedRes] = await Promise.all([
        fetch('/api/admin/agents/status?view=squad'),
        fetch('/api/admin/agents/status?view=feed&limit=100'),
      ]);

      if (squadRes.ok) {
        const squadData = await squadRes.json();
        setAgents(squadData.agents);
      }
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        setEvents(feedData.events);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch agent data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* View tabs + last updated */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-black/20 rounded-lg p-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === v.id
                  ? 'bg-[#f5a623] text-[#0a1628]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="mr-1">{v.icon}</span>
              {v.label}
            </button>
          ))}
        </div>
        {lastUpdated && (
          <span className="text-xs text-gray-500">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Active view */}
      <div className="rounded-xl border border-white/10 bg-[#0f1d35] overflow-hidden">
        {view === 'squad' && <SquadCircle agents={agents} allEvents={events} />}
        {view === 'pipeline' && <PipelineFlow events={events} />}
        {view === 'warroom' && <WarRoomFeed events={events} />}
      </div>
    </div>
  );
}
