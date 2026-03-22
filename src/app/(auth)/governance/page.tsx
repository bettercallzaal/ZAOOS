'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { ProposalComments } from '@/components/governance/ProposalComments';
import { useAuth } from '@/hooks/useAuth';
import dynamic from 'next/dynamic';
import { ShareToFarcaster, shareTemplates } from '@/components/social/ShareToFarcaster';
import { GeneratePostButton } from '@/components/wavewarz/GeneratePostButton';

const HatTree = dynamic(() => import('@/components/hats/HatTree'), { ssr: false });
const HatManager = dynamic(() => import('@/components/hats/HatManager'), { ssr: false });
// EcosystemPanel moved to its own /ecosystem tab

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
  currentWallet: string | null;
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
  status: 'open' | 'approved' | 'rejected' | 'completed' | 'published';
  category: string;
  author: { display_name: string; username: string; pfp_url: string | null; fid: number; zid: number | null };
  created_at: string;
  closes_at: string | null;
  tally: ProposalTally;
  commentCount: number;
  publish_text?: string | null;
  published_cast_hash?: string | null;
  published_bluesky_uri?: string | null;
  respect_threshold?: number | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-500/10 text-gray-400',
  technical: 'bg-blue-500/10 text-blue-400',
  community: 'bg-purple-500/10 text-purple-400',
  governance: 'bg-[#f5a623]/10 text-[#f5a623]',
  treasury: 'bg-green-500/10 text-green-400',
  wavewarz: 'bg-emerald-500/10 text-emerald-400',
  social: 'bg-pink-500/10 text-pink-400',
};

export default function GovernancePage() {
  const [data, setData] = useState<RespectData | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'overview' | 'proposals' | 'roles' | 'manage'>('overview');

  // Create proposal state
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newPublishText, setNewPublishText] = useState('');
  const [newPublishImage, setNewPublishImage] = useState<File | null>(null);
  const [newPublishImagePreview, setNewPublishImagePreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Voting state
  const fetchCounterRef = useRef(0);
  const [voting, setVoting] = useState<string | null>(null);
  const [publishToast, setPublishToast] = useState(false);

  // Comments expansion state
  const [expandedComments, setExpandedComments] = useState<string | null>(null);

  // Admin state
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.isAdmin ?? false;
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleStatusChange = async (proposalId: string, newStatus: string) => {
    setUpdatingStatus(proposalId);
    try {
      const res = await fetch('/api/proposals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: proposalId, status: newStatus }),
      });
      if (res.ok) {
        const d = await fetch('/api/proposals').then((r) => r.json());
        setProposals(d.proposals || []);
      }
    } catch (err) {
      console.error('[governance] status change:', err);
    }
    setUpdatingStatus(null);
  };

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
      .catch((err) => console.error('[governance] proposals fetch:', err))
      .finally(() => setProposalsLoading(false));
  }, []);

  const myEntry = data?.leaderboard.find((e) =>
    (e.fid && e.fid === data.currentFid) ||
    (e.wallet && data.currentWallet && e.wallet.toLowerCase() === data.currentWallet.toLowerCase())
  );

  const handleCreateProposal = async () => {
    if (!newTitle.trim() || !newDesc.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      // Upload image if attached
      let publishImageUrl: string | undefined;
      if (newPublishImage) {
        const formData = new FormData();
        formData.append('file', newPublishImage);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          publishImageUrl = url;
        }
      }

      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          category: newCategory,
          publish_text: newPublishText.trim() || undefined,
          publish_image_url: publishImageUrl,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewTitle('');
        setNewDesc('');
        setNewPublishText('');
        setNewPublishImage(null);
        setNewPublishImagePreview(null);
        setNewCategory('general');
        const d = await fetch('/api/proposals').then((r) => r.json());
        setProposals(d.proposals || []);
      }
    } catch {
      setCreateError('Failed to create proposal. Please try again.');
    }
    setCreating(false);
  };

  const handleVote = async (proposalId: string, vote: 'for' | 'against' | 'abstain') => {
    setVoting(proposalId);
    try {
      const voteRes = await fetch('/api/proposals/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: proposalId, vote }),
      });
      const voteData = await voteRes.json();
      // Show toast if the vote triggered a publish
      if (voteData.published) {
        setPublishToast(true);
        setTimeout(() => setPublishToast(false), 4000);
      }
      // Small delay to ensure DB write is committed, then refresh
      await new Promise((r) => setTimeout(r, 500));
      fetchCounterRef.current += 1;
      const d = await fetch(`/api/proposals?_t=${fetchCounterRef.current}`).then((r) => r.json());
      setProposals(d.proposals || []);
    } catch (err) { console.error('[governance] vote:', err); }
    setVoting(null);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20">
      {/* Publish success toast */}
      {publishToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#f5a623] text-[#0a1628] text-sm font-medium px-5 py-3 rounded-xl shadow-lg animate-fade-in flex items-center gap-2">
          <span>Published to @thezao!</span>
          <button onClick={() => setPublishToast(false)} className="ml-2 text-[#0a1628]/60 hover:text-[#0a1628]">&times;</button>
        </div>
      )}
      {/* Header */}
      <header className="px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-300">Governance</h2>
          <div className="flex items-center gap-2">
            <div className="md:hidden"><NotificationBell /></div>
            <Link href="/home" className="text-xs text-gray-500 hover:text-white md:hidden">Back</Link>
          </div>
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
            onClick={() => setTab('roles')}
            className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${
              tab === 'roles' ? 'bg-[#f5a623]/10 text-[#f5a623]' : 'text-gray-500 hover:text-white'
            }`}
          >
            Roles
          </button>
          <button
            onClick={() => setTab('proposals')}
            className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${
              tab === 'proposals' ? 'bg-[#f5a623]/10 text-[#f5a623]' : 'text-gray-500 hover:text-white'
            }`}
          >
            Proposals{proposals.filter((p) => p.status === 'open').length > 0 && ` (${proposals.filter((p) => p.status === 'open').length})`}
          </button>
          {isAdmin && (
            <button
              onClick={() => setTab('manage')}
              className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${
                tab === 'manage' ? 'bg-[#f5a623]/10 text-[#f5a623]' : 'text-gray-500 hover:text-white'
              }`}
            >
              Manage
            </button>
          )}
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
                {/* Share your rank */}
                <div className="mt-3 pt-3 border-t border-[#f5a623]/20">
                  <ShareToFarcaster
                    template={shareTemplates.respectRank(myEntry.rank, myEntry.totalRespect)}
                    variant="button"
                    label="Share your rank"
                  />
                </div>
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

        {tab === 'roles' && (
          <HatTree />
        )}

        {tab === 'manage' && isAdmin && (
          <HatManager />
        )}

        {tab === 'proposals' && (
          <>
            {/* Generate WaveWarZ Post */}
            <div className="mb-3">
              <GeneratePostButton />
            </div>

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
                  <option value="technical">Technical</option>
                  <option value="community">Community</option>
                  <option value="governance">Governance</option>
                  <option value="treasury">Treasury</option>
                </select>
                <div className="bg-[#0a1628] rounded-lg p-3 space-y-2">
                  <p className="text-[10px] text-[#f5a623] uppercase tracking-wider font-medium">Auto-publish to @thezao (optional)</p>
                  <textarea
                    value={newPublishText}
                    onChange={(e) => setNewPublishText(e.target.value)}
                    placeholder="If this proposal passes 1000 Respect in votes, this text will auto-publish to @thezao on Farcaster + Bluesky..."
                    rows={2}
                    maxLength={1024}
                    className="w-full bg-[#1a2a3a] text-white text-base md:text-sm rounded-lg px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623] resize-none"
                  />
                  {/* Image attachment */}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-[#f5a623] cursor-pointer transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                      {newPublishImage ? 'Change image' : 'Attach image'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.size <= 5 * 1024 * 1024) {
                            setNewPublishImage(file);
                            setNewPublishImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                    {newPublishImagePreview && (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={newPublishImagePreview} alt="Preview" className="h-10 rounded border border-gray-700" />
                        <button
                          onClick={() => { setNewPublishImage(null); setNewPublishImagePreview(null); }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[8px]"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Leave empty to skip auto-publishing. If filled, the community votes to publish.
                  </p>
                </div>
                {myEntry && (
                  <p className="text-[10px] text-gray-500">
                    Your vote weight: {myEntry.totalRespect.toLocaleString()} respect
                  </p>
                )}
                {createError && (
                  <p className="text-xs text-red-400">{createError}</p>
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
                  const isExpired = proposal.closes_at && new Date(proposal.closes_at) < new Date();
                  const canVote = proposal.status === 'open' && !isExpired;

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
                        {/* Deadline display */}
                        {proposal.closes_at && (
                          <div className="mt-2">
                            {isExpired ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">
                                Voting closed
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5a623]/10 text-[#f5a623] font-medium">
                                {(() => {
                                  const timeLeft = new Date(proposal.closes_at!).getTime() - Date.now();
                                  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                                  const daysLeft = Math.floor(hoursLeft / 24);
                                  const remainingHours = hoursLeft % 24;
                                  if (daysLeft > 0) return `${daysLeft}d ${remainingHours}h remaining`;
                                  if (hoursLeft > 0) return `${hoursLeft}h remaining`;
                                  return `${Math.max(1, Math.floor(timeLeft / (1000 * 60)))}m remaining`;
                                })()}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-600">
                          <span>by {proposal.author?.display_name || proposal.author?.username || 'Unknown'}</span>
                          {proposal.author?.zid && <span className="text-[#f5a623]/60">ZID #{proposal.author.zid}</span>}
                          <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
                          <button
                            onClick={() => setExpandedComments(expandedComments === proposal.id ? null : proposal.id)}
                            className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                          >
                            {proposal.commentCount || 0} comments
                          </button>
                          <ShareToFarcaster
                            template={shareTemplates.proposal(proposal.title, 'created')}
                            variant="compact"
                            label="Share"
                          />
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
                      {canVote && (
                        <div className="border-t border-gray-800">
                          {myEntry && myEntry.totalRespect === 0 && (
                            <p className="text-[10px] text-yellow-500 px-4 py-1.5 bg-yellow-500/5">
                              Your vote will be recorded with 0 weight. Earn Respect to increase your influence.
                            </p>
                          )}
                          {isVoting ? (
                            <div className="flex items-center justify-center gap-2 py-2.5">
                              <div className="w-3.5 h-3.5 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs text-gray-400">Recording vote...</span>
                            </div>
                          ) : (
                            <div className="flex">
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
                        </div>
                      )}

                      {/* Closed status */}
                      {proposal.status !== 'open' && (
                        <div className={`px-4 py-2 border-t border-gray-800 text-xs font-medium ${
                          proposal.status === 'published' ? 'text-[#f5a623] bg-[#f5a623]/5' :
                          proposal.status === 'approved' ? 'text-green-400 bg-green-500/5' :
                          proposal.status === 'rejected' ? 'text-red-400 bg-red-500/5' :
                          'text-blue-400 bg-blue-500/5'
                        }`}>
                          {proposal.status === 'published' ? (
                            <div className="flex items-center gap-3 flex-wrap">
                              <span>Published to @thezao</span>
                              {proposal.published_cast_hash && proposal.published_cast_hash !== 'bluesky-only' && (
                                <a
                                  href={`https://warpcast.com/~/conversations/${proposal.published_cast_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-400 hover:text-purple-300 underline"
                                >
                                  View on Farcaster
                                </a>
                              )}
                              {proposal.published_bluesky_uri && (
                                <a
                                  href={(() => {
                                    // Convert at:// URI to bsky.app URL
                                    const match = proposal.published_bluesky_uri?.match(/at:\/\/(did:[^/]+)\/app\.bsky\.feed\.post\/(.+)/);
                                    if (match) return `https://bsky.app/profile/${match[1]}/post/${match[2]}`;
                                    return 'https://bsky.app';
                                  })()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 underline"
                                >
                                  View on Bluesky
                                </a>
                              )}
                            </div>
                          ) :
                           proposal.status === 'approved' ? 'Approved' :
                           proposal.status === 'rejected' ? 'Rejected' : 'Completed'}
                        </div>
                      )}

                      {/* Admin status change buttons */}
                      {isAdmin && (
                        <div className="flex items-center gap-1 px-4 py-2 border-t border-gray-800 bg-[#0a1628]/50">
                          <span className="text-[10px] text-gray-600 mr-1">Admin:</span>
                          {proposal.status === 'open' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(proposal.id, 'approved')}
                                disabled={updatingStatus === proposal.id}
                                className="text-[10px] px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(proposal.id, 'rejected')}
                                disabled={updatingStatus === proposal.id}
                                className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {proposal.status === 'approved' && (
                            <button
                              onClick={() => handleStatusChange(proposal.id, 'completed')}
                              disabled={updatingStatus === proposal.id}
                              className="text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                            >
                              Mark Completed
                            </button>
                          )}
                          {proposal.status !== 'open' && (
                            <button
                              onClick={() => handleStatusChange(proposal.id, 'open')}
                              disabled={updatingStatus === proposal.id}
                              className="text-[10px] px-2 py-1 rounded bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors disabled:opacity-50"
                            >
                              Reopen
                            </button>
                          )}
                          {updatingStatus === proposal.id && (
                            <span className="text-[10px] text-gray-500 ml-1">Updating...</span>
                          )}
                        </div>
                      )}

                      {/* Expandable comments section */}
                      {expandedComments === proposal.id && data && (
                        <div className="px-4 pb-4">
                          <ProposalComments proposalId={proposal.id} currentFid={data.currentFid} />
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
