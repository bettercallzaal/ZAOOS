'use client';

import { useState, useEffect, useCallback } from 'react';

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
}

export function ProposalsTab() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('governance');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProposals = useCallback(() => {
    fetch('/api/proposals?limit=20')
      .then(r => r.json())
      .then(d => setProposals(d.proposals ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadProposals(); }, [loadProposals]);

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), category }),
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

  const STATUS_COLORS: Record<string, string> = {
    open: 'text-green-400 bg-green-400/10',
    published: 'text-blue-400 bg-blue-400/10',
    closed: 'text-gray-400 bg-gray-400/10',
    rejected: 'text-red-400 bg-red-400/10',
  };

  return (
    <div className="pt-2 space-y-4">
      {/* Create Proposal Button */}
      <button
        onClick={() => setShowCreate(!showCreate)}
        className="w-full flex items-center justify-center gap-2 bg-[#f5a623]/10 border border-[#f5a623]/30 rounded-xl px-4 py-3 hover:bg-[#f5a623]/20 transition-colors text-[#f5a623] text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Create Proposal
      </button>

      {/* Create Form */}
      {showCreate && (
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
            <option value="governance">Governance</option>
            <option value="funding">Funding</option>
            <option value="community">Community</option>
            <option value="music">Music</option>
            <option value="technical">Technical</option>
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

      {/* Proposals List */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-[#0d1b2a] rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && proposals.length === 0 && (
        <div className="text-center py-8 bg-[#0d1b2a] rounded-xl">
          <p className="text-gray-400 text-sm">No proposals yet.</p>
          <p className="text-xs text-gray-600 mt-1">Be the first to create one.</p>
        </div>
      )}

      {!loading && proposals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Community Proposals</p>
          {proposals.map(p => {
            const statusKey = p.status.toLowerCase();
            const colorClass = STATUS_COLORS[statusKey] ?? 'text-gray-400 bg-gray-400/10';
            const totalWeight = p.tally.totalWeight;
            const forPct = totalWeight > 0 ? Math.round((p.tally.for.weight / totalWeight) * 100) : 0;
            return (
              <div key={p.id} className="bg-[#0d1b2a] rounded-xl px-4 py-3 border border-gray-800">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{p.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      by {p.author?.display_name || p.author?.username || 'Unknown'}
                      {p.category && <span className="ml-1 text-gray-600">/{p.category}</span>}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${colorClass}`}>
                    {p.status}
                  </span>
                </div>
                {/* Vote bar */}
                {p.tally.totalVoters > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${forPct}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-gray-600">
                      <span>{p.tally.for.count} for ({p.tally.for.weight}R)</span>
                      <span>{p.tally.against.count} against</span>
                      <span>{p.tally.totalVoters} voters</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
