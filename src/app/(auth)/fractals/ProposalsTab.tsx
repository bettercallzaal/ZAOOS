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

const ZounzProposals = dynamic(
  () => import('@/components/zounz/ZounzProposals'),
  { ssr: false, loading: () => <div className="animate-pulse h-40 bg-gray-800 rounded-2xl" /> }
);

const SnapshotPolls = dynamic(
  () => import('@/components/governance/SnapshotPolls').then(m => ({ default: m.SnapshotPolls })),
  { ssr: false, loading: () => <div className="animate-pulse h-32 bg-gray-800 rounded-2xl" /> }
);

const CreateWeeklyPoll = dynamic(
  () => import('@/components/governance/CreateWeeklyPoll').then(m => ({ default: m.CreateWeeklyPoll })),
  { ssr: false }
);

const DiscordProposals = dynamic(
  () => import('@/components/governance/DiscordProposals').then(m => ({ default: m.DiscordProposals })),
  { ssr: false, loading: () => <div className="animate-pulse h-40 bg-gray-800 rounded-2xl" /> }
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
  published_cast_hash: string | null;
  published_bluesky_uri: string | null;
  published_x_url: string | null;
  publish_fc_error: string | null;
  publish_bsky_error: string | null;
  publish_x_error: string | null;
  publish_text: string | null;
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

export function ProposalsTab({ isAdmin = false }: { isAdmin?: boolean; currentFid?: number }) {
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

  // Section accordion — community open by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    zounz: false,
    snapshot: false,
    discord: false,
    community: true,
  });
  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

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
        body: JSON.stringify({
          title: effectiveTitle,
          description: description.trim(),
          category,
          closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7-day voting period
        }),
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

    // Optimistic update FIRST — show immediately
    setProposals(prev => prev.map(p =>
      p.id === proposalId ? { ...p, user_vote: vote } : p
    ));

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
        // Refetch after a delay to get updated tallies (cache-bust)
        await new Promise(r => setTimeout(r, 500));
        const params = new URLSearchParams({ limit: '50' });
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (categoryFilter !== 'all') params.set('category', categoryFilter);
        params.set('_t', Date.now().toString()); // cache bust
        fetch(`/api/proposals?${params}`)
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d?.proposals) setProposals(d.proposals); });
      } else {
        // Vote failed — revert optimistic update
        console.error('[proposals] vote failed:', data.error);
        setProposals(prev => prev.map(p =>
          p.id === proposalId ? { ...p, user_vote: null } : p
        ));
      }
    } catch (err) {
      console.error('[proposals] vote error:', err);
      // Revert on network error
      setProposals(prev => prev.map(p =>
        p.id === proposalId ? { ...p, user_vote: null } : p
      ));
    }
    setVoting(null);
  };

  const handleStatusChange = async (proposalId: string, newStatus: string) => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/proposals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: proposalId, status: newStatus }),
      });
      if (res.ok) {
        setProposals(prev => prev.map(p =>
          p.id === proposalId ? { ...p, status: newStatus } : p
        ));
      }
    } catch (err) {
      console.error('[proposals] status change error:', err);
    }
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

      {/* ── ZOUNZ On-Chain ───────────────────────────────────── */}
      <AccordionSection
        title="ZOUNZ On-Chain"
        subtitle="NFT Voting"
        color="text-[#f5a623]"
        isOpen={openSections.zounz}
        onToggle={() => toggleSection('zounz')}
        icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>}
      >
        <ZounzProposals />
      </AccordionSection>

      {/* ── Snapshot Polls ────────────────────────────────────── */}
      <AccordionSection
        title="Snapshot Polls"
        subtitle="Gasless Voting"
        color="text-blue-400"
        isOpen={openSections.snapshot}
        onToggle={() => toggleSection('snapshot')}
        icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>}
      >
        <CreateWeeklyPoll isAdmin={isAdmin} />
        <SnapshotPolls />
      </AccordionSection>

      {/* ── Discord Proposals ─────────────────────────────────── */}
      <AccordionSection
        title="Discord Proposals"
        subtitle="Bot Imported"
        color="text-indigo-400"
        isOpen={openSections.discord}
        onToggle={() => toggleSection('discord')}
        icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>}
      >
        <DiscordProposals />
      </AccordionSection>

      {/* ── Community Proposals ────────────────────────────────── */}
      <AccordionSection
        title="Community Proposals"
        subtitle="Respect-Weighted"
        color="text-purple-400"
        count={proposals.length}
        isOpen={openSections.community}
        onToggle={() => toggleSection('community')}
        icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
      >

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

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
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
        <div className="flex flex-wrap gap-1.5">
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

      {/* Proposals list */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-[#0d1b2a] rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && proposals.length === 0 && (
        <div className="text-center py-6 bg-[#0d1b2a] rounded-xl">
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
          {proposals.map(p => (
            <ProposalCard
              key={p.id}
              proposal={p}
              isExpanded={expandedId === p.id}
              onToggle={() => toggleExpand(p.id)}
              onVote={handleVote}
              onStatusChange={isAdmin ? handleStatusChange : undefined}
              isVoting={voting === p.id}
              currentFid={user?.fid ?? 0}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
      </AccordionSection>

      {/* ── ORDAO + Contracts (bottom) ──────────────────────── */}
      <div className="space-y-2">
        <a
          href="https://zao.frapps.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-2.5 hover:border-[#f5a623]/30 transition-colors"
        >
          <div>
            <p className="text-xs font-medium text-white">ORDAO On-Chain Governance</p>
            <p className="text-[10px] text-gray-500">Submit fractal results + vote on-chain</p>
          </div>
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <div className="flex items-center gap-4 px-3 py-2 text-[10px] text-gray-600">
          <span className="text-gray-500">Contracts:</span>
          <a href="https://optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532" target="_blank" rel="noopener noreferrer" className="font-mono text-[#f5a623]/50 hover:text-[#f5a623] transition-colors">OREC</a>
          <a href="https://optimistic.etherscan.io/address/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c" target="_blank" rel="noopener noreferrer" className="font-mono text-[#f5a623]/50 hover:text-[#f5a623] transition-colors">ZOR</a>
        </div>
      </div>
    </div>
  );
}

/* ── Accordion Section ────────────────────────────────────── */

function AccordionSection({
  title,
  subtitle,
  color,
  icon,
  count,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className={color}>{icon}</span>
        <span className={`text-sm font-semibold ${color}`}>{title}</span>
        <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{subtitle}</span>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded-full ml-auto mr-2">{count}</span>
        )}
        <svg
          className={`w-3.5 h-3.5 text-gray-600 transition-transform ml-auto shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {children}
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
  onStatusChange,
  isVoting,
  currentFid,
  isAdmin = false,
}: {
  proposal: Proposal;
  isExpanded: boolean;
  onToggle: () => void;
  onVote: (id: string, vote: 'for' | 'against' | 'abstain') => void;
  onStatusChange?: (id: string, status: string) => void;
  isVoting: boolean;
  currentFid: number;
  isAdmin?: boolean;
}) {
  const statusKey = p.status.toLowerCase();
  const badgeClass = STATUS_BADGE[statusKey] ?? 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  const dotClass = STATUS_DOT[statusKey] ?? 'bg-gray-500';
  const catClass = p.category ? (CATEGORY_COLORS[p.category] ?? CATEGORY_COLORS.general) : null;

  const totalWeight = p.tally.totalWeight;
  const forPct = totalWeight > 0 ? Math.round((p.tally.for.weight / totalWeight) * 100) : 0;
  const threshold = p.respect_threshold || 1000;
  const thresholdPct = Math.min(100, Math.round((p.tally.for.weight / threshold) * 100));
  const passedThreshold = p.tally.for.weight >= threshold;

  const expired = p.closes_at ? isDeadlinePassed(p.closes_at) : false;
  const isClosed = statusKey !== 'open';
  const canVote = !isClosed && !expired;

  // Derive display status — show "passed" if threshold met while still open
  const displayStatus = statusKey === 'open' && passedThreshold ? 'passed' : p.status;
  const displayBadgeClass = statusKey === 'open' && passedThreshold
    ? 'text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20'
    : badgeClass;
  const displayDotClass = statusKey === 'open' && passedThreshold
    ? 'bg-[#f5a623]'
    : dotClass;

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
            <span className={`w-1.5 h-1.5 rounded-full ${displayDotClass}`} />
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${displayBadgeClass}`}>
              {displayStatus}
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
        <div className="px-4 pb-4 border-t border-gray-800/50 space-y-3">
          {/* Description — skip if same as title (social posts) */}
          {p.description !== p.title && (
            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed mt-3">
              {p.description.split(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g).map((part, i) =>
                /^https?:\/\//.test(part) ? (
                  <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[#f5a623] hover:underline break-all">{part}</a>
                ) : part
              )}
            </p>
          )}

          {/* Threshold progress — single clean bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-[10px]">
              <span className="text-green-400 font-medium">{p.tally.for.weight}R for</span>
              <span className={passedThreshold ? 'text-[#f5a623] font-medium' : 'text-gray-500'}>
                {passedThreshold ? 'Threshold reached' : `${thresholdPct}% of ${threshold}R`}
              </span>
              <span className="text-red-400">{p.tally.against.weight > 0 ? `${p.tally.against.weight}R against` : ''}</span>
            </div>
            <div className="relative">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all ${passedThreshold ? 'bg-[#f5a623]' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(100, (p.tally.for.weight / Math.max(totalWeight, threshold)) * 100)}%` }}
                />
                {p.tally.against.weight > 0 && totalWeight > 0 && (
                  <div
                    className="h-full bg-red-500/60 absolute right-0 top-0 rounded-r-full"
                    style={{ width: `${Math.round((p.tally.against.weight / Math.max(totalWeight, threshold)) * 100)}%` }}
                  />
                )}
              </div>
              {!passedThreshold && threshold > 0 && (
                <div
                  className="absolute top-0 h-2 w-0.5 bg-[#f5a623] rounded"
                  style={{ left: `${Math.min(100, (threshold / Math.max(totalWeight, threshold)) * 100)}%` }}
                />
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-600">
              <span>{p.tally.totalVoters} voter{p.tally.totalVoters !== 1 ? 's' : ''}</span>
              {p.tally.abstain.count > 0 && <span>{p.tally.abstain.count} abstain</span>}
            </div>
          </div>

          {/* Published links */}
          {(p.published_cast_hash || p.published_bluesky_uri || p.published_x_url) && (
            <div className="flex flex-wrap gap-1.5">
              {p.published_cast_hash && (
                <a href={`https://warpcast.com/~/conversations/${p.published_cast_hash}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-[11px] font-medium hover:bg-purple-500/20 transition-colors border border-purple-500/20">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                  Farcaster
                </a>
              )}
              {p.published_bluesky_uri && (
                <a href={p.published_bluesky_uri.startsWith('http') ? p.published_bluesky_uri : `https://bsky.app/profile/${p.published_bluesky_uri}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[11px] font-medium hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                  <svg className="w-3 h-3" viewBox="0 0 568 501" fill="currentColor"><path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.793 166.471-20.155 71.454-93.57 89.708-159.534 78.663 115.346 19.729 144.665 85.021 81.294 150.313-120.758 124.562-173.715-31.256-187.093-71.174-2.41-7.186-3.542-10.549-2.874-7.688-0.668-2.861-0.464 0.502-2.874 7.688-13.378 39.918-66.335 195.736-187.093 71.174-63.371-65.292-34.052-130.584 81.294-150.313-65.964 11.045-139.379-7.209-159.534-78.663C9.945 203.659 0 75.293 0 57.947 0-28.906 76.135-1.611 123.121 33.664Z"/></svg>
                  Bluesky
                </a>
              )}
              {p.published_x_url && (
                <a href={p.published_x_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-500/10 text-gray-300 text-[11px] font-medium hover:bg-gray-500/20 transition-colors border border-gray-500/20">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X
                </a>
              )}
            </div>
          )}

          {/* Publish errors — compact */}
          {(p.publish_fc_error || p.publish_bsky_error || p.publish_x_error) && !(p.published_cast_hash && p.published_bluesky_uri && p.published_x_url) && (
            <div className="text-[10px] text-red-400/70 space-y-0.5">
              {p.publish_fc_error && !p.published_cast_hash && <p>Farcaster: {p.publish_fc_error}</p>}
              {p.publish_bsky_error && !p.published_bluesky_uri && <p>Bluesky: {p.publish_bsky_error}</p>}
              {p.publish_x_error && !p.published_x_url && <p>X: {p.publish_x_error}</p>}
            </div>
          )}

          {/* Voting buttons — only show if user can still vote or hasn't voted */}
          {canVote && (
            <div>
              {isVoting ? (
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="w-3.5 h-3.5 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-gray-400">Recording vote...</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <VoteButton
                    label="For"
                    isActive={p.user_vote === 'for'}
                    disabled={false}
                    onClick={() => onVote(p.id, 'for')}
                    activeClass="bg-green-500/20 text-green-400 border-green-500/40"
                    hoverClass="hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30"
                  />
                  <VoteButton
                    label="Against"
                    isActive={p.user_vote === 'against'}
                    disabled={false}
                    onClick={() => onVote(p.id, 'against')}
                    activeClass="bg-red-500/20 text-red-400 border-red-500/40"
                    hoverClass="hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                  />
                  <VoteButton
                    label="Abstain"
                    isActive={p.user_vote === 'abstain'}
                    disabled={false}
                    onClick={() => onVote(p.id, 'abstain')}
                    activeClass="bg-gray-500/20 text-gray-300 border-gray-500/40"
                    hoverClass="hover:bg-gray-500/10 hover:text-gray-300 hover:border-gray-500/30"
                  />
                </div>
              )}
            </div>
          )}

          {/* Admin status controls — inline, no header */}
          {isAdmin && onStatusChange && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-800/50">
              {p.status === 'open' && (
                <>
                  <button onClick={() => onStatusChange(p.id, 'approved')} className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors">Approve</button>
                  <button onClick={() => onStatusChange(p.id, 'rejected')} className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">Reject</button>
                </>
              )}
              {p.status === 'approved' && (
                <button onClick={() => onStatusChange(p.id, 'completed')} className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">Mark Completed</button>
              )}
              {(p.status === 'rejected' || p.status === 'completed') && (
                <button onClick={() => onStatusChange(p.id, 'open')} className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20 transition-colors">Reopen</button>
              )}
            </div>
          )}

          {/* Comments */}
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
