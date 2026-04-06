'use client';

import { useState, useEffect, useCallback } from 'react';

/* -- Types --------------------------------------------------------- */

interface VoteAgg {
  yes_count: number;
  no_count: number;
  abstain_count: number;
  yes_weight: number;
  no_weight: number;
  abstain_weight: number;
  total_votes: number;
  total_weight: number;
}

interface DiscordProposal {
  id: number;
  title: string;
  description: string | null;
  proposal_type: string;
  author_id: string;
  thread_id: string | null;
  message_id: string | null;
  status: string;
  options: string[];
  funding_amount: number | null;
  image_url: string | null;
  project_url: string | null;
  created_at: string;
  closed_at: string | null;
  votes: VoteAgg;
  userVote: 'yes' | 'no' | 'abstain' | null;
}

type StatusFilter = 'all' | 'active' | 'closed';
type SortMode = 'newest' | 'most_votes' | 'most_weight';
type VoteValue = 'yes' | 'no' | 'abstain';

/* -- Constants ----------------------------------------------------- */

const TYPE_COLORS: Record<string, string> = {
  curate: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  funding: 'bg-green-500/15 text-green-400 border-green-500/30',
  text: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  governance: 'bg-[#f5a623]/15 text-[#f5a623] border-[#f5a623]/30',
};

const STATUS_BADGE: Record<string, string> = {
  active: 'text-green-400 bg-green-400/10 border-green-400/20',
  closed: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

const VOTE_BUTTON_STYLES: Record<VoteValue, { base: string; active: string }> = {
  yes: {
    base: 'border-green-500/30 text-green-400/70 hover:bg-green-500/15 hover:text-green-400 hover:border-green-500/50',
    active: 'bg-green-500/20 text-green-400 border-green-500/50 ring-1 ring-green-500/30',
  },
  no: {
    base: 'border-red-500/30 text-red-400/70 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/50',
    active: 'bg-red-500/20 text-red-400 border-red-500/50 ring-1 ring-red-500/30',
  },
  abstain: {
    base: 'border-gray-500/30 text-gray-400/70 hover:bg-gray-500/15 hover:text-gray-300 hover:border-gray-500/50',
    active: 'bg-gray-500/20 text-gray-300 border-gray-500/50 ring-1 ring-gray-500/30',
  },
};

/* -- Helpers ------------------------------------------------------- */

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '...';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function timeRemaining(createdAt: string): string {
  // Default 7-day voting period from creation
  const closeDate = new Date(new Date(createdAt).getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = Date.now();
  const diff = closeDate.getTime() - now;
  if (diff <= 0) return 'Voting ended';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

/* -- Skeleton ------------------------------------------------------ */

function ProposalSkeleton() {
  return (
    <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] animate-pulse space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-5 w-16 bg-gray-700 rounded-full" />
        <div className="h-5 w-14 bg-gray-700 rounded-full" />
      </div>
      <div className="h-4 w-3/4 bg-gray-700 rounded" />
      <div className="h-3 w-full bg-gray-800 rounded" />
      <div className="h-3 w-5/6 bg-gray-800 rounded" />
      <div className="h-2 w-full bg-gray-700 rounded-full mt-2" />
      <div className="flex justify-between">
        <div className="h-3 w-20 bg-gray-800 rounded" />
        <div className="h-3 w-24 bg-gray-800 rounded" />
      </div>
    </div>
  );
}

/* -- Vote Bar ------------------------------------------------------ */

function VoteBar({ votes }: { votes: VoteAgg }) {
  const total = votes.yes_weight + votes.no_weight;
  const yesPercent = total > 0 ? (votes.yes_weight / total) * 100 : 50;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 h-2.5 rounded-full overflow-hidden bg-gray-800">
        {total > 0 ? (
          <>
            <div
              className="h-full bg-green-500 rounded-l-full transition-all duration-300"
              style={{ width: `${yesPercent}%`, marginLeft: 0, marginRight: 0 }}
            />
            <div
              className="h-full bg-red-500 rounded-r-full transition-all duration-300"
              style={{ width: `${100 - yesPercent}%`, marginLeft: '-0.5rem' }}
            />
          </>
        ) : (
          <div className="h-full w-full bg-gray-700 rounded-full" />
        )}
      </div>
      <div className="flex justify-between text-[10px]">
        <span className="text-green-400">
          Yes: {votes.yes_count} ({votes.yes_weight.toLocaleString()} R)
        </span>
        <span className="text-red-400">
          No: {votes.no_count} ({votes.no_weight.toLocaleString()} R)
        </span>
      </div>
    </div>
  );
}

/* -- Vote Buttons -------------------------------------------------- */

function VoteButtons({
  proposal,
  userDiscordId,
  onVote,
}: {
  proposal: DiscordProposal;
  userDiscordId: string | null;
  onVote: (proposalId: number, vote: VoteValue) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState<VoteValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Don't render if proposal is closed
  if (proposal.status !== 'active') return null;

  // Not authenticated or no discord_id
  if (!userDiscordId) {
    return (
      <p className="text-[10px] text-gray-500 italic">
        Link your Discord account in Settings to vote
      </p>
    );
  }

  const handleVote = async (vote: VoteValue) => {
    setSubmitting(vote);
    setError(null);
    try {
      await onVote(proposal.id, vote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vote failed');
    } finally {
      setSubmitting(null);
    }
  };

  const votes: VoteValue[] = ['yes', 'no', 'abstain'];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {votes.map(v => {
          const isActive = proposal.userVote === v;
          const isLoading = submitting === v;
          const isDisabled = submitting !== null;
          const styles = VOTE_BUTTON_STYLES[v];

          return (
            <button
              key={v}
              onClick={() => handleVote(v)}
              disabled={isDisabled}
              className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-all duration-200 capitalize ${
                isActive ? styles.active : styles.base
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-1">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {v}
                </span>
              ) : (
                <>
                  {isActive && (
                    <svg className="inline w-3 h-3 mr-1 -ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {v}
                </>
              )}
            </button>
          );
        })}
      </div>
      {proposal.userVote && (
        <p className="text-[10px] text-gray-500">
          You voted: <span className={
            proposal.userVote === 'yes' ? 'text-green-400' :
            proposal.userVote === 'no' ? 'text-red-400' :
            'text-gray-400'
          }>{proposal.userVote}</span>
        </p>
      )}
      {error && (
        <p className="text-[10px] text-red-400">{error}</p>
      )}
    </div>
  );
}

/* -- Proposal Card ------------------------------------------------- */

function ProposalCard({
  proposal,
  userDiscordId,
  onVote,
}: {
  proposal: DiscordProposal;
  userDiscordId: string | null;
  onVote: (proposalId: number, vote: VoteValue) => Promise<void>;
}) {
  const typeColor = TYPE_COLORS[proposal.proposal_type] ?? TYPE_COLORS.text;
  const statusColor = STATUS_BADGE[proposal.status] ?? STATUS_BADGE.closed;

  // Strip markdown bold/links for clean display
  const cleanDesc = (proposal.description ?? '')
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  return (
    <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] hover:border-white/[0.08] transition-colors space-y-3">
      {/* Header: badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${typeColor}`}>
          {proposal.proposal_type}
        </span>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${statusColor}`}>
          {proposal.status}
        </span>
        {proposal.funding_amount != null && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
            ${proposal.funding_amount.toLocaleString()}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-white leading-snug">
        {proposal.title}
      </h3>

      {/* Description */}
      {cleanDesc && (
        <p className="text-xs text-gray-400 leading-relaxed">
          {truncate(cleanDesc, 200)}
        </p>
      )}

      {/* Project link for curate type */}
      {proposal.proposal_type === 'curate' && proposal.project_url && (
        <a
          href={proposal.project_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] text-[#f5a623]/80 hover:text-[#f5a623] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View Project
        </a>
      )}

      {/* Vote bar */}
      <VoteBar votes={proposal.votes} />

      {/* Vote buttons (active proposals only, authenticated users with discord_id) */}
      <VoteButtons proposal={proposal} userDiscordId={userDiscordId} onVote={onVote} />

      {/* Footer: metadata */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
        <div className="flex items-center gap-3">
          <span>{proposal.votes.total_votes} vote{proposal.votes.total_votes !== 1 ? 's' : ''}</span>
          <span>{proposal.votes.total_weight.toLocaleString()} Respect</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-gray-600">
            {proposal.author_id.slice(0, 6)}...
          </span>
          {proposal.status === 'active' ? (
            <span className="text-green-400/70">{timeRemaining(proposal.created_at)}</span>
          ) : (
            <span>Closed {proposal.closed_at ? formatDate(proposal.closed_at) : formatDate(proposal.created_at)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* -- Main Component ------------------------------------------------ */

export function DiscordProposals() {
  const [proposals, setProposals] = useState<DiscordProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDiscordId, setUserDiscordId] = useState<string | null>(null);

  // Filters & sort
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  const fetchProposals = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);

    fetch(`/api/discord/proposals?${params}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        setProposals(d.proposals ?? []);
        setUserDiscordId(d.userDiscordId ?? null);
      })
      .catch(err => {
        console.error('[DiscordProposals] fetch error:', err);
        setError('Failed to load Discord proposals');
      })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Handle vote submission with optimistic update
  const handleVote = useCallback(async (proposalId: number, vote: VoteValue) => {
    // Optimistically update the UI
    setProposals(prev => prev.map(p => {
      if (p.id !== proposalId) return p;
      return { ...p, userVote: vote };
    }));

    const res = await fetch('/api/discord/proposals/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId, vote }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Revert optimistic update
      fetchProposals();
      throw new Error(data.error || 'Vote failed');
    }

    // Update with real vote counts from server
    setProposals(prev => prev.map(p => {
      if (p.id !== proposalId) return p;
      return { ...p, votes: data.votes, userVote: vote };
    }));
  }, [fetchProposals]);

  // Client-side sort
  const sorted = [...proposals].sort((a, b) => {
    switch (sortMode) {
      case 'most_votes':
        return b.votes.total_votes - a.votes.total_votes;
      case 'most_weight':
        return b.votes.total_weight - a.votes.total_weight;
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'closed', label: 'Closed' },
  ];

  const SORT_OPTIONS: { id: SortMode; label: string }[] = [
    { id: 'newest', label: 'Newest' },
    { id: 'most_votes', label: 'Most Votes' },
    { id: 'most_weight', label: 'Most Respect' },
  ];

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
        </svg>
        <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-wide">Discord Proposals</h2>
        <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
          Respect-Weighted
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                statusFilter === f.id
                  ? 'bg-[#f5a623]/15 text-[#f5a623] border-[#f5a623]/40'
                  : 'bg-gray-800/50 text-gray-500 border-white/[0.08] hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="h-3 border-l border-white/[0.08]" />

        <div className="flex gap-1.5">
          {SORT_OPTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSortMode(s.id)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                sortMode === s.id
                  ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/40'
                  : 'bg-gray-800/50 text-gray-500 border-white/[0.08] hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          <ProposalSkeleton />
          <ProposalSkeleton />
          <ProposalSkeleton />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
          <button
            onClick={fetchProposals}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && sorted.length === 0 && (
        <div className="bg-[#0d1b2a] rounded-xl p-6 border border-white/[0.08] text-center">
          <p className="text-sm text-gray-500">No Discord proposals found</p>
          <p className="text-[11px] text-gray-600 mt-1">
            Proposals created via the Discord bot will appear here
          </p>
        </div>
      )}

      {/* Proposal cards */}
      {!loading && !error && sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map(p => (
            <ProposalCard
              key={p.id}
              proposal={p}
              userDiscordId={userDiscordId}
              onVote={handleVote}
            />
          ))}
        </div>
      )}
    </div>
  );
}
