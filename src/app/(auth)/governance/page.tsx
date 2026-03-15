'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface RespectEntry {
  rank: number;
  name: string;
  wallet: string;
  fid: number | null;
  username: string | null;
  zid: number | null;
  ogRespect: number;
  zorRespect: number;
  totalRespect: number;
  ogPct: number;
  zorPct: number;
}

interface RespectStats {
  totalMembers: number;
  totalOG: number;
  totalZOR: number;
  ogTotalSupply: number;
  zorTotalSupply: number;
  holdersWithRespect: number;
}

interface RespectData {
  leaderboard: RespectEntry[];
  stats: RespectStats;
  currentFid: number;
}

interface ProposalTally {
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
  status: 'open' | 'approved' | 'rejected' | 'completed';
  category: string;
  author: { display_name: string; username: string; pfp_url: string | null; fid: number; zid: number | null };
  created_at: string;
  closes_at: string | null;
  tally: ProposalTally;
  commentCount: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-500/10 text-gray-400',
  music: 'bg-purple-500/10 text-purple-400',
  tech: 'bg-blue-500/10 text-blue-400',
  governance: 'bg-[#f5a623]/10 text-[#f5a623]',
  treasury: 'bg-green-500/10 text-green-400',
};

export default function GovernancePage() {
  const [data, setData] = useState<RespectData | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'overview' | 'proposals'>('overview');

  // Create proposal state
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [creating, setCreating] = useState(false);

  // Voting state
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/respect/leaderboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    fetch('/api/proposals')
      .then((res) => res.json())
      .then((d) => setProposals(d.proposals || []))
      .catch(() => {})
      .finally(() => setProposalsLoading(false));
  }, []);

  const myEntry = data?.leaderboard.find((e) => e.fid === data.currentFid);

  const handleCreateProposal = async () => {
    if (!newTitle.trim() || !newDesc.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc, category: newCategory }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewTitle('');
        setNewDesc('');
        setNewCategory('general');
        // Refresh proposals
        const d = await fetch('/api/proposals').then((r) => r.json());
        setProposals(d.proposals || []);
      }
    } catch {}
    setCreating(false);
  };

  const handleVote = async (proposalId: string, vote: 'for' | 'against' | 'abstain') => {
    setVoting(proposalId);
    try {
      await fetch('/api/proposals/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: proposalId, vote }),
      });
      // Refresh proposals
      const d = await fetch('/api/proposals').then((r) => r.json());
      setProposals(d.proposals || []);
    } catch {}
    setVoting(null);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20">
      {/* Header */}
      <header className="px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-300">Governance</h2>
          <Link href="/chat" className="text-xs text-gray-500 hover:text-white">Back to Chat</Link>
        </div>
        {/* Tab switcher */}
        <div className="flex gap-1 mt-3">
          <button
            onClick={() => setTab('overview')}
            className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${
              tab === 'overview' ? 'bg-[#f5a623]/10 text-[#f5a623]' : 'text-gray-500 hover:text-white'
            }`}
          >
            Respect Overview
          </button>
          <button
            onClick={() => setTab('proposals')}
            className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${
              tab === 'proposals' ? 'bg-[#f5a623]/10 text-[#f5a623]' : 'text-gray-500 hover:text-white'
            }`}
          >
            Proposals{proposals.filter((p) => p.status === 'open').length > 0 && ` (${proposals.filter((p) => p.status === 'open').length})`}
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {tab === 'overview' && (
          <>
            {/* Your Respect card */}
            {myEntry && (
              <div className="bg-gradient-to-r from-[#f5a623]/10 to-[#ffd700]/5 rounded-xl p-5 border border-[#f5a623]/30">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-[#f5a623] uppercase tracking-wider">Your Respect</p>
                  {myEntry.zid && (
                    <span className="text-xs font-bold text-[#f5a623] bg-[#f5a623]/10 px-2 py-0.5 rounded-full">
                      ZID #{myEntry.zid}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white">{myEntry.totalRespect.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {myEntry.totalRespect > 0
                        ? `Your vote weight in proposals`
                        : 'Earn respect to vote on proposals'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-[#f5a623]">#{myEntry.rank}</p>
                    <p className="text-xs text-gray-400">of {data?.stats.totalMembers}</p>
                  </div>
                </div>
                {/* OG / ZOR breakdown */}
                {myEntry.totalRespect > 0 && (
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#f5a623]/20">
                    <div>
                      <p className="text-xs text-gray-500">OG Respect</p>
                      <p className="text-lg font-bold text-white">{myEntry.ogRespect.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-600">{myEntry.ogPct}% of supply</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ZOR Respect</p>
                      <p className="text-lg font-bold text-white">{myEntry.zorRespect.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-600">{myEntry.zorPct}% of supply</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No wallet notice */}
            {data && !myEntry && !loading && (
              <div className="bg-[#0d1b2a] rounded-xl p-5 border border-gray-800 text-center">
                <p className="text-sm text-gray-400">
                  Your wallet isn&apos;t linked yet. Ask an admin to add your FID to see your Respect here.
                </p>
              </div>
            )}

            {/* On-Chain Stats */}
            {data && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-3">On-Chain Respect (Optimism)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
                    <p className="text-xs text-gray-500">OG Respect</p>
                    <p className="text-xl font-bold text-white">{data.stats.totalOG.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      Supply: {data.stats.ogTotalSupply?.toLocaleString() || '—'}
                    </p>
                  </div>
                  <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
                    <p className="text-xs text-gray-500">ZOR Respect</p>
                    <p className="text-xl font-bold text-white">{data.stats.totalZOR.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      Supply: {data.stats.zorTotalSupply?.toLocaleString() || '—'}
                    </p>
                  </div>
                  <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
                    <p className="text-xs text-gray-500">Members</p>
                    <p className="text-xl font-bold text-white">{data.stats.totalMembers}</p>
                    <p className="text-[10px] text-gray-600 mt-1">Active wallets</p>
                  </div>
                  <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
                    <p className="text-xs text-gray-500">Holders</p>
                    <p className="text-xl font-bold text-white">{data.stats.holdersWithRespect || 0}</p>
                    <p className="text-[10px] text-gray-600 mt-1">With respect balance</p>
                  </div>
                </div>
              </div>
            )}

            {/* Top Members */}
            {loading ? (
              <div className="text-center py-12">
                <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Loading onchain data...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            ) : data && data.leaderboard.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Leaderboard</p>
                  <Link href="/respect" className="text-xs text-[#f5a623] hover:text-[#ffd700]">
                    Full board
                  </Link>
                </div>
                {data.leaderboard.slice(0, 10).map((entry) => {
                  const isMe = entry.fid === data.currentFid;
                  return (
                    <div
                      key={entry.fid ?? entry.wallet}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                        isMe
                          ? 'bg-[#f5a623]/10 border-[#f5a623]/30'
                          : entry.rank <= 3
                            ? 'bg-[#f5a623]/5 border-[#f5a623]/20'
                            : 'bg-[#0d1b2a] border-gray-800'
                      }`}
                    >
                      <span className="text-lg font-bold w-8 text-center">
                        {entry.rank === 1 ? '\uD83E\uDD47' : entry.rank === 2 ? '\uD83E\uDD48' : entry.rank === 3 ? '\uD83E\uDD49' : entry.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${isMe ? 'text-[#f5a623]' : 'text-white'}`}>
                            {entry.name}{isMe && ' (you)'}
                          </p>
                          {entry.zid && (
                            <span className="text-[10px] text-[#f5a623]/70 font-medium flex-shrink-0">ZID #{entry.zid}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {entry.username ? `@${entry.username}` : entry.fid ? `FID ${entry.fid}` : `${entry.wallet.slice(0, 6)}...${entry.wallet.slice(-4)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${isMe ? 'text-[#f5a623]' : 'text-white'}`}>
                          {entry.totalRespect.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-600">
                          {entry.ogRespect > 0 && `${entry.ogRespect} OG`}
                          {entry.ogRespect > 0 && entry.zorRespect > 0 && ' + '}
                          {entry.zorRespect > 0 && `${entry.zorRespect} ZOR`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">No respect data found.</p>
              </div>
            )}

            <p className="text-xs text-gray-600 text-center">
              Live onchain data from Optimism. Refreshes every 5 minutes.
            </p>
          </>
        )}

        {tab === 'proposals' && (
          <>
            {/* Create Proposal */}
            <button
              onClick={() => setShowCreate(!showCreate)}
              className={`w-full text-sm font-medium px-4 py-3 rounded-xl transition-colors ${
                showCreate
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700]'
              }`}
            >
              {showCreate ? 'Cancel' : '+ New Proposal'}
            </button>

            {showCreate && (
              <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 space-y-3">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Proposal title"
                  className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
                />
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe your proposal..."
                  rows={4}
                  className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623] resize-none"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 border-0 focus:ring-1 focus:ring-[#f5a623]"
                >
                  <option value="general">General</option>
                  <option value="music">Music</option>
                  <option value="tech">Tech</option>
                  <option value="governance">Governance</option>
                  <option value="treasury">Treasury</option>
                </select>
                {myEntry && (
                  <p className="text-[10px] text-gray-600">
                    Your vote weight: {myEntry.totalRespect.toLocaleString()} respect
                  </p>
                )}
                <button
                  onClick={handleCreateProposal}
                  disabled={creating || !newTitle.trim() || !newDesc.trim()}
                  className="w-full bg-[#f5a623] text-[#0a1628] text-sm font-medium py-2.5 rounded-lg hover:bg-[#ffd700] disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Submitting...' : 'Submit Proposal'}
                </button>
              </div>
            )}

            {/* Proposals List */}
            {proposalsLoading ? (
              <div className="text-center py-12">
                <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Loading proposals...</p>
              </div>
            ) : proposals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">No proposals yet. Be the first to propose something.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((proposal) => {
                  const totalWeight = proposal.tally.totalWeight || 1;
                  const forPct = Math.round((proposal.tally.for.weight / totalWeight) * 100);
                  const againstPct = Math.round((proposal.tally.against.weight / totalWeight) * 100);
                  const isVoting = voting === proposal.id;

                  return (
                    <div key={proposal.id} className="bg-[#0d1b2a] rounded-xl border border-gray-800 overflow-hidden">
                      {/* Header */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-medium text-white">{proposal.title}</h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${CATEGORY_COLORS[proposal.category] || CATEGORY_COLORS.general}`}>
                            {proposal.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-3">{proposal.description}</p>

                        {/* Author + meta */}
                        <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-600">
                          <span>by {proposal.author?.display_name || proposal.author?.username || 'Unknown'}</span>
                          {proposal.author?.zid && <span className="text-[#f5a623]/60">ZID #{proposal.author.zid}</span>}
                          <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
                          {proposal.commentCount > 0 && <span>{proposal.commentCount} comments</span>}
                        </div>
                      </div>

                      {/* Vote tally bar */}
                      {proposal.tally.totalVoters > 0 && (
                        <div className="px-4 pb-2">
                          <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
                            {forPct > 0 && (
                              <div className="bg-green-500" style={{ width: `${forPct}%` }} />
                            )}
                            {againstPct > 0 && (
                              <div className="bg-red-500" style={{ width: `${againstPct}%` }} />
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[10px]">
                            <span className="text-green-400">
                              For: {proposal.tally.for.weight.toLocaleString()} ({proposal.tally.for.count})
                            </span>
                            <span className="text-gray-600">{proposal.tally.totalVoters} voters</span>
                            <span className="text-red-400">
                              Against: {proposal.tally.against.weight.toLocaleString()} ({proposal.tally.against.count})
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Vote buttons */}
                      {proposal.status === 'open' && (
                        <div className="flex border-t border-gray-800">
                          <button
                            onClick={() => handleVote(proposal.id, 'for')}
                            disabled={isVoting}
                            className="flex-1 text-xs font-medium py-2.5 text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50 border-r border-gray-800"
                          >
                            For
                          </button>
                          <button
                            onClick={() => handleVote(proposal.id, 'against')}
                            disabled={isVoting}
                            className="flex-1 text-xs font-medium py-2.5 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 border-r border-gray-800"
                          >
                            Against
                          </button>
                          <button
                            onClick={() => handleVote(proposal.id, 'abstain')}
                            disabled={isVoting}
                            className="flex-1 text-xs font-medium py-2.5 text-gray-500 hover:bg-white/5 transition-colors disabled:opacity-50"
                          >
                            Abstain
                          </button>
                        </div>
                      )}

                      {/* Closed status */}
                      {proposal.status !== 'open' && (
                        <div className={`px-4 py-2 border-t border-gray-800 text-xs font-medium ${
                          proposal.status === 'approved' ? 'text-green-400 bg-green-500/5' :
                          proposal.status === 'rejected' ? 'text-red-400 bg-red-500/5' :
                          'text-blue-400 bg-blue-500/5'
                        }`}>
                          {proposal.status === 'approved' ? 'Approved' :
                           proposal.status === 'rejected' ? 'Rejected' : 'Completed'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
