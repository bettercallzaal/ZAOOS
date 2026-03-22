'use client';

import { useState, useEffect } from 'react';

interface FractalScore {
  id: string;
  member_name: string;
  wallet_address: string | null;
  rank: number;
  score: number;
}

interface FractalSession {
  id: string;
  session_date: string;
  name: string;
  host_name: string | null;
  scoring_era: string;
  participant_count: number;
  notes: string | null;
  fractal_scores: FractalScore[];
}

const RANK_COLORS = ['text-yellow-400', 'text-gray-300', 'text-amber-600', 'text-gray-400', 'text-gray-500', 'text-gray-600'];
const RANK_LABELS = ['1st', '2nd', '3rd', '4th', '5th', '6th'];

interface Props {
  isAdmin: boolean;
}

export function SessionsTab({ isAdmin }: Props) {
  const [sessions, setSessions] = useState<FractalSession[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/fractals/sessions?limit=20')
      .then((r) => r.json())
      .then((d) => {
        setSessions(d.sessions ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-[#0d1b2a] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">No fractal sessions recorded yet.</p>
        {isAdmin && (
          <p className="text-xs text-gray-600 mt-2">Admins can record sessions via the admin panel.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-[#0d1b2a] rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-[#f5a623]">{total}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Sessions</p>
        </div>
        <div className="flex-1 bg-[#0d1b2a] rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-[#f5a623]">
            {sessions.reduce((sum, s) => sum + s.participant_count, 0)}
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Participations</p>
        </div>
      </div>

      {sessions.map((session) => {
        const isExpanded = expanded === session.id;
        const sorted = [...session.fractal_scores].sort((a, b) => a.rank - b.rank);

        return (
          <div key={session.id} className="bg-[#0d1b2a] rounded-xl border border-gray-800 overflow-hidden">
            <button
              onClick={() => setExpanded(isExpanded ? null : session.id)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(session.session_date + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                  {session.host_name && ` · Host: ${session.host_name}`}
                  {' · '}
                  <span className="text-[#f5a623]/70">{session.scoring_era} era</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">{session.participant_count} members</span>
                <svg
                  className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isExpanded && sorted.length > 0 && (
              <div className="border-t border-gray-800 px-4 py-3 space-y-2">
                {sorted.map((score) => (
                  <div key={score.id} className="flex items-center gap-3">
                    <span className={`w-8 text-xs font-bold ${RANK_COLORS[score.rank - 1] ?? 'text-gray-500'}`}>
                      {RANK_LABELS[score.rank - 1] ?? `#${score.rank}`}
                    </span>
                    <span className="flex-1 text-sm text-gray-200 truncate">{score.member_name}</span>
                    <span className="text-xs font-mono text-[#f5a623]">{score.score} R</span>
                  </div>
                ))}
                {session.notes && (
                  <p className="text-xs text-gray-600 pt-1 border-t border-gray-800 mt-2">{session.notes}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
