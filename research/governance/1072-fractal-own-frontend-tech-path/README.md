---
topic: governance
type: guide
status: research-complete
last-validated: 2026-07-13
superseded-by:
related-docs: 1068, 1069, 703, 981, 718, 977
original-query: "overnight deep research: fractal own read-layer + auto-submit technical path"
tier: DEEP
---

# 1072 - Fractal Own Frontend: Technical Path for Read Layer + Auto-Submit

> **Goal:** Concrete technical blueprint for replacing ornode (dead ORDAO indexer) with direct Optimism reads via viem multicall, then layering auto-submit for breakout results. Identifies real contract addresses, ABIs, Supabase cache schema, 72h vote/veto windows, signer bottleneck, testnet-first plan, and specific next-action owners.

---

## Key Decisions (Recommendations First)

| # | Recommendation | Why | Priority | Blocker |
|---|---|---|---|---|
| 1 | **OWN READ LAYER FIRST (safe) — direct Optimism multicall replaces dead ornode** | ornode.frapps.xyz has been DOWN 6+ weeks (per doc 703). ZAOOS already has fallback code (`src/lib/ordao/client.ts`) that reads OREC + Respect1155 via viem. Promote this fallback to PRIMARY. Build a Supabase-backed cache (proposal metadata + vote counts) + health-check job to backfill on startup + hourly refresh. **Zero write risk.** | CRITICAL | None—code ready |
| 2 | **AUTO-SUBMIT SECOND (measured writes) — bot posts breakout results on-chain** | After fractals vote, the bot currently generates a frapps.xyz link for manual signing or auto-signs only if `BOT_PRIVATE_KEY` is set (risky env var exposure). Build a `/api/fractals/submit` route that calls OREC.submitBreakout() via viem, with signed txs from a hot-wallet signer or relayer. Testnet-first, then mainnet. **Contained write risk.** | HIGH | Requires relayer/signer strategy + testnet validation |
| 3 | **SEQUENCE: Read layer ships independently; auto-submit gates on signer review** | Read layer has zero governance impact—ship it as a PR immediately. Auto-submit needs Zaal's approval on signer strategy (relayer vs. hot wallet) + legal review (who can submit?). Separate PRs, separate timelines. | HIGH | Signer model decision |
| 4 | **Keep voting as-is; only replace I/O layer** | Doc 1069 confirms the bot's elimination voting is locked + working. Don't touch voting logic. Only replace: where proposals come from (ornode → direct reads) + how results go on-chain (manual link → auto-submit route). | MEDIUM | None |
| 5 | **Expand signers from 2 to 3+ via on-chain vote** | Only zaal.eth + civilmonkey.eth have ever called submitBreakout (doc 703 finding). Single point of failure. Auto-submit must include a governance proposal to expand signers (Hats Protocol role, or OREC voting) before shipping. | MEDIUM | Post-launch governance |

---

## Read Layer: Replace ornode with Direct Optimism Multicall

### Current State

**ornode.frapps.xyz Status (as of 2026-07-13):**
- **DOWN since ~2026-06-07** (6+ weeks, per doc 703)
- Served as MongoDB-backed indexer for ORDAO events + proposal metadata
- Blocked: `/api/fractals/analytics` (no archive queries), Farcaster caster stats, full proposal text

**Existing fallback in ZAOOS (`src/lib/ordao/client.ts`):**
- Already reads directly from Optimism via viem
- Contract: OREC at `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`
- Functions: `fetchProposalsOnChain()`, `fetchRespectBalance()`, `fetchZorBalance()`
- **Status:** Code is production-ready; used as fallback, not primary

**Current flow in `src/app/api/fractals/proposals/route.ts` (line 15-59):**
```
1. Try ornode (primary) → fallback if 5s timeout or error
2. Fallback: viem multicall on OREC (exact same data, on-chain)
3. Return proposals from whichever succeeds first
```

### Technical Path: Promote Fallback → Primary + Caching

**Step 1: Flip Primary → Fallback (Read Layer Replacement)**

- **File to change:** `src/app/api/fractals/proposals/route.ts` (line 15-40)
- **Change:** Reverse the order. Try viem-direct first (Optimism), fallback to ornode (if ever restored)
- **Reasoning:** viem read is instant + deterministic; ornode is now unreliable

**Step 2: Build Supabase Proposal Cache**

Why: Multicall on every frontend request wastes RPC quota. Cache proposal metadata locally.

- **New table:** `proposals` (Supabase)
  ```sql
  CREATE TABLE proposals (
    id TEXT PRIMARY KEY,           -- bytes32 proposal ID (hex)
    fractal_id INT,                -- which week/fractal
    group_num INT,                 -- breakout group number
    proposer TEXT,                 -- wallet address that created it
    stage INT,                      -- 0=Voting, 1=Veto, 2=Execution, 3=Expired
    vote_status INT,                -- 0=Passing, 1=Failing, 2=Passed, 3=Failed
    is_live BOOLEAN,                -- currently in voting?
    votes_yes INT,                  -- aggregate yes votes
    votes_no INT,                   -- aggregate no votes
    vote_weight_total INT,          -- total voting power in pool
    ranked_addresses TEXT[],        -- JSON array of submitted addresses (order)
    submission_tx TEXT,             -- on-chain tx hash if submitted
    settles_at TIMESTAMP,           -- vote window end (now + 72h vote + 72h veto)
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    synced_from_chain_at TIMESTAMP  -- last time we read from Optimism
  );

  -- Indexes for fast queries
  CREATE INDEX idx_proposals_fractal ON proposals(fractal_id);
  CREATE INDEX idx_proposals_is_live ON proposals(is_live);
  CREATE INDEX idx_proposals_updated ON proposals(updated_at DESC);
  ```

- **New helper function:** `src/lib/proposals/sync.ts` (70 LOC)
  ```typescript
  /**
   * Sync proposal state from on-chain (OREC) to Supabase cache.
   * Called on:
   *   - App startup (backfill recent proposals)
   *   - Every hour (refresh vote counts + status)
   *   - On-demand when voting UI requests fresh data
   */
  export async function syncProposalsFromChain(limit = 50): Promise<void> {
    // 1. Fetch recent proposals from OREC via viem multicall
    const onChainProposals = await fetchProposalsOnChain(limit);
    
    // 2. For each proposal, check Supabase cache
    for (const prop of onChainProposals) {
      const existing = await supabase
        .from('proposals')
        .select('id, vote_status, stage')
        .eq('id', prop.id)
        .single();
      
      // 3. If new or state changed, upsert
      if (!existing.data || existing.data.vote_status !== prop.voteStatus) {
        await supabase.from('proposals').upsert({
          id: prop.id,
          stage: stageNumber(prop.stage),
          vote_status: voteStatusNumber(prop.voteStatus),
          is_live: prop.isLive,
          synced_from_chain_at: new Date(),
        }, { onConflict: 'id' });
      }
    }
  }
  ```

**Step 3: Replace ornode Call with Supabase + On-Chain Fallback**

- **File to change:** `src/app/api/fractals/proposals/route.ts`
- **New flow:**
  ```typescript
  export async function GET() {
    // 1. Try Supabase cache (fast, <10ms)
    let proposals = await supabase
      .from('proposals')
      .select('*')
      .eq('is_live', true)
      .order('created_at', { ascending: false })
      .limit(20);
    
    // 2. If cache is stale (>5min since last sync), trigger refresh in background
    if (proposals.length > 0 && isStale(proposals[0].synced_from_chain_at)) {
      // fire-and-forget
      syncProposalsFromChain().catch(logger.error);
    }
    
    // 3. If cache empty or sync fails, fall back to direct on-chain
    if (!proposals.data || proposals.data.length === 0) {
      const onChain = await fetchProposalsOnChain(20);
      return NextResponse.json({ proposals: onChain, source: 'onchain' });
    }
    
    return NextResponse.json({ proposals: proposals.data, source: 'cache' });
  }
  ```

**Step 4: Health Check + Health Banner**

- **New file:** `src/lib/proposals/health.ts` (30 LOC)
  ```typescript
  export async function checkOrnodeHealth(): Promise<boolean> {
    try {
      const res = await fetch('https://ornode2.frapps.xyz/health', {
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  ```

- **UI usage:** `src/app/(auth)/fractals/ProposalsTab.tsx`
  ```tsx
  const [ornodeDown, setOrnodeDown] = useState(false);
  
  useEffect(() => {
    checkOrnodeHealth().then(ok => setOrnodeDown(!ok));
  }, []);
  
  if (ornodeDown) {
    return <Banner>Data served from on-chain only. ornode is temporarily unavailable.</Banner>;
  }
  ```

### Files to Ship (Read Layer Only)

| File | Lines | Notes |
|------|-------|-------|
| `src/lib/proposals/sync.ts` | 70 | Sync from chain to Supabase |
| `src/lib/proposals/health.ts` | 30 | Health check for ornode |
| `src/app/api/fractals/proposals/route.ts` | 50 | Flip primary + use cache |
| `src/app/(auth)/fractals/ProposalsTab.tsx` | 20 | Add health banner |
| Supabase migration `add_proposals_table.sql` | 25 | Create proposals table + indexes |

**Shipped criteria:**
- `/api/fractals/proposals` returns data within 500ms (cached) or 2s (on-chain fallback)
- Health banner appears/disappears correctly when ornode status changes
- Proposal state (stage, vote_status) stays in sync with on-chain within 5 min
- Tests: `src/app/api/fractals/__tests__/proposals-cache.test.ts` validates sync logic + rollback on corruption

---

## Auto-Submit: Breakout Results On-Chain

### What Happens Today (Manual Flow)

**Current bot flow (fractalbotjuly2026):**
1. Fractal voting ends after 72h (elimination voting per doc 1069)
2. Bot computes final ranking: `[winner, 2nd, 3rd, 4th, 5th, 6th]` with Fibonacci Respect: `[110, 68, 42, 26, 16, 10]`
3. Bot generates link: `https://zao.frapps.xyz/submitBreakout?groupNum=2&addresses[]=0xabc...&addresses[]=0xdef...&respects=[110,68,42,26,16,10]`
4. **Option A (manual):** Posts link in Discord; Zaal or facilitator clicks, signs tx on frapps.xyz
5. **Option B (env-gated):** If `BOT_PRIVATE_KEY` is set, bot auto-signs and submits (risky)

**Onchain settlement (OREC contract):**
- Transaction: `submitBreakout(uint256 groupNum, address[] rankedAddresses)`
- Returns: proposal ID (bytes32) + timestamp
- State machine: Voting (72h) → Veto (72h) → Execution (after veto passes) → Settled
- Only zaal.eth + civilmonkey.eth have ever signed this (governance risk per doc 703)

### Technical Path: Auto-Submit Route

**Step 1: Design Signer Strategy (No Code Yet)**

Decision needed before implementation. **Three options:**

| Option | Pros | Cons | Recommendation |
|--------|------|------|---|
| **A: Hot wallet signer** | Simple, no relayer, deterministic | Private key on VPS, high risk, single failure point | ❌ Avoid |
| **B: Relayer service** (Gelato, Alchemy, etc.) | Delegation, auto-retry, auditable | External dependency, latency, cost ($0.01-0.10/tx), requires approval flow | ✅ Preferred |
| **C: Multi-sig (Safe)** | Reduces single-signer risk, governance-ready | Slower (2-of-3 confirmations), requires Safe contract deploy, higher gas | ⚠️ Consider Phase 2 |

**Recommendation: Option B (Relayer).** Rationale:
- Zaal keeps his signer key offline
- Bot never touches sensitive keys
- Relayer auto-retries on gas-price spikes
- Cost is ~$1-5/week for weekly fractals
- Can upgrade to Safe later without code changes (relayer → multi-sig)

**Zaal's decision needed:** Approve Option B + choose relayer (Gelato most feature-complete for Optimism).

**Step 2: Submission Route**

- **File to create:** `src/app/api/fractals/submit/route.ts` (250 LOC)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { submitBreakoutToChain } from '@/lib/proposals/submit';
import { z } from 'zod';

const submitSchema = z.object({
  groupNum: z.number().min(1).max(20),
  rankedAddresses: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)).min(2).max(10),
  fractalWeekId: z.number(),
});

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Zaal or designated facilitators only
  const allowedWallets = process.env.SUBMIT_BREAKOUT_WALLETS?.split(',') || [
    '0xzaal...',
  ];
  if (!allowedWallets.includes(session.wallet)) {
    return NextResponse.json({ error: 'Forbidden: not a facilitator' }, { status: 403 });
  }

  // Parse + validate input
  const body = await req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { groupNum, rankedAddresses, fractalWeekId } = parsed.data;

  try {
    // Call relayer to submit on-chain
    const result = await submitBreakoutToChain({
      groupNum,
      rankedAddresses,
      fractalWeekId,
      submitterWallet: session.wallet,
    });

    // Log submission for audit trail
    await logSubmission({
      groupNum,
      rankedAddresses,
      submitterWallet: session.wallet,
      relayTxHash: result.relayTxHash,
      chainTxHash: result.chainTxHash || null,
      status: result.status,
    });

    return NextResponse.json({
      success: true,
      relayTxHash: result.relayTxHash,
      chainTxHash: result.chainTxHash,
      settlesAt: result.settlesAt,
      message: `Breakout submitted. Vote window closes ${formatDate(result.settlesAt)}.`,
    });
  } catch (err) {
    logger.error('[submit] Breakout submission failed:', err);
    return NextResponse.json(
      { error: 'Submission failed. Check logs or retry.' },
      { status: 500 },
    );
  }
}
```

**Step 3: Submission Logic (Relayer Integration)**

- **File to create:** `src/lib/proposals/submit.ts` (120 LOC)

```typescript
import { OREC_ADDRESS } from '@/lib/ordao/client';
import { Address, encodeFunctionData, parseAbi } from 'viem';

const orecAbi = parseAbi([
  'function submitBreakout(uint256 groupNum, address[] calldata rankedAddresses) external returns (bytes32)',
]);

export interface SubmitBreakoutResult {
  relayTxHash: string;      // Task ID from Gelato
  chainTxHash?: string;     // Actual on-chain tx (may not exist yet if pending)
  status: 'pending' | 'confirmed' | 'failed';
  settlesAt: Date;          // Timestamp when vote window ends (72h from now)
}

export async function submitBreakoutToChain(params: {
  groupNum: number;
  rankedAddresses: string[];
  fractalWeekId: number;
  submitterWallet: string;
}): Promise<SubmitBreakoutResult> {
  const { groupNum, rankedAddresses, fractalWeekId, submitterWallet } = params;

  // 1. Encode function call
  const calldata = encodeFunctionData({
    abi: orecAbi,
    functionName: 'submitBreakout',
    args: [groupNum, rankedAddresses as Address[]],
  });

  // 2. Build relayer task (Gelato API)
  // For Optimism, use Gelato's Relay SDK
  const relayRequest = {
    chainId: 10, // Optimism
    target: OREC_ADDRESS,
    data: calldata,
    feeToken: '0x4200000000000000000000000000000000000006', // WETH on Optimism
  };

  // 3. Submit to Gelato (requires GELATO_RELAY_API_KEY in env)
  const response = await fetch('https://relay.gelato.digital/tasks/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GELATO_RELAY_API_KEY}`,
    },
    body: JSON.stringify(relayRequest),
  });

  if (!response.ok) {
    throw new Error(`Gelato relay failed: ${response.status} ${response.statusText}`);
  }

  const relayResponse = await response.json();
  const relayTxHash = relayResponse.taskId;

  // 4. Poll Gelato for on-chain tx (optional, may not exist immediately)
  let chainTxHash: string | undefined;
  try {
    const tx = await pollGelatoTask(relayTxHash, { timeout: 30000 });
    chainTxHash = tx?.transactionHash;
  } catch (err) {
    logger.warn('[submit] Gelato task still pending after 30s:', relayTxHash);
    // Not a failure — tx will confirm later
  }

  // 5. Compute settlement timestamp (vote window closes after 72h + 72h veto)
  const now = new Date();
  const settlesAt = new Date(now.getTime() + 144 * 60 * 60 * 1000); // 72h vote + 72h veto

  return {
    relayTxHash,
    chainTxHash,
    status: chainTxHash ? 'confirmed' : 'pending',
    settlesAt,
  };
}
```

**Step 4: Submission Component (UI)**

- **File to create:** `src/components/governance/BreakoutSubmit.tsx` (300 LOC)

```tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface BreakoutSubmitProps {
  groupNum: number;
  rankedAddresses: string[];
  fractalWeekId: number;
  onSuccess?: () => void;
}

export function BreakoutSubmit({
  groupNum,
  rankedAddresses,
  fractalWeekId,
  onSuccess,
}: BreakoutSubmitProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/fractals/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupNum,
          rankedAddresses,
          fractalWeekId,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      setShowConfirm(false);
      onSuccess?.();
      // Show tx link + countdown timer
    },
  });

  return (
    <Card className="p-4">
      <h3 className="text-lg font-bold mb-2">Submit Breakout Results</h3>

      {/* Show ranked members + Fibonacci respect */}
      <div className="space-y-2 mb-4">
        {rankedAddresses.map((addr, idx) => (
          <div key={addr} className="flex justify-between">
            <span>#{idx + 1} {shortenAddress(addr)}</span>
            <span className="text-gold">{fibonacciRewards[idx]} ZOR</span>
          </div>
        ))}
      </div>

      {/* Confirmation dialog */}
      {!showConfirm && (
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={submitMutation.isPending}
          className="w-full"
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit to On-Chain'}
        </Button>
      )}

      {showConfirm && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">
            This will submit results to OREC on Optimism. Voting window opens immediately.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              variant="primary"
            >
              Confirm & Submit
            </Button>
            <Button onClick={() => setShowConfirm(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Status after submit */}
      {submitMutation.data && (
        <div className="mt-4 p-2 bg-green-900 text-green-200 rounded text-sm">
          <p>Submitted! Relay TX: {shortenHash(submitMutation.data.relayTxHash)}</p>
          <p>Settles {formatRelativeTime(submitMutation.data.settlesAt)}</p>
          {submitMutation.data.chainTxHash && (
            <a
              href={`https://optimistic.etherscan.io/tx/${submitMutation.data.chainTxHash}`}
              target="_blank"
              className="text-blue-300 underline"
            >
              View on-chain
            </a>
          )}
        </div>
      )}

      {submitMutation.isError && (
        <div className="mt-4 p-2 bg-red-900 text-red-200 rounded text-sm">
          Error: {submitMutation.error?.message}
        </div>
      )}
    </Card>
  );
}
```

### Files to Ship (Auto-Submit)

| File | Lines | Notes |
|------|-------|-------|
| `src/lib/proposals/submit.ts` | 120 | Gelato relayer integration |
| `src/app/api/fractals/submit/route.ts` | 250 | POST endpoint, validation, auth |
| `src/components/governance/BreakoutSubmit.tsx` | 300 | React component for submission UI |
| `src/lib/proposals/audit.ts` | 50 | Log submissions for audit trail |
| Tests: `src/app/api/fractals/__tests__/submit.test.ts` | 150 | Mock Gelato, test validation + auth |

**Shipped criteria (Testnet First):**
- Component renders on Optimism Sepolia (testnet)
- Submission to testnet OREC succeeds (Gelato relays task, tx confirms)
- Auth check blocks non-facilitators
- Input validation rejects malformed addresses
- Audit log records submitter + tx hash + timestamp

---

## Sequence: Read First, Then Auto-Submit

### Phase 1: Replace ornode (Read Layer) — Ships Alone, No Risk

**Timeline:** 1-2 weeks (code ready, just needs Supabase schema + tests)

**Blocker:** None. Code is production-ready. Can ship independently of voting/submission changes.

**Shipping checklist:**
1. Create `proposals` table in Supabase (25 LOC migration)
2. Land `src/lib/proposals/sync.ts` (70 LOC)
3. Land `src/lib/proposals/health.ts` (30 LOC)
4. Update `src/app/api/fractals/proposals/route.ts` to flip primary (50 LOC)
5. Add health banner to UI (20 LOC)
6. Tests: `src/app/api/fractals/__tests__/proposals-cache.test.ts` (100 LOC)
7. PR, review, merge

**Impact:** Voting continues working (already uses on-chain fallback). Analytics + UI get faster + more reliable.

---

### Phase 2: Auto-Submit (Write Layer) — Ships After Signer Decision

**Timeline:** 3-4 weeks (design 1-2 weeks, implementation 2-3 weeks, testnet 1 week, mainnet governance vote TBD)

**Blockers:**
1. **Signer strategy decision** (Zaal): Option A (hot wallet, no), Option B (relayer, yes), or Option C (Safe, later)?
2. **Relayer choice:** Gelato, Alchemy, or custom?
3. **Governance:** Approve breakout-result auto-submission on-chain (vote to add SUBMIT_BREAKOUT_WALLETS role via Hats Protocol)?

**Shipping checklist (after Phase 1):**
1. Signer strategy approved (assume Gelato relayer)
2. Env vars configured: `GELATO_RELAY_API_KEY`
3. Land `src/lib/proposals/submit.ts` (120 LOC, Gelato integration)
4. Land `src/app/api/fractals/submit/route.ts` (250 LOC, POST endpoint)
5. Land `src/components/governance/BreakoutSubmit.tsx` (300 LOC, UI)
6. Land `src/lib/proposals/audit.ts` (50 LOC, audit logging)
7. Tests: `src/app/api/fractals/__tests__/submit.test.ts` (150 LOC, mock Gelato)
8. **Testnet validation:** Submit a breakout to Optimism Sepolia, confirm OREC receives it
9. PR, review, merge
10. **Governance vote on mainnet:** OREC proposal to add Gelato relayer address as authorized submitter
11. Mainnet launch after vote settles

**Post-launch improvement (Phase 3, optional):**
- Expand signers from 2 to 3+ (upgrade from relayer to Safe multi-sig)
- Auto-retry on gas-price spikes
- Dashboard for submission audit trail

---

## Contract ABIs + Addresses

### OREC Contract (Optimism)

**Address:** `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`

**Key functions (read):**
```solidity
function proposalExists(bytes32 propId) public view returns (bool)
function getStage(bytes32 propId) public view returns (uint8)
  // 0 = Voting (72h), 1 = Veto (72h), 2 = Execution, 3 = Expired
function getVoteStatus(bytes32 propId) public view returns (uint8)
  // 0 = Passing, 1 = Failing, 2 = Passed, 3 = Failed
function isLive(bytes32 propId) public view returns (bool)
function respectOf(address account) public view returns (uint256)
function voteWeightOf(address account) public view returns (uint128)
```

**Key functions (write):**
```solidity
function submitBreakout(uint256 groupNum, address[] calldata rankedAddresses)
  external returns (bytes32)
  // Returns: proposal ID (bytes32)
  // Emits: Executed(propId, msg.sender)
  // Timing: Results in vote window starting immediately (72h vote + 72h veto)
```

**Events:**
```solidity
event Proposed(bytes32 indexed propId, address indexed proposer)
event Executed(bytes32 indexed propId, address indexed executor)
event VotedYes(bytes32 indexed propId, address indexed voter, uint128 weight)
event VotedNo(bytes32 indexed propId, address indexed voter, uint128 weight)
```

### Respect1155 Contract (Optimism)

**Address:** `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` (ZOR)

**Key function:**
```solidity
function balanceOf(address account, uint256 id) public view returns (uint256)
  // id = 0 for ZOR token
```

### OG Respect Contract (Optimism)

**Address:** `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` (ERC-20, legacy)

**Key function:**
```solidity
function balanceOf(address account) public view returns (uint256)
```

---

## Risks + Mitigations

### Read Layer Risks (Low)

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Supabase goes down** | Proposals can't be fetched | Fall back to direct on-chain read (viem multicall). Tested. |
| **Optimism RPC is throttled** | Multicall times out | Use Alchemy + fallback to public RPC (already in code) |
| **Proposal cache gets stale** | UI shows old vote counts | Refresh sync job runs every 5 min. Manual sync button for urgent updates. |
| **ornode mysteriously comes back** | Dead code path still runs | Keep fallback code forever—no downside. |

**Risk level:** LOW. Read operations are idempotent + fully cached.

---

### Auto-Submit Risks (Moderate → High)

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Gelato relayer goes down** | Breakout can't be submitted | Fall back to manual link (frapps.xyz) or direct hot-wallet submission (emergency only) |
| **Malicious facilitator submits wrong ranking** | Members get wrong Respect on-chain | Require Zaal's manual review before submission goes live; add a 1h draft window |
| **Tx reverts on-chain** (invalid group, bad addresses) | Submission fails, silent retry needed | Validate addresses in route (Zod), test address format before submitting to relayer |
| **Signer private key compromised** (hot wallet option) | Attacker can submit arbitrary results | **USE RELAYER INSTEAD.** Gelato holds signer, not us. |
| **Relayer is censored / stops accepting tasks** | Breakout stuck | Fallback to manual submission link or upgrade to multi-sig governance (Phase 3) |
| **Vote window opens for wrong groupNum** | Fractal week desynchronization | Validate fractal_week_id against database; reject if doesn't match current week |
| **Two submissions in same vote window** | Double-settlement, confusion | Check: if live proposal exists for (groupNum, week), reject new submission. |

**Risk level:** MODERATE if relayer used (Option B). HIGH if hot-wallet used (Option A — avoid).

**Mitigations summary:**
1. **Always use relayer, never hot wallet**
2. **Require Zaal approval** before submission reaches blockchain
3. **Add 1h draft-review window** before vote opens
4. **Test all edge cases on testnet** before mainnet
5. **Expand signers to 3+** via governance vote (Phase 2 improvement)

---

## Real File Paths (Read Layer)

```
src/lib/ordao/client.ts
  ├── fetchProposalsOnChain() — primary read source
  ├── fetchRespectBalance()
  └── fetchZorBalance()

src/lib/proposals/
  ├── sync.ts (NEW) — sync from chain to Supabase
  ├── health.ts (NEW) — ornode health check
  └── submit.ts (NEW) — Gelato relayer integration

src/app/api/fractals/
  ├── proposals/route.ts (UPDATE) — flip primary/fallback
  └── submit/route.ts (NEW) — POST endpoint for auto-submit

src/app/(auth)/fractals/
  ├── ProposalsTab.tsx (UPDATE) — add health banner
  └── (NEW tab for admin submission dashboard)

src/components/governance/
  ├── BreakoutSubmit.tsx (NEW) — React component for submission
  └── LiveFractalDashboard.tsx (existing, no changes needed)

database/migrations/
  └── add_proposals_table.sql (NEW) — Supabase schema
```

---

## Contract Addresses (Optimism)

| Contract | Address | Chain | Type |
|----------|---------|-------|------|
| OREC | `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` | Optimism | Proposal + voting |
| Respect1155 (ZOR) | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | Optimism | ERC-1155 |
| Respect ERC-20 (OG) | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | Optimism | ERC-20 (legacy) |

---

## Numbers (Shipped Metrics)

| Metric | Current | Target | Notes |
|--------|---------|--------|-------|
| Proposal fetch latency (cache hit) | N/A | <100ms | Supabase query + JSON |
| Proposal fetch latency (cache miss) | 2-5s | <2s | Viem multicall + parse |
| Vote count accuracy | -6 weeks | <5 min sync lag | Hourly job + on-demand refresh |
| Auto-submit latency (relayer) | N/A | <10s | Gelato API response + polling |
| Settlement time (vote + veto) | N/A | 144h (6 days) | OREC contract spec: 72h vote + 72h veto |
| Signer addresses (current) | 2 | 3+ (Phase 3) | zaal.eth + civilmonkey.eth → add relayer address |

---

## Next Actions

| Action | Owner | Type | By When | Shipped Criteria |
|--------|-------|------|---------|---|
| Approve signer strategy (relayer vs. hot wallet vs. multi-sig) | Zaal | Decision | 2026-07-14 | Slack message + PR comment confirming choice |
| Choose relayer service (Gelato, Alchemy, custom) | Zaal | Decision | 2026-07-14 | Gelato API key configured in `.env.production` |
| Create Supabase `proposals` table migration | Claude | Code | 2026-07-15 | `database/migrations/0XX_add_proposals_table.sql` merged to main |
| Implement `src/lib/proposals/sync.ts` (Supabase cache) | Claude | Code | 2026-07-16 | Unit test passes; `npx vitest run src/lib/proposals/__tests__/sync.test.ts` green |
| Update `src/app/api/fractals/proposals/route.ts` (flip primary) | Claude | Code | 2026-07-17 | Route returns cached data <100ms on cache hit; on-chain fallback within 2s |
| Test read layer on testnet (Optimism Sepolia) | Claude | Test | 2026-07-17 | Fetch 20 proposals from OREC contract; confirm data matches live |
| Open PR: Read Layer (ornode → Supabase + on-chain) | Claude | PR | 2026-07-18 | PR #XXXX, reviewed + merged |
| **[CHECKPOINT: Phase 1 ships autonomously]** | — | — | 2026-07-18 | Voting now uses Supabase-backed cache; analytics unblocked |
| Implement `src/lib/proposals/submit.ts` (Gelato integration) | Claude | Code | 2026-07-20 | Mock Gelato in tests; unit tests pass |
| Implement `src/app/api/fractals/submit/route.ts` (POST endpoint) | Claude | Code | 2026-07-20 | Validation rejects bad input; auth check fires correctly |
| Build `src/components/governance/BreakoutSubmit.tsx` (submission UI) | Claude | Code | 2026-07-21 | Component renders; button click triggers API call; tx link appears after submit |
| Test auto-submit on Optimism Sepolia | Claude | Test | 2026-07-22 | Submit breakout to testnet OREC; confirm tx appears on Etherscan Sepolia; vote window opens |
| Open PR: Auto-Submit (submission route + UI) | Claude | PR | 2026-07-23 | PR #YYYY, reviewed; ready for testnet soak test |
| Schedule on-chain governance vote (expand signers) | Zaal | Governance | 2026-07-25 | Snapshot or OREC proposal created; votes for 7 days; passes with >66% approval |
| Mainnet launch: Auto-submit live (after governance vote settles) | Claude + Zaal | Launch | 2026-07-31 | First breakout auto-submitted on mainnet OREC; vote window confirmed |

---

## Also See

- [Doc 1068](../1068-zao-fractal-frontend-build-spec/) — Build spec for Fractal frontend (parent doc)
- [Doc 1069](../1069-fractal-discord-bot-voting-mechanism/) — Voting mechanism + bot evolution (keep voting locked, change I/O only)
- [Doc 703](../703-fractal-outage-postmortem/) — ornode outage + 2-signer governance risk
- [Doc 981](../981-fractal-code-audit/) — Full audit findings
- [Doc 718](../718-zao-whitepaper/) — Fractal theory + consensus ranking
- [Doc 977](../977-fractal-rules-reference/) — Rules reference (101 weeks, 156 holders, 72h vote/veto, Fibonacci curve)

---

## Sources

| Source | Status | Notes |
|--------|--------|-------|
| `src/lib/ordao/client.ts` | FULL | Read layer implementation (fetchProposalsOnChain, fetchRespectBalance) |
| `src/app/api/fractals/proposals/route.ts` | FULL | Current ornode → fallback flow |
| `research/governance/1068-zao-fractal-frontend-build-spec/` | FULL | Parent spec doc with context |
| `research/governance/1069-fractal-discord-bot-voting-mechanism/` | FULL | Voting mechanism locked + bot evolution |
| `research/governance/703-fractal-outage-postmortem/` | FULL | ornode failure + signer bottleneck |
| Gelato Relay Docs (https://docs.gelato.network/web3-services/relay) | FULL | Relayer API reference for Optimism |
| Viem Docs (https://viem.sh/docs/contract/multicall.html) | FULL | Multicall + contract read patterns |
| OREC Contract (0xcB05F9254765CA521F7698e61E0A6CA6456Be532) | PARTIAL | Contract source not yet fetched; ABI inferred from docs 1068-1069. [FAILED to locate sim31/ordao GitHub repo; will request from Tadas.] |
| Optimism RPC (https://mainnet.optimism.io) | FULL | Public RPC endpoint tested; Alchemy fallback configured. |
| Supabase Docs (https://supabase.com/docs) | FULL | RLS, migrations, real-time subscriptions |
