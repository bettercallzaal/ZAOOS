# Sprint 2: ZOUNZ In-App Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable ZAO members to view, vote on, and create ZOUNZ Governor proposals without leaving the app

**Architecture:** Extend existing `ZounzProposals.tsx` (currently read-only, 162 lines) to fetch individual proposals, display voting UI, and submit `castVote()` + `propose()` transactions via Wagmi's `useWriteContract` — the same pattern already used in `ZounzAuction.tsx` for bidding.

**Tech Stack:** Wagmi v2 (`useWriteContract`, `useReadContract`, `useWaitForTransactionReceipt`), Viem, Base chain, existing Governor ABI in `src/lib/zounz/contracts.ts`

---

## Task 1: Proposal List API Route

**Files:**
- Create: `src/app/api/zounz/proposals/list/route.ts`

Fetch all proposals from the Governor contract with their state and vote counts. The current `/api/zounz/proposals` only returns aggregate stats (proposalCount, threshold, quorum) — this new route fetches individual proposals.

- [ ] **Step 1: Create the proposals list route**

```typescript
// src/app/api/zounz/proposals/list/route.ts
import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { getSessionData } from '@/lib/auth/session';
import { ZOUNZ_GOVERNOR, governorAbi } from '@/lib/zounz/contracts';

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const STATE_LABELS = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'] as const;

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const proposalCount = await client.readContract({
      address: ZOUNZ_GOVERNOR as `0x${string}`,
      abi: governorAbi,
      functionName: 'proposalCount',
    });

    const count = Number(proposalCount);
    if (count === 0) {
      return NextResponse.json({ proposals: [] });
    }

    // Fetch recent proposals (last 20 max)
    const startIdx = Math.max(0, count - 20);
    const proposalPromises: Promise<Record<string, unknown> | null>[] = [];

    for (let i = count; i > startIdx; i--) {
      proposalPromises.push(fetchProposal(i));
    }

    const results = await Promise.allSettled(proposalPromises);
    const proposals = results
      .filter((r): r is PromiseFulfilledResult<Record<string, unknown>> =>
        r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);

    return NextResponse.json({ proposals, total: count }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch (error) {
    console.error('[zounz/proposals/list] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}

async function fetchProposal(index: number): Promise<Record<string, unknown> | null> {
  try {
    // Read proposal by index using the proposals mapping
    // Nouns Builder Governor stores proposals by proposalId (bytes32 hash)
    // We need to use the proposalByIndex approach or fetch from events
    // For now, use the subgraph-style approach via the Governor's getter

    // The Nouns Builder Governor has a `proposals` getter that takes a proposalId
    // But we need to know the proposalId first
    // Alternative: read from events or use a counter-to-id mapping

    // Since the ABI has proposalCount but not proposalByIndex,
    // we'll need to read proposal events from the contract
    // For MVP, read from the Nouns Builder subgraph on Goldsky

    const query = `{
      proposals(
        where: { dao: "${ZOUNZ_GOVERNOR.toLowerCase()}" }
        orderBy: timeCreated
        orderDirection: desc
        first: 20
      ) {
        proposalId
        proposalNumber
        title
        description
        proposer { id }
        forVotes
        againstVotes
        abstainVotes
        voteStart
        voteEnd
        status
        timeCreated
        executableFrom
        expiresAt
      }
    }`;

    // Note: If subgraph is not available, fall back to on-chain reads
    // For now, return the index-based placeholder
    return {
      index,
      proposalId: null, // Will be populated from subgraph
    };
  } catch {
    return null;
  }
}
```

**IMPORTANT NOTE TO IMPLEMENTER:** The Nouns Builder Governor contract doesn't have a `proposalByIndex()` getter — proposals are stored by hash, not by sequential ID. The best approach is:

1. First check if the Nouns Builder subgraph on Goldsky/The Graph is accessible for Base chain
2. If yes, use GraphQL to fetch proposals (much simpler)
3. If not, we can read `ProposalCreated` events from the contract using `getLogs`

The implementer should try the subgraph first at `https://api.goldsky.com/api/public/project_clkk1ucdyf6ak38svcatie21s/subgraphs/nouns-builder-base-mainnet/stable/gn`. If that doesn't work, fall back to reading contract events.

The route should return an array of proposals with: proposalId, title, description, proposer, forVotes, againstVotes, abstainVotes, status (Active/Defeated/Succeeded/etc), voteStart, voteEnd.

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit 2>&1 | grep error | head -5`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/zounz/proposals/list/route.ts
git commit -m "feat: add ZOUNZ proposals list API (individual proposal data)"
```

---

## Task 2: ZOUNZ Proposal Card Component

**Files:**
- Create: `src/components/zounz/ZounzProposalCard.tsx`

Display a single ZOUNZ proposal with vote bars, status badge, and voting buttons.

- [ ] **Step 1: Create the proposal card component**

```typescript
// src/components/zounz/ZounzProposalCard.tsx
'use client';

import { useState } from 'react';
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

export default function ZounzProposalCard({ proposal, votingPower }: { proposal: Proposal; votingPower: number }) {
  const { address } = useAccount();
  const [expanded, setExpanded] = useState(false);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  const forPct = totalVotes > 0 ? (proposal.forVotes / totalVotes) * 100 : 0;
  const againstPct = totalVotes > 0 ? (proposal.againstVotes / totalVotes) * 100 : 0;
  const isActive = proposal.status === 'Active';
  const canVote = isActive && address && votingPower > 0;

  const now = Math.floor(Date.now() / 1000);
  const endTime = proposal.voteEnd;
  const timeLeftHrs = Math.max(0, Math.floor((endTime - now) / 3600));
  const timeLeftMins = Math.max(0, Math.floor(((endTime - now) % 3600) / 60));

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
            {new Date(proposal.timeCreated * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <span className={`text-[9px] px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_COLORS[proposal.status] || STATUS_COLORS.Canceled}`}>
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
          {timeLeftHrs > 0 ? `${timeLeftHrs}h ${timeLeftMins}m left` : `${timeLeftMins}m left`}
        </p>
      )}

      {/* Expanded description */}
      {expanded && proposal.description && (
        <p className="text-xs text-gray-400 mb-3 whitespace-pre-wrap line-clamp-6">{proposal.description}</p>
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
          You need ZOUNZ tokens to vote — <a href="https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883" target="_blank" rel="noopener noreferrer" className="text-[#f5a623] hover:underline">get one at auction</a>
        </p>
      )}

      {/* Not connected */}
      {isActive && !address && (
        <p className="text-[10px] text-gray-500 text-center py-1">Connect wallet to vote</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit 2>&1 | grep error | head -5`

- [ ] **Step 3: Commit**

```bash
git add src/components/zounz/ZounzProposalCard.tsx
git commit -m "feat: add ZOUNZ proposal card with on-chain voting"
```

---

## Task 3: Rewrite ZounzProposals to Show Proposal List + Voting

**Files:**
- Modify: `src/components/zounz/ZounzProposals.tsx`

Replace the current read-only stats display with a full proposal list that fetches from the API and renders `ZounzProposalCard` for each. Keep the stats header (proposal count, voting power, quorum) but add the proposals list below it.

- [ ] **Step 1: Read the current ZounzProposals.tsx**

Read the file to understand the current structure before modifying.

- [ ] **Step 2: Rewrite to include proposal list**

The component should:
1. Keep the existing stats section (proposal count, voting power, quorum, threshold)
2. Add a fetch to `/api/zounz/proposals/list` for individual proposals
3. Render each proposal using `ZounzProposalCard`
4. Show loading state while fetching
5. Filter tabs: All / Active / Passed / Failed
6. Keep the "View on Nouns Builder" external link

Key additions:
- `import ZounzProposalCard from './ZounzProposalCard'`
- State for `proposals` array and `filter` string
- useEffect fetching from `/api/zounz/proposals/list`
- Filter pills: All, Active, Passed (Succeeded+Executed), Failed (Defeated+Expired+Canceled)
- Map filtered proposals to `<ZounzProposalCard>` components
- Pass `votingPower` (already read from contract) to each card

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit 2>&1 | grep error | head -5`

- [ ] **Step 4: Commit**

```bash
git add src/components/zounz/ZounzProposals.tsx
git commit -m "feat: rewrite ZounzProposals with full proposal list + voting"
```

---

## Task 4: Proposal Creation Modal

**Files:**
- Create: `src/components/zounz/ZounzCreateProposal.tsx`

A modal/form for creating new ZOUNZ Governor proposals. Uses `useWriteContract` to call `propose()` on the Governor contract.

- [ ] **Step 1: Create the proposal creation component**

```typescript
// src/components/zounz/ZounzCreateProposal.tsx
'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { base } from 'viem/chains';
import { encodeFunctionData, parseEther } from 'viem';
import { ZOUNZ_GOVERNOR, ZOUNZ_TREASURY, governorAbi } from '@/lib/zounz/contracts';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  proposalThreshold: number;
  votingPower: number;
}

export default function ZounzCreateProposal({ onClose, onSuccess, proposalThreshold, votingPower }: Props) {
  const { address } = useAccount();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [proposalType, setProposalType] = useState<'text' | 'transfer'>('text');

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const canPropose = votingPower >= proposalThreshold;

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;

    let targets: `0x${string}`[];
    let values: bigint[];
    let calldatas: `0x${string}`[];

    if (proposalType === 'transfer' && transferTo && transferAmount) {
      // ETH transfer from treasury
      targets = [transferTo as `0x${string}`];
      values = [parseEther(transferAmount)];
      calldatas = ['0x' as `0x${string}`];
    } else {
      // Text-only proposal (no on-chain action)
      targets = [ZOUNZ_TREASURY as `0x${string}`];
      values = [0n];
      calldatas = ['0x' as `0x${string}`];
    }

    const fullDescription = `# ${title}\n\n${description}`;

    writeContract({
      address: ZOUNZ_GOVERNOR as `0x${string}`,
      abi: governorAbi,
      functionName: 'propose',
      args: [targets, values, calldatas, fullDescription],
      chain: base,
    });
  };

  if (isConfirmed) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-6 max-w-lg w-full text-center">
          <p className="text-lg font-bold text-green-400 mb-2">Proposal Created</p>
          <p className="text-sm text-gray-400 mb-4">Your proposal has been submitted on-chain. It will enter the voting period shortly.</p>
          <button onClick={() => { onSuccess(); onClose(); }} className="px-4 py-2 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-medium">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-white">Create ZOUNZ Proposal</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">&times;</button>
        </div>

        {!canPropose && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-xs text-red-400">
              You need at least {proposalThreshold} ZOUNZ token{proposalThreshold !== 1 ? 's' : ''} to create proposals.
              You have {votingPower}.
            </p>
          </div>
        )}

        {/* Proposal type toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setProposalType('text')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              proposalType === 'text' ? 'bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30' : 'bg-[#0a1628] text-gray-500 border border-gray-800'
            }`}
          >
            Text Proposal
          </button>
          <button
            onClick={() => setProposalType('transfer')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              proposalType === 'transfer' ? 'bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30' : 'bg-[#0a1628] text-gray-500 border border-gray-800'
            }`}
          >
            Treasury Transfer
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Proposal title..."
              maxLength={200}
              className="w-full bg-[#0a1628] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/50"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the proposal..."
              rows={5}
              className="w-full bg-[#0a1628] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/50 resize-none"
            />
          </div>

          {proposalType === 'transfer' && (
            <>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Recipient Address</label>
                <input
                  type="text"
                  value={transferTo}
                  onChange={e => setTransferTo(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-[#0a1628] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/50 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Amount (ETH)</label>
                <input
                  type="text"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  placeholder="0.1"
                  className="w-full bg-[#0a1628] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/50"
                />
              </div>
            </>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 mt-3 bg-red-500/10 rounded-lg px-3 py-2">
            {error.message?.includes('user rejected') ? 'Transaction rejected' : error.message || 'Transaction failed'}
          </p>
        )}

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-3 py-2 rounded-lg text-xs text-gray-400 border border-gray-700 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canPropose || !title.trim() || !description.trim() || isPending || isConfirming}
            className="flex-1 px-3 py-2 rounded-lg text-xs bg-[#f5a623] text-[#0a1628] font-medium hover:bg-[#f5a623]/90 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Submit Proposal'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit 2>&1 | grep error | head -5`

- [ ] **Step 3: Commit**

```bash
git add src/components/zounz/ZounzCreateProposal.tsx
git commit -m "feat: add ZOUNZ on-chain proposal creation modal"
```

---

## Task 5: Wire Create Proposal Button into ZounzProposals

**Files:**
- Modify: `src/components/zounz/ZounzProposals.tsx`

Add a "Create Proposal" button that opens the `ZounzCreateProposal` modal. Only show it if the user has enough voting power to meet the proposal threshold.

- [ ] **Step 1: Add import and state**

Add to ZounzProposals.tsx:
```typescript
import dynamic from 'next/dynamic';
const ZounzCreateProposal = dynamic(() => import('./ZounzCreateProposal'), { ssr: false });

// In the component:
const [showCreate, setShowCreate] = useState(false);
```

- [ ] **Step 2: Add button and modal**

In the stats header area, add a "Create Proposal" button next to the existing "View on Nouns Builder" link. Add the modal render:

```tsx
{/* Create proposal button */}
{votingPower >= proposalThreshold && (
  <button
    onClick={() => setShowCreate(true)}
    className="px-3 py-1.5 rounded-lg text-xs bg-[#f5a623] text-[#0a1628] font-medium hover:bg-[#f5a623]/90 transition-colors"
  >
    Create Proposal
  </button>
)}

{/* Modal */}
{showCreate && (
  <ZounzCreateProposal
    onClose={() => setShowCreate(false)}
    onSuccess={() => { /* refetch proposals */ }}
    proposalThreshold={proposalThreshold}
    votingPower={votingPower}
  />
)}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit 2>&1 | grep error | head -5`

- [ ] **Step 4: Commit**

```bash
git add src/components/zounz/ZounzProposals.tsx
git commit -m "feat: wire create proposal button into ZOUNZ governance"
```

---

## Summary

| Task | Feature | Files | Est. |
|------|---------|-------|------|
| 1 | Proposals list API | 1 new route | 20 min |
| 2 | Proposal card + voting | 1 new component | 15 min |
| 3 | Rewrite ZounzProposals | 1 edit | 20 min |
| 4 | Create proposal modal | 1 new component | 15 min |
| 5 | Wire create button | 1 edit | 10 min |

**Total: ~3 new files, 2 edits, ~1.5 hours**
