'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { base } from 'viem/chains';
import { ZOUNZ_GOVERNOR, governorAbi } from '@/lib/zounz/contracts';

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

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-500/10 text-green-400 border-green-500/20',
  Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Defeated: 'bg-red-500/10 text-red-400 border-red-500/20',
  Succeeded: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Executed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Canceled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  Queued: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Expired: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export default function ZounzProposalCard({
  proposal,
  votingPower,
}: {
  proposal: Proposal;
  votingPower: number;
}) {
  const { address } = useAccount();
  const [expanded, setExpanded] = useState(false);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 60_000);
    return () => clearInterval(interval);
  }, []);

  const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  const forPct = totalVotes > 0 ? (proposal.forVotes / totalVotes) * 100 : 0;
  const againstPct = totalVotes > 0 ? (proposal.againstVotes / totalVotes) * 100 : 0;
  const isActive = proposal.status === 'Active';
  const canVote = isActive && address && votingPower > 0;

  const [timeLeft, setTimeLeft] = useState({ timeLeftHrs: 0, timeLeftMins: 0 });
  useEffect(() => {
    const compute = () => {
      const now = Math.floor(Date.now() / 1000);
      const secondsLeft = Math.max(0, proposal.voteEnd - now);
      setTimeLeft({
        timeLeftHrs: Math.floor(secondsLeft / 3600),
        timeLeftMins: Math.floor((secondsLeft % 3600) / 60),
      });
    };
    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  }, [proposal.voteEnd]);
  const { timeLeftHrs, timeLeftMins } = timeLeft;

  const castVote = (support: number) => {
    if (!canVote) return;
    writeContract({
      address: ZOUNZ_GOVERNOR as `0x${string}`,
      abi: governorAbi,
      functionName: 'castVote',
      args: [proposal.proposalId as `0x${string}`, BigInt(support)],
      chain: base,
    });
  };

  return (
    <div className="bg-[#0a1628] rounded-lg border border-gray-800 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <button onClick={() => setExpanded(!expanded)} className="text-left w-full">
            <p className="text-sm font-medium text-white hover:text-[#f5a623] transition-colors">
              #{proposal.proposalNumber} — {proposal.title || 'Untitled Proposal'}
            </p>
          </button>
          <p className="text-[10px] text-gray-600 mt-0.5">
            by {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
            {' · '}
            {new Date(proposal.timeCreated * 1000).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <span
          className={`text-[9px] px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_COLORS[proposal.status] ?? STATUS_COLORS.Canceled}`}
        >
          {proposal.status}
        </span>
      </div>

      {/* Vote bar */}
      {totalVotes > 0 && (
        <div className="mb-3">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-800">
            <div className="bg-green-500 transition-all" style={{ width: `${forPct}%` }} />
            <div className="bg-red-500 transition-all" style={{ width: `${againstPct}%` }} />
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-gray-500">
            <span className="text-green-400">For: {proposal.forVotes}</span>
            <span className="text-red-400">Against: {proposal.againstVotes}</span>
            <span>Abstain: {proposal.abstainVotes}</span>
          </div>
        </div>
      )}

      {/* Time remaining for active proposals */}
      {isActive && (
        <p className="text-[10px] text-yellow-400 mb-2">
          {timeLeftHrs > 0
            ? `${timeLeftHrs}h ${timeLeftMins}m left`
            : `${timeLeftMins}m left`}
        </p>
      )}

      {/* Expanded description */}
      {expanded && proposal.description && (
        <p className="text-xs text-gray-400 mb-3 whitespace-pre-wrap line-clamp-6">
          {proposal.description}
        </p>
      )}

      {/* Vote buttons */}
      {canVote && !isConfirmed && (
        <div className="flex gap-2">
          <button
            onClick={() => castVote(1)}
            disabled={isPending || isConfirming}
            className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50"
          >
            {isPending || isConfirming ? 'Submitting...' : 'For'}
          </button>
          <button
            onClick={() => castVote(0)}
            disabled={isPending || isConfirming}
            className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            Against
          </button>
          <button
            onClick={() => castVote(2)}
            disabled={isPending || isConfirming}
            className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20 transition-colors disabled:opacity-50"
          >
            Abstain
          </button>
        </div>
      )}

      {/* Vote confirmed */}
      {isConfirmed && (
        <p className="text-[10px] text-green-400 text-center py-1">Vote submitted on-chain</p>
      )}

      {/* No voting power */}
      {isActive && address && votingPower === 0 && (
        <p className="text-[10px] text-gray-500 text-center py-1">
          You need ZOUNZ tokens to vote —{' '}
          <a
            href="https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f5a623] hover:underline"
          >
            get one at auction
          </a>
        </p>
      )}

      {/* Not connected */}
      {isActive && !address && (
        <p className="text-[10px] text-gray-500 text-center py-1">Connect wallet to vote</p>
      )}
    </div>
  );
}
