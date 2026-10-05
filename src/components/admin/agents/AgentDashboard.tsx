'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/db/supabase';
import type { AgentEvent, AgentStatus } from './constants';
import PipelineFlow from './PipelineFlow';
import SquadCircle from './SquadCircle';
import WarRoomFeed from './WarRoomFeed';

type View = 'squad' | 'pipeline' | 'warroom';

const VIEWS: { id: View; label: string }[] = [
  { id: 'squad', label: 'Squad Fleet' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'warroom', label: 'War Room' },
];

export default function AgentDashboard() {
  const [view, setView] = useState<View>('squad');
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRealtime, setIsRealtime] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [squadRes, feedRes] = await Promise.all([
        fetch('/api/agents/status?view=squad'),
        fetch('/api/agents/status?view=feed&limit=100'),
      ]);

      if (squadRes.ok) {
        const squadData = await squadRes.json();
        setAgents(squadData.agents || []);
      }
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        setEvents(feedData.events || []);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch agent data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Realtime subscription for agent events
  useEffect(() => {
    let supabase: ReturnType<typeof getSupabaseBrowser> | null = null;
    try {
      supabase = getSupabaseBrowser();
    } catch {
      setIsRealtime(false);
    }

    if (!supabase) return;

    const channel = supabase
      .channel('agent-dashboard-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_events',
        },
        (payload) => {
          const newEvent = payload.new as AgentEvent;
          if (!newEvent?.id) return;
          setEvents((prev) => [newEvent, ...prev.slice(0, 99)]);
          // Re-fetch squad status to reflect new state
          fetchData();
        },
      )
      .subscribe((status) => {
        setIsRealtime(status === 'SUBSCRIBED');
      });

    return () => {
      setIsRealtime(false);
      supabase?.removeChannel(channel);
    };
  }, [fetchData]);

  // Initial fetch and relaxed fallback interval
  useEffect(() => {
    fetchData();
    const intervalTime = isRealtime ? 60_000 : 30_000;
    const interval = setInterval(fetchData, intervalTime);
    return () => clearInterval(interval);
  }, [fetchData, isRealtime]);

  if (loading) {
    return (
      <div className="space-y-4">
        {['sk-1', 'sk-2', 'sk-3', 'sk-4'].map((id) => (
          <div key={id} className="h-20 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* View tabs + live status + last updated */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 bg-black/30 rounded-xl p-1 border border-white/10">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                view === v.id
                  ? 'bg-[#f5a623] text-[#0a1628] shadow-md shadow-[#f5a623]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isRealtime && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Realtime
            </span>
          )}
          {lastUpdated && (
            <span className="text-xs text-gray-500 font-mono">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Active view container */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1d35] overflow-hidden shadow-2xl">
        {view === 'squad' && <SquadCircle agents={agents} allEvents={events} />}
        {view === 'pipeline' && <PipelineFlow events={events} />}
        {view === 'warroom' && <WarRoomFeed events={events} />}
      </div>
    </div>
  );
}
