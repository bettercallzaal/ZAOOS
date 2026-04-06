'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import dynamic from 'next/dynamic';
import { ZOUNZ_GOVERNOR, governorAbi } from '@/lib/zounz/contracts';
import { communityConfig } from '@/../community.config';
import ZounzProposalCard from './ZounzProposalCard';

const ZounzCreateProposal = dynamic(() => import('./ZounzCreateProposal'), { ssr: false });

const NOUNS_BUILDER_URL = communityConfig.zounz.nounsBuilderUrl;
const VOTE_URL = `${NOUNS_BUILDER_URL}/vote`;

interface GovernanceData {
  proposalCount: number;
  proposalThreshold: number | null;
  quorum: number | null;
}

interface Proposal {
  proposalId: string;
  proposalNumber: number;
  title: string;
  description: string;
  proposer: string;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  status: string;
  voteStart: number;
  voteEnd: number;
  timeCreated: number;
}

type FilterTab = 'all' | 'active' | 'passed' | 'failed';

export default function ZounzProposals() {
  const { address, isConnected } = useAccount();
  const [govData, setGovData] = useState<GovernanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Proposals list state
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showCreate, setShowCreate] = useState(false);

  // Read voting power for connected wallet
  const { data: votingPower } = useReadContract({
    address: ZOUNZ_GOVERNOR,
    abi: governorAbi,
    functionName: 'getVotes',
    args: address ? [address] : undefined,
    chainId: 8453, // Base
    query: { enabled: isConnected && !!address },
  });

  // Fetch governance stats
  useEffect(() => {
    fetch('/api/zounz/proposals')
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setGovData(data);
        }
      })
      .catch(() => setError('Failed to load governance data'))
      .finally(() => setLoading(false));
  }, []);

  // Fetch proposals list
  useEffect(() => {
    fetch('/api/zounz/proposals/list')
      .then(r => r.json())
      .then(data => setProposals(data.proposals || []))
      .catch(() => {})
      .finally(() => setLoadingProposals(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#f5a623]/20 bg-[#0d1b2a] p-4 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-48 mb-3" />
        <div className="h-4 bg-gray-700 rounded w-32 mb-2" />
        <div className="h-10 bg-gray-700 rounded w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-[#0d1b2a] p-4">
        <p className="text-red-400 text-sm">Failed to load ZOUNZ governance: {error}</p>
        <a
          href={VOTE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#f5a623] text-sm hover:underline mt-2 inline-block"
        >
          View on nouns.build &rarr;
        </a>
      </div>
    );
  }

  const votes = votingPower ? Number(votingPower) : 0;
  const threshold = govData?.proposalThreshold ?? 1;

  // Filter logic
  const filtered = proposals.filter(p => {
    if (filter === 'active') return p.status === 'Active' || p.status === 'Pending';
    if (filter === 'passed') return p.status === 'Succeeded' || p.status === 'Executed' || p.status === 'Queued';
    if (filter === 'failed') return p.status === 'Defeated' || p.status === 'Expired' || p.status === 'Canceled';
    return true;
  });

  // Count per filter tab
  const countForFilter = (f: FilterTab): number => {
    if (f === 'all') return proposals.length;
    if (f === 'active') return proposals.filter(p => p.status === 'Active' || p.status === 'Pending').length;
    if (f === 'passed') return proposals.filter(p => p.status === 'Succeeded' || p.status === 'Executed' || p.status === 'Queued').length;
    if (f === 'failed') return proposals.filter(p => p.status === 'Defeated' || p.status === 'Expired' || p.status === 'Canceled').length;
    return 0;
  };

  return (
    <div className="rounded-2xl border border-[#f5a623]/20 bg-[#0d1b2a] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
            <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
            <path d="M18 8a6 6 0 0 0-9.33-5" />
          </svg>
          <h3 className="text-[#f5a623] font-bold text-base">ZOUNZ On-Chain Governance</h3>
        </div>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">Base</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-[#1a2a3a] rounded-xl p-3">
          <p className="text-xs text-gray-400">Proposals</p>
          <p className="text-lg font-bold text-white">{govData?.proposalCount ?? 0}</p>
        </div>
        {govData?.quorum != null && (
          <div className="bg-[#1a2a3a] rounded-xl p-3">
            <p className="text-xs text-gray-400">Quorum</p>
            <p className="text-lg font-bold text-white">{govData.quorum}</p>
          </div>
        )}
        <div className="bg-[#1a2a3a] rounded-xl p-3">
          <p className="text-xs text-gray-400">Your Votes</p>
          <p className={`text-lg font-bold ${votes > 0 ? 'text-[#f5a623]' : 'text-gray-500'}`}>
            {isConnected ? votes : '--'}
          </p>
        </div>
        {govData?.proposalThreshold != null && (
          <div className="bg-[#1a2a3a] rounded-xl p-3">
            <p className="text-xs text-gray-400">Threshold</p>
            <p className="text-lg font-bold text-white">{govData.proposalThreshold}</p>
          </div>
        )}
      </div>

      {/* Wallet status */}
      {!isConnected && (
        <div className="bg-[#f5a623]/5 border border-[#f5a623]/10 rounded-xl p-3 text-center">
          <p className="text-sm text-gray-400">
            Connect wallet to see your ZOUNZ voting power
          </p>
        </div>
      )}
      {isConnected && votes > 0 && (
        <div className="bg-[#f5a623]/5 border border-[#f5a623]/10 rounded-xl p-3 text-center">
          <p className="text-sm text-[#f5a623]">
            You have <span className="font-bold">{votes}</span> vote{votes !== 1 ? 's' : ''} in ZOUNZ governance
          </p>
        </div>
      )}

      {/* Action bar: Create Proposal + View on Nouns Builder */}
      <div className="flex items-center gap-2">
        {isConnected && votes >= threshold && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 bg-[#f5a623]/10 border border-[#f5a623]/30 hover:bg-[#f5a623]/20 transition-colors text-sm font-medium text-[#f5a623]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Proposal
          </button>
        )}
        <a
          href={VOTE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 bg-[#1a2a3a] border border-white/[0.08] hover:border-[#f5a623]/30 transition-colors text-sm font-medium text-gray-300 hover:text-[#f5a623] ml-auto"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          View on Nouns Builder
        </a>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {(['all', 'active', 'passed', 'failed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[10px] px-2 py-1 rounded-lg capitalize transition-colors ${
              filter === f
                ? 'bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30'
                : 'bg-[#0a1628] text-gray-500 border border-white/[0.08] hover:text-gray-300'
            }`}
          >
            {f} ({countForFilter(f)})
          </button>
        ))}
      </div>

      {/* Proposals list */}
      {loadingProposals ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#0a1628] rounded-lg border border-white/[0.08] p-4 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-2 bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-sm">
          {proposals.length === 0
            ? 'No proposals yet.'
            : `No ${filter} proposals.`}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(proposal => (
            <ZounzProposalCard
              key={proposal.proposalId}
              proposal={proposal}
              votingPower={votes}
            />
          ))}
        </div>
      )}

      {/* Info footer */}
      <p className="text-xs text-gray-500 text-center">
        ZOUNZ NFT holders vote on-chain. Proposals execute trustlessly via the Governor contract on Base.
      </p>

      {/* Create Proposal modal */}
      {showCreate && (
        <ZounzCreateProposal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            // Re-fetch proposals after successful creation
            setLoadingProposals(true);
            fetch('/api/zounz/proposals/list')
              .then(r => r.json())
              .then(data => setProposals(data.proposals || []))
              .catch(() => {})
              .finally(() => setLoadingProposals(false));
          }}
          proposalThreshold={threshold}
          votingPower={votes}
        />
      )}
    </div>
  );
}
