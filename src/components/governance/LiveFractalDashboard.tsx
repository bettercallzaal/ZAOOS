'use client';

import { useState, useEffect, useCallback } from 'react';

interface Participant {
  user_id?: string;
  display_name: string;
  level?: number;
  respect?: number;
}

interface VoteResult {
  winner?: string;
  level?: number;
  respect?: number;
  timestamp?: string;
}

interface LiveSession {
  id: string;
  name: string;
  facilitator_name?: string | null;
  status: 'active' | 'paused' | 'completed';
  current_level?: number | null;
  participants?: Participant[] | null;
  last_vote?: VoteResult | null;
  started_at?: string | null;
  completed_at?: string | null;
  group_name?: string | null;
  notes?: string | null;
}

interface FractalLiveData {
  active: LiveSession[];
  paused: LiveSession[];
  recent: LiveSession[];
  has_active: boolean;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Live' },
  paused: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Paused' },
  completed: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Completed' },
};

const LEVEL_COLORS = [
  'text-[#f5a623]', // Level 6 (highest)
  'text-orange-400',
  'text-yellow-400',
  'text-green-400',
  'text-blue-400',
  'text-gray-400',  // Level 1 (lowest)
];

function LevelIndicator({ currentLevel }: { currentLevel: number }) {
  return (
    <div className="flex items-center gap-1">
      {[6, 5, 4, 3, 2, 1].map((level) => (
        <div
          key={level}
          className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold transition-colors ${
            level === currentLevel
              ? `${LEVEL_COLORS[6 - level]} bg-white/10 ring-1 ring-current`
              : level > currentLevel
              ? 'text-gray-700 bg-gray-800/50'
              : 'text-gray-500 bg-gray-800/30'
          }`}
        >
          {level}
        </div>
      ))}
    </div>
  );
}

function SessionCard({ session }: { session: LiveSession }) {
  const status = STATUS_STYLES[session.status] || STATUS_STYLES.active;
  const participants = session.participants || [];
  const currentLevel = session.current_level || 6;
  const startedAt = session.started_at ? new Date(session.started_at) : null;

  return (
    <div className={`bg-[#0d1b2a] rounded-xl border overflow-hidden ${
      session.status === 'active' ? 'border-green-500/30' : 'border-white/[0.08]'
    }`}>
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-medium text-white truncate">
              {session.name || session.group_name || 'Fractal Session'}
            </h3>
            <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
          {session.status === 'active' && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
          )}
        </div>

        {/* Facilitator + time */}
        <p className="text-xs text-gray-500 mt-1">
          {session.facilitator_name && (
            <span>Facilitated by {session.facilitator_name}</span>
          )}
          {startedAt && (
            <span className="text-gray-600">
              {session.facilitator_name ? ' · ' : ''}
              Started {startedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
        </p>

        {/* Level indicator */}
        {(session.status === 'active' || session.status === 'paused') && (
          <div className="mt-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Current Level</p>
            <LevelIndicator currentLevel={currentLevel} />
          </div>
        )}

        {/* Participants */}
        {participants.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">
              Participants ({participants.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {participants.map((p, i) => (
                <span
                  key={p.user_id || i}
                  className="text-[10px] text-gray-300 bg-white/5 px-2 py-0.5 rounded-full"
                >
                  {p.display_name}
                  {p.level != null && (
                    <span className="text-[#f5a623] ml-1">L{p.level}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Last vote result */}
        {session.last_vote && session.last_vote.winner && (
          <div className="mt-3 pt-2 border-t border-white/[0.08]">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Last Vote</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white font-medium">{session.last_vote.winner}</span>
              {session.last_vote.level != null && (
                <span className="text-[10px] text-[#f5a623] bg-[#f5a623]/10 px-1.5 py-0.5 rounded">
                  Level {session.last_vote.level}
                </span>
              )}
              {session.last_vote.respect != null && (
                <span className="text-[10px] text-gray-400 font-mono">
                  {session.last_vote.respect}R
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CompletedSessionRow({ session }: { session: LiveSession }) {
  const completedAt = session.completed_at ? new Date(session.completed_at) : null;
  const participants = session.participants || [];

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-[#0d1b2a] rounded-lg border border-white/[0.08]">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-300 font-medium truncate">
          {session.name || session.group_name || 'Session'}
        </p>
        <p className="text-[10px] text-gray-600">
          {completedAt
            ? completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : ''}
          {participants.length > 0 && ` · ${participants.length} members`}
          {session.facilitator_name && ` · ${session.facilitator_name}`}
        </p>
      </div>
      <span className="text-[9px] text-gray-600 bg-gray-800/50 px-1.5 py-0.5 rounded uppercase">
        Done
      </span>
    </div>
  );
}

export function LiveFractalDashboard() {
  const [data, setData] = useState<FractalLiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    fetch('/api/discord/fractal-live')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load live sessions');
        return r.json();
      })
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 10 seconds when there are active sessions
    const interval = setInterval(() => {
      fetchData();
    }, 10_000);

    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-2 pt-2">
        <div className="h-28 bg-[#0d1b2a] rounded-xl animate-pulse" />
        <div className="h-16 bg-[#0d1b2a] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-sm">Failed to load live sessions</p>
        <p className="text-xs text-gray-600 mt-1">{error}</p>
      </div>
    );
  }

  const active = data?.active || [];
  const paused = data?.paused || [];
  const recent = data?.recent || [];
  const hasLive = active.length > 0 || paused.length > 0;

  return (
    <div className="space-y-4 pt-2">
      {/* Active sessions */}
      {active.length > 0 && (
        <div className="space-y-2">
          {active.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}

      {/* Paused sessions */}
      {paused.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider">Paused</p>
          {paused.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}

      {/* No active sessions */}
      {!hasLive && (
        <div className="text-center py-10">
          <div className="mb-3">
            <svg className="w-10 h-10 mx-auto text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm font-medium">No active fractals</p>
          <p className="text-xs text-gray-600 mt-1">
            Live sessions will appear here when a fractal is in progress.
          </p>
          <p className="text-[10px] text-gray-700 mt-0.5">Auto-refreshes every 10s</p>
        </div>
      )}

      {/* Recent completed sessions */}
      {recent.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Recent Sessions</p>
          <div className="space-y-1">
            {recent.map((session) => (
              <CompletedSessionRow key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
