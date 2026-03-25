'use client';

import { useState, useEffect } from 'react';
import { communityConfig } from '@/../community.config';

/* ── Types ─────────────────────────────────────────────────────── */

interface SnapshotProposal {
  id: string;
  title: string;
  body: string;
  choices: string[];
  start: number;
  end: number;
  state: 'active' | 'closed' | 'pending';
  scores: number[];
  scores_total: number;
  votes: number;
  type: string;
}

/* ── Helpers ───────────────────────────────────────────────────── */

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStateBadge(state: string) {
  switch (state) {
    case 'active':
      return { label: 'Active', classes: 'text-green-400 bg-green-400/10 border-green-400/20' };
    case 'pending':
      return { label: 'Pending', classes: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' };
    case 'closed':
    default:
      return { label: 'Closed', classes: 'text-gray-400 bg-gray-400/10 border-gray-400/20' };
  }
}

const SPACE = communityConfig.snapshot.space;

/* ── Component ─────────────────────────────────────────────────── */

export function SnapshotPolls() {
  const [active, setActive] = useState<SnapshotProposal[]>([]);
  const [recent, setRecent] = useState<SnapshotProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/snapshot/polls')
      .then(r => r.json())
      .then(data => {
        setActive(data.active ?? []);
        setRecent(data.recent ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-28 bg-[#0d1b2a] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const allPolls = active.length > 0 ? active : [];
  const closedPolls = recent.filter(p => p.state !== 'active');

  if (allPolls.length === 0 && closedPolls.length === 0) {
    return (
      <div className="text-center py-6 bg-[#0d1b2a] rounded-xl border border-gray-800">
        <p className="text-gray-400 text-sm">No Snapshot polls yet.</p>
        <p className="text-xs text-gray-600 mt-1">Polls will appear here once created on Snapshot.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Active polls */}
      {allPolls.length > 0 && (
        <>
          <p className="text-xs text-green-400 uppercase tracking-wider px-1">
            Active ({allPolls.length})
          </p>
          {allPolls.map(p => (
            <PollCard
              key={p.id}
              poll={p}
              isActive
              isExpanded={expandedId === p.id}
              onToggle={() => toggleExpand(p.id)}
            />
          ))}
        </>
      )}

      {/* Recent closed polls */}
      {closedPolls.length > 0 && (
        <>
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1 mt-2">
            Recent ({closedPolls.length})
          </p>
          {closedPolls.slice(0, 5).map(p => (
            <PollCard
              key={p.id}
              poll={p}
              isActive={false}
              isExpanded={expandedId === p.id}
              onToggle={() => toggleExpand(p.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}

/* ── Poll Card ─────────────────────────────────────────────────── */

function PollCard({
  poll,
  isActive,
  isExpanded,
  onToggle,
}: {
  poll: SnapshotProposal;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const badge = getStateBadge(poll.state);
  const hasScores = poll.scores_total > 0;

  // Sort choices by score descending for display
  const choicesWithScores = poll.choices.map((choice, i) => ({
    choice,
    score: poll.scores[i] ?? 0,
    pct: hasScores ? Math.round(((poll.scores[i] ?? 0) / poll.scores_total) * 100) : 0,
  }));

  const sortedChoices = [...choicesWithScores].sort((a, b) => b.score - a.score);

  return (
    <div
      className={`bg-[#0d1b2a] rounded-xl overflow-hidden transition-colors ${
        isActive
          ? 'border border-[#f5a623]/30 hover:border-[#f5a623]/50'
          : 'border border-gray-800 hover:border-gray-700 opacity-80'
      }`}
    >
      {/* Header — always visible */}
      <button onClick={onToggle} className="w-full text-left px-4 py-3 focus:outline-none">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{poll.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] text-gray-500">
                {formatDate(poll.start)} &rarr; {formatDate(poll.end)}
              </span>
              <span className="text-[10px] text-gray-600">
                {poll.votes} vote{poll.votes !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                poll.state === 'active' ? 'bg-green-400' : 'bg-gray-500'
              }`}
            />
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badge.classes}`}>
              {badge.label}
            </span>
            <svg
              className={`w-3.5 h-3.5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Compact top-choice bar — always visible */}
        {hasScores && sortedChoices.length > 0 && (
          <div className="mt-2">
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#f5a623] rounded-full transition-all"
                style={{ width: `${sortedChoices[0].pct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-gray-600">
              <span className="truncate max-w-[60%]">{sortedChoices[0].choice}</span>
              <span>{sortedChoices[0].pct}%</span>
            </div>
          </div>
        )}
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* All choices with bar chart */}
          <div className="space-y-2">
            {sortedChoices.map(({ choice, score, pct }, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="text-xs text-gray-300 truncate max-w-[70%]">{choice}</span>
                  <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                    {pct}% ({Math.round(score).toLocaleString()})
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      i === 0 ? 'bg-[#f5a623]' : 'bg-[#f5a623]/40'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Body preview */}
          {poll.body && (
            <p className="text-xs text-gray-500 line-clamp-3 whitespace-pre-line">
              {poll.body}
            </p>
          )}

          {/* Total votes + Vote button */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-gray-600">
              {poll.votes} total vote{poll.votes !== 1 ? 's' : ''}
              {' / '}
              Type: {poll.type}
            </span>
            <a
              href={`https://snapshot.box/#/s:${SPACE}/proposal/${poll.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#f5a623]/15 text-[#f5a623] hover:bg-[#f5a623]/25 border border-[#f5a623]/30'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300 border border-gray-700'
              }`}
            >
              {isActive ? 'Vote on Snapshot' : 'View on Snapshot'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
