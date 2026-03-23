'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { PROPOSAL_CATEGORIES, PROPOSAL_CATEGORY_LABELS } from '@/lib/validation/schemas';
import type { ProposalCategory } from '@/lib/validation/schemas';
import { formatTimeRemaining, isDeadlinePassed } from '@/lib/format/timeAgo';
import { useAuth } from '@/hooks/useAuth';

const ProposalComments = dynamic(
  () => import('@/components/governance/ProposalComments').then(m => ({ default: m.ProposalComments })),
  { ssr: false, loading: () => <div className="animate-pulse h-20 bg-gray-800 rounded mt-4" /> }
);

/* ── Types ──────────────────────────────────────────────────── */

interface Tally {
  for: { count: number; weight: number };
  against: { count: number; weight: number };
  abstain: { count: number; weight: number };
  totalVoters: number;
  totalWeight: number;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string | null;
  author: { display_name: string; username: string; pfp_url: string } | null;
  created_at: string;
  closes_at: string | null;
  tally: Tally;
  commentCount: number;
  user_vote: 'for' | 'against' | 'abstain' | null;
  respect_threshold: number;
}

/* ── Constants ──────────────────────────────────────────────── */

const CATEGORY_COLORS: Record<string, string> = {
  governance: 'bg-[#f5a623]/15 text-[#f5a623] border-[#f5a623]/30',
  technical: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  community: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  wavewarz: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  social: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  treasury: 'bg-green-500/15 text-green-400 border-green-500/30',
  general: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const STATUS_DOT: Record<string, string> = {
  open: 'bg-green-400',
  approved: 'bg-[#f5a623]',
  rejected: 'bg-red-400',
  completed: 'bg-blue-400',
  published: 'bg-purple-400',
  closed: 'bg-gray-500',
};

const STATUS_BADGE: Record<string, string> = {
  open: 'text-green-400 bg-green-400/10 border-green-400/20',
  approved: 'text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20',
  published: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  completed: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  closed: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  rejected: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const STATUS_FILTERS = ['all', 'open', 'approved', 'rejected', 'completed', 'published'] as const;
const CATEGORY_FILTERS = ['all', 'governance', 'technical', 'community', 'wavewarz', 'social', 'treasury'] as const;

/* ── Component ──────────────────────────────────────────────── */

export function ProposalsTab() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('governance');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Expand/collapse
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Voting
  const [voting, setVoting] = useState<string | null>(null);
  const [voteWarning, setVoteWarning] = useState<string | null>(null);

  const loadProposals = useCallback(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);

    fetch(`/api/proposals?${params}`)
      .then(r => r.json())
      .then(d => setProposals(d.proposals ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    setLoading(true);
    loadProposals();
  }, [loadProposals]);

  const handleCreate = async () => {
    // Social posts auto-generate title from description
    const effectiveTitle = title.trim() || description.trim().slice(0, 100);
    if (!effectiveTitle || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: effectiveTitle, description: description.trim(), category }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create proposal');
        return;
      }
      setTitle('');
      setDescription('');
      setShowCreate(false);
      loadProposals();
    } catch {
      setError('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (proposalId: string, vote: 'for' | 'against' | 'abstain') => {
    setVoting(proposalId);
    try {
      const res = await fetch('/api/proposals/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: proposalId, vote }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.warning) {
          setVoteWarning(data.warning);
          setTimeout(() => setVoteWarning(null), 6000);
        }
        // Optimistic update
        setProposals(prev => prev.map(p =>
          p.id === proposalId ? { ...p, user_vote: vote } : p
        ));
        await new Promise(r => setTimeout(r, 300));
        loadProposals();
      }
    } catch (err) {
      console.error('[proposals] vote error:', err);
    }
    setVoting(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="pt-2 space-y-4">
      {/* Zero-weight vote warning toast */}
      {voteWarning && (
        <div className="bg-amber-600/90 text-white text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2">
          <span>{voteWarning}</span>
          <button onClick={() => setVoteWarning(null)} className="ml-auto text-white/60 hover:text-white shrink-0">&times;</button>
        </div>
      )}

      {/* Create Proposal / Social Post toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setShowCreate(showCreate && category !== 'social' ? false : true); setCategory('general'); }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 transition-colors text-sm font-medium ${
            showCreate && category !== 'social'
              ? 'bg-gray-700 text-gray-300'
              : 'bg-[#f5a623]/10 border border-[#f5a623]/30 hover:bg-[#f5a623]/20 text-[#f5a623]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {showCreate && category !== 'social' ? 'Cancel' : 'Proposal'}
        </button>
        <button
          onClick={() => { setShowCreate(showCreate && category === 'social' ? false : true); setCategory('social'); }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 transition-colors text-sm font-medium ${
            showCreate && category === 'social'
              ? 'bg-gray-700 text-gray-300'
              : 'bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 text-pink-400'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          {showCreate && category === 'social' ? 'Cancel' : 'Social Post'}
        </button>
      </div>

      {/* Social Post Form */}
      {showCreate && category === 'social' && (
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-pink-500/20 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400">Social</span>
            <span className="text-[11px] text-gray-500">Share a thought, link, or update</span>
          </div>
          <textarea
            placeholder="What's on your mind?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-pink-400/50 focus:outline-none resize-none"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={submitting || !description.trim()}
            className="w-full bg-pink-500/20 text-pink-400 text-sm font-medium py-2.5 rounded-lg hover:bg-pink-500/30 disabled:opacity-50 transition-colors border border-pink-500/30"
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      )}

      {/* Proposal Create Form */}
      {showCreate && category !== 'social' && (
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 space-y-3">
          <input
            type="text"
            placeholder="Proposal title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#f5a623]/50 focus:outline-none"
          />
          <textarea
            placeholder="Describe your proposal..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#f5a623]/50 focus:outline-none resize-none"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#f5a623]/50 focus:outline-none"
          >
            {PROPOSAL_CATEGORIES.filter(c => c !== 'social').map((cat) => (
              <option key={cat} value={cat}>{PROPOSAL_CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={submitting || !title.trim() || !description.trim()}
              className="flex-1 bg-[#f5a623] text-black rounded-lg py-2 text-sm font-medium disabled:opacity-40 hover:bg-[#ffd700] transition-colors"
            >
              {submitting ? 'Creating...' : 'Submit Proposal'}
            </button>
            <button
              onClick={() => { setShowCreate(false); setError(null); }}
              className="px-4 bg-gray-800 text-gray-400 rounded-lg py-2 text-sm hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ORDAO External Link */}
      <a
        href="https://zao.frapps.xyz"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-3 hover:border-[#f5a623]/30 transition-colors"
      >
        <div>
          <p className="text-xs font-medium text-white">ORDAO On-Chain Governance</p>
          <p className="text-[10px] text-gray-500">Submit fractal results + vote on-chain</p>
        </div>
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>

      {/* Contracts */}
      <div className="bg-[#0d1b2a] rounded-xl p-3 space-y-1">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">On-Chain Contracts (Optimism)</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">OREC</span>
          <a href="https://optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-[#f5a623]/70 hover:text-[#f5a623] transition-colors">0xcB05...e532</a>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">ZOR (Respect1155)</span>
          <a href="https://optimistic.etherscan.io/address/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-[#f5a623]/70 hover:text-[#f5a623] transition-colors">0x9885...45c</a>
        </div>
      </div>

      {/* ── Filter Bar ────────────────────────────────────── */}
      <div className="space-y-2">
        {/* Status filters */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider self-center mr-1">Status</span>
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors capitalize ${
                statusFilter === s
                  ? 'bg-[#f5a623]/15 text-[#f5a623] border-[#f5a623]/40'
                  : 'bg-gray-800/50 text-gray-500 border-gray-700/50 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider self-center mr-1">Category</span>
          {CATEGORY_FILTERS.map(c => {
            const catColor = c !== 'all' ? CATEGORY_COLORS[c] : undefined;
            return (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors capitalize ${
                  categoryFilter === c
                    ? (catColor || 'bg-[#f5a623]/15 text-[#f5a623] border-[#f5a623]/40')
                    : 'bg-gray-800/50 text-gray-500 border-gray-700/50 hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                {c === 'all' ? 'All' : (PROPOSAL_CATEGORY_LABELS[c as ProposalCategory] || c)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Proposals List ────────────────────────────────── */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-[#0d1b2a] rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && proposals.length === 0 && (
        <div className="text-center py-8 bg-[#0d1b2a] rounded-xl">
          <p className="text-gray-400 text-sm">No proposals found.</p>
          <p className="text-xs text-gray-600 mt-1">
            {statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Be the first to create one.'}
          </p>
        </div>
      )}

      {!loading && proposals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">
            Community Proposals ({proposals.length})
          </p>
          {proposals.map(p => (
            <ProposalCard
              key={p.id}
              proposal={p}
              isExpanded={expandedId === p.id}
              onToggle={() => toggleExpand(p.id)}
              onVote={handleVote}
              isVoting={voting === p.id}
              currentFid={user?.fid ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Proposal Card ─────────────────────────────────────────── */

function ProposalCard({
  proposal: p,
  isExpanded,
  onToggle,
  onVote,
  isVoting,
  currentFid,
}: {
  proposal: Proposal;
  isExpanded: boolean;
  onToggle: () => void;
  onVote: (id: string, vote: 'for' | 'against' | 'abstain') => void;
  isVoting: boolean;
  currentFid: number;
}) {
  const statusKey = p.status.toLowerCase();
  const badgeClass = STATUS_BADGE[statusKey] ?? 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  const dotClass = STATUS_DOT[statusKey] ?? 'bg-gray-500';
  const catClass = p.category ? (CATEGORY_COLORS[p.category] ?? CATEGORY_COLORS.general) : null;

  const totalWeight = p.tally.totalWeight;
  const forPct = totalWeight > 0 ? Math.round((p.tally.for.weight / totalWeight) * 100) : 0;
  const threshold = p.respect_threshold || 1000;
  const thresholdPct = Math.min(100, Math.round((p.tally.for.weight / threshold) * 100));

  const expired = p.closes_at ? isDeadlinePassed(p.closes_at) : false;
  const isClosed = statusKey !== 'open';
  const canVote = !isClosed && !expired;

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 overflow-hidden transition-colors hover:border-gray-700">
      {/* Collapsed header — always visible, click to expand */}
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{p.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {/* Category badge */}
              {catClass && p.category && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${catClass}`}>
                  {PROPOSAL_CATEGORY_LABELS[p.category as ProposalCategory] || p.category}
                </span>
              )}
              {/* Author */}
              <span className="text-[10px] text-gray-500">
                by {p.author?.display_name || p.author?.username || 'Unknown'}
              </span>
              {/* Time remaining */}
              {p.closes_at && !expired && (
                <span className="text-[10px] text-gray-600">
                  {formatTimeRemaining(p.closes_at)}
                </span>
              )}
              {p.closes_at && expired && (
                <span className="text-[10px] text-red-400">Voting closed</span>
              )}
            </div>
          </div>
          {/* Status badge with dot + chevron */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badgeClass}`}>
              {p.status}
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

        {/* Compact vote bar — always visible */}
        {p.tally.totalVoters > 0 && (
          <div className="mt-2">
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden relative">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${forPct}%` }} />
              {/* Threshold marker */}
              {threshold > 0 && (
                <div
                  className="absolute top-0 h-full w-0.5 bg-[#f5a623]"
                  style={{ left: `${Math.min(100, (threshold / Math.max(totalWeight, threshold)) * 100)}%` }}
                  title={`Threshold: ${threshold} Respect`}
                />
              )}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-gray-600">
              <span>{p.tally.for.count} for ({p.tally.for.weight}R)</span>
              <span>{p.tally.against.count} against ({p.tally.against.weight}R)</span>
              <span>{p.tally.totalVoters} voters</span>
            </div>
          </div>
        )}

        {/* User's vote indicator */}
        {p.user_vote && (
          <div className="mt-1.5 flex items-center gap-1">
            <svg className="w-3 h-3 text-[#f5a623]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] text-[#f5a623]">
              You voted {p.user_vote}
            </span>
          </div>
        )}

        {/* Comment count hint (collapsed only) */}
        {p.commentCount > 0 && !isExpanded && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-600">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {p.commentCount} comment{p.commentCount !== 1 ? 's' : ''}
          </div>
        )}
      </button>

      {/* ── Expanded section ────────────────────────────── */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-800/50">
          {/* Full description */}
          <div className="mt-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {p.description.split(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g).map((part, i) =>
                /^https?:\/\//.test(part) ? (
                  <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[#f5a623] hover:underline break-all">{part}</a>
                ) : part
              )}
            </p>
          </div>

          {/* Detailed vote bar with threshold */}
          <div className="mt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Vote Progress</p>
            <div className="relative">
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
                {/* For (green) */}
                <div
                  className="h-full bg-green-500 absolute left-0 top-0 rounded-l-full"
                  style={{ width: `${forPct}%` }}
                />
                {/* Against (red) layered from right */}
                {p.tally.against.weight > 0 && totalWeight > 0 && (
                  <div
                    className="h-full bg-red-500/60 absolute right-0 top-0 rounded-r-full"
                    style={{ width: `${Math.round((p.tally.against.weight / totalWeight) * 100)}%` }}
                  />
                )}
              </div>
              {/* Threshold marker on detailed bar */}
              {threshold > 0 && (
                <div
                  className="absolute top-0 h-3 w-0.5 bg-[#f5a623] rounded"
                  style={{ left: `${Math.min(100, (threshold / Math.max(totalWeight, threshold)) * 100)}%` }}
                />
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px]">
              <span className="text-green-400">{p.tally.for.weight}R for</span>
              <span className="text-[#f5a623]">
                {thresholdPct}% of {threshold}R threshold
              </span>
              <span className="text-red-400">{p.tally.against.weight}R against</span>
            </div>
            {p.tally.abstain.count > 0 && (
              <p className="text-[10px] text-gray-600 mt-0.5 text-center">
                {p.tally.abstain.count} abstain ({p.tally.abstain.weight}R)
              </p>
            )}
          </div>

          {/* Voting buttons */}
          <div className="mt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Cast Your Vote</p>
            {isVoting ? (
              <div className="flex items-center justify-center gap-2 py-3">
                <div className="w-3.5 h-3.5 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-400">Recording vote...</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <VoteButton
                  label="For"
                  isActive={p.user_vote === 'for'}
                  disabled={!canVote}
                  onClick={() => onVote(p.id, 'for')}
                  activeClass="bg-green-500/20 text-green-400 border-green-500/40"
                  hoverClass="hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30"
                />
                <VoteButton
                  label="Against"
                  isActive={p.user_vote === 'against'}
                  disabled={!canVote}
                  onClick={() => onVote(p.id, 'against')}
                  activeClass="bg-red-500/20 text-red-400 border-red-500/40"
                  hoverClass="hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                />
                <VoteButton
                  label="Abstain"
                  isActive={p.user_vote === 'abstain'}
                  disabled={!canVote}
                  onClick={() => onVote(p.id, 'abstain')}
                  activeClass="bg-gray-500/20 text-gray-300 border-gray-500/40"
                  hoverClass="hover:bg-gray-500/10 hover:text-gray-300 hover:border-gray-500/30"
                />
              </div>
            )}
            {!canVote && (
              <p className="text-[10px] text-gray-600 mt-1.5">
                {isClosed ? 'This proposal is no longer open for voting.' : 'Voting period has ended.'}
              </p>
            )}
          </div>

          {/* Comments section (dynamically imported) */}
          <ProposalComments proposalId={p.id} currentFid={currentFid} />
        </div>
      )}
    </div>
  );
}

/* ── Vote Button ───────────────────────────────────────────── */

function VoteButton({
  label,
  isActive,
  disabled,
  onClick,
  activeClass,
  hoverClass,
}: {
  label: string;
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
  activeClass: string;
  hoverClass: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-all ${
        isActive
          ? activeClass
          : `bg-gray-800/50 text-gray-500 border-gray-700/50 ${disabled ? 'opacity-40 cursor-not-allowed' : hoverClass}`
      }`}
    >
      {isActive && (
        <svg className="w-3 h-3 inline mr-1 -mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {label}
    </button>
  );
}
