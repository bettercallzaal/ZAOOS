# ZABAL Staking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy a conviction staking contract on Base (fork ClawdViction, 100M ZABAL minimum), build a Farcaster Mini App staking page, add auto-stake to agents every 14 days, and show staking stats on the /respect page alongside SongJam and Mindshare data.

**Architecture:** Solidity contract forked from ClawdViction (stake/unstake/getConviction). Next.js `/stake` page with wagmi + Farcaster Mini App connector for one-tap staking (EIP-5792 batch approve+stake). Agent cron checks every run if 14 days since last stake and balance >= 100M, then auto-stakes. Staking tab added to RespectPageClient showing conviction leaderboard.

**Tech Stack:** Solidity (Foundry), wagmi v2, @farcaster/miniapp-wagmi-connector, viem, EIP-5792 batch txs

---

## File Structure

| File | Responsibility |
|------|---------------|
| Create: `contracts/ZabalConviction.sol` | Forked ClawdViction staking contract |
| Create: `src/lib/staking/contract.ts` | Contract address, ABI, read helpers |
| Create: `src/lib/staking/conviction.ts` | Fetch conviction data for leaderboard |
| Create: `src/app/stake/page.tsx` | Server component wrapper + metadata |
| Create: `src/app/stake/StakeClient.tsx` | Client staking UI with wagmi |
| Create: `src/components/respect/StakingLeaderboard.tsx` | Conviction leaderboard for /respect page |
| Create: `src/lib/agents/autostake.ts` | Auto-stake logic for agents (14-day cycle) |
| Modify: `src/app/(auth)/respect/RespectPageClient.tsx` | Add "Staking" tab |
| Modify: `src/lib/agents/vault.ts` | Call autoStake at end of daily routine |
| Modify: `src/lib/agents/banker.ts` | Call autoStake at end of daily routine |
| Modify: `src/lib/agents/dealer.ts` | Call autoStake at end of daily routine |
| Modify: `src/lib/agents/types.ts` | Add ZABAL_STAKING_CONTRACT address |

---

### Task 1: Staking Contract + ABI

**Files:**
- Create: `contracts/ZabalConviction.sol`
- Create: `src/lib/staking/contract.ts`
- Modify: `src/lib/agents/types.ts`

- [ ] **Step 1: Create the staking contract**

Fork ClawdViction with 3 changes: token name, constructor param, minimum stake.

```solidity
// contracts/ZabalConviction.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ZabalConviction {
    using SafeERC20 for IERC20;

    IERC20 public zabal;

    struct Stake {
        uint256 amount;
        uint256 stakedAt;
    }

    mapping(address => Stake[]) public stakes;
    mapping(address => uint256) public totalStaked;
    mapping(address => uint256) public weightedStakeSum;
    mapping(address => uint256) public convictionAccrued;
    uint256 public totalSupplyStaked;

    event Staked(address indexed user, uint256 amount, uint256 stakeIndex, uint256 stakedAt);
    event Unstaked(address indexed user, uint256 amount, uint256 stakeIndex, uint256 stakedAt, uint256 unstakedAt);

    constructor(address _zabal) {
        zabal = IERC20(_zabal);
    }

    function stake(uint256 amount) external {
        require(amount >= 100_000_000 * 1e18, "Minimum 100M ZABAL");
        zabal.safeTransferFrom(msg.sender, address(this), amount);

        uint256 index = stakes[msg.sender].length;
        stakes[msg.sender].push(Stake(amount, block.timestamp));
        totalStaked[msg.sender] += amount;
        totalSupplyStaked += amount;
        weightedStakeSum[msg.sender] += amount * block.timestamp;

        emit Staked(msg.sender, amount, index, block.timestamp);
    }

    function unstake(uint256 stakeIndex) external {
        Stake storage s = stakes[msg.sender][stakeIndex];
        require(s.amount > 0, "No stake at index");

        uint256 conviction = s.amount * (block.timestamp - s.stakedAt);
        convictionAccrued[msg.sender] += conviction;

        uint256 amount = s.amount;
        totalStaked[msg.sender] -= amount;
        totalSupplyStaked -= amount;
        weightedStakeSum[msg.sender] -= amount * s.stakedAt;

        s.amount = 0;
        s.stakedAt = 0;

        zabal.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount, stakeIndex, s.stakedAt, block.timestamp);
    }

    function getConviction(address user) external view returns (uint256) {
        return convictionAccrued[user] + totalStaked[user] * block.timestamp - weightedStakeSum[user];
    }

    function getActiveStakes(address user) external view returns (uint256[] memory amounts, uint256[] memory timestamps) {
        Stake[] storage userStakes = stakes[user];
        uint256 count = 0;
        for (uint256 i = 0; i < userStakes.length; i++) {
            if (userStakes[i].amount > 0) count++;
        }
        amounts = new uint256[](count);
        timestamps = new uint256[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < userStakes.length; i++) {
            if (userStakes[i].amount > 0) {
                amounts[j] = userStakes[i].amount;
                timestamps[j] = userStakes[i].stakedAt;
                j++;
            }
        }
    }
}
```

- [ ] **Step 2: Create contract helpers**

```typescript
// src/lib/staking/contract.ts

// Deploy address will be filled after deployment
export const ZABAL_STAKING_CONTRACT = process.env.NEXT_PUBLIC_ZABAL_STAKING_CONTRACT || '';

export const STAKING_ABI = [
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'stakeIndex', type: 'uint256' }],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getConviction',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getActiveStakes',
    outputs: [
      { name: 'amounts', type: 'uint256[]' },
      { name: 'timestamps', type: 'uint256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'totalStaked',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupplyStaked',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
```

- [ ] **Step 3: Add staking contract to agent types**

Append to `src/lib/agents/types.ts`:

```typescript
export const ZABAL_STAKING_CONTRACT = process.env.NEXT_PUBLIC_ZABAL_STAKING_CONTRACT || '';
```

- [ ] **Step 4: Commit**

```bash
git add contracts/ZabalConviction.sol src/lib/staking/contract.ts src/lib/agents/types.ts
git commit -m "feat(staking): ZabalConviction contract + ABI (fork ClawdViction, 100M min)"
```

---

### Task 2: Staking Mini App Page

**Files:**
- Create: `src/app/stake/page.tsx`
- Create: `src/app/stake/StakeClient.tsx`

- [ ] **Step 1: Create server page wrapper**

```typescript
// src/app/stake/page.tsx
import { Metadata } from 'next';
import StakeClient from './StakeClient';

const miniAppEmbed = JSON.stringify({
  version: '1',
  imageUrl: 'https://zaoos.com/og-stake.png',
  button: {
    title: 'Stake ZABAL',
    action: { type: 'launch_miniapp', url: 'https://zaoos.com/stake' },
  },
});

export const metadata: Metadata = {
  title: 'Stake ZABAL | ZAO OS',
  description: 'Stake ZABAL to earn conviction. More tokens + more time = more governance weight.',
  other: { 'fc:miniapp': miniAppEmbed },
};

export default function StakePage() {
  return <StakeClient />;
}
```

- [ ] **Step 2: Create client staking component**

```typescript
// src/app/stake/StakeClient.tsx
'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useSendCalls } from 'wagmi';
import { parseUnits, formatUnits, encodeFunctionData } from 'viem';
import { ZABAL_STAKING_CONTRACT, STAKING_ABI } from '@/lib/staking/contract';
import { TOKENS } from '@/lib/agents/types';

const ERC20_APPROVE_ABI = [{
  inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
  name: 'approve',
  outputs: [{ name: '', type: 'bool' }],
  stateMutability: 'nonpayable',
  type: 'function',
}] as const;

const PRESETS = [
  { label: '100M', value: '100000000' },
  { label: '500M', value: '500000000' },
  { label: '1B', value: '1000000000' },
];

export default function StakeClient() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('100000000');
  const { sendCalls, isPending } = useSendCalls();

  const { data: conviction } = useReadContract({
    address: ZABAL_STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'getConviction',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!ZABAL_STAKING_CONTRACT },
  });

  const { data: staked } = useReadContract({
    address: ZABAL_STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'totalStaked',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!ZABAL_STAKING_CONTRACT },
  });

  function handleStake() {
    if (!ZABAL_STAKING_CONTRACT) return;
    const amt = parseUnits(amount, 18);
    sendCalls({
      calls: [
        {
          to: TOKENS.ZABAL as `0x${string}`,
          data: encodeFunctionData({
            abi: ERC20_APPROVE_ABI,
            functionName: 'approve',
            args: [ZABAL_STAKING_CONTRACT as `0x${string}`, amt],
          }),
        },
        {
          to: ZABAL_STAKING_CONTRACT as `0x${string}`,
          data: encodeFunctionData({
            abi: STAKING_ABI,
            functionName: 'stake',
            args: [amt],
          }),
        },
      ],
    });
  }

  if (!ZABAL_STAKING_CONTRACT) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
        <p className="text-gray-400 text-sm">Staking contract not configured yet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Stake ZABAL</h1>
      <p className="text-gray-400 text-sm mb-6">
        Earn conviction. More tokens x more time = more governance weight + reward multiplier.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Your Conviction</div>
          <div className="text-[#f5a623] text-lg font-bold font-mono">
            {conviction ? (Number(conviction) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
          </div>
        </div>
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">ZABAL Staked</div>
          <div className="text-white text-lg font-bold font-mono">
            {staked ? formatUnits(staked, 18).split('.')[0] : '0'}
          </div>
        </div>
      </div>

      {/* Amount presets */}
      <div className="flex gap-2 mb-4">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setAmount(p.value)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              amount === p.value
                ? 'bg-[#f5a623] text-[#0a1628]'
                : 'bg-[#1a2a3a] text-gray-400 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stake button */}
      <button
        onClick={handleStake}
        disabled={!isConnected || isPending}
        className="w-full py-3 rounded-xl bg-[#f5a623] text-[#0a1628] font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Confirming...' : `Stake ${Number(amount).toLocaleString()} ZABAL`}
      </button>

      {!isConnected && (
        <p className="text-center text-gray-500 text-xs mt-3">
          Open in Farcaster to connect wallet
        </p>
      )}

      {/* Conviction info */}
      <div className="mt-8 bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
        <h3 className="text-white text-sm font-bold mb-2">How Conviction Works</h3>
        <p className="text-gray-400 text-xs leading-relaxed">
          Conviction = tokens staked x seconds held. Stake 100M ZABAL for 30 days = 259T conviction.
          Higher conviction = higher reward multiplier from the ZAO Oracle. Unstake anytime -- conviction earned stays.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/stake/page.tsx src/app/stake/StakeClient.tsx
git commit -m "feat(staking): Farcaster Mini App staking page with EIP-5792 one-tap"
```

---

### Task 3: Staking Leaderboard on /respect

**Files:**
- Create: `src/lib/staking/conviction.ts`
- Create: `src/components/respect/StakingLeaderboard.tsx`
- Modify: `src/app/(auth)/respect/RespectPageClient.tsx`

- [ ] **Step 1: Create conviction fetcher**

```typescript
// src/lib/staking/conviction.ts
import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { ZABAL_STAKING_CONTRACT, STAKING_ABI } from './contract';

const client = createPublicClient({ chain: base, transport: http() });

export interface ConvictionEntry {
  address: string;
  conviction: string;
  staked: string;
  stakedFormatted: string;
  convictionFormatted: string;
}

/**
 * Get conviction for a list of wallet addresses.
 * Used by the staking leaderboard.
 */
export async function getConvictionBatch(addresses: string[]): Promise<ConvictionEntry[]> {
  if (!ZABAL_STAKING_CONTRACT) return [];

  const results = await Promise.allSettled(
    addresses.map(async (addr) => {
      const [conviction, staked] = await Promise.all([
        client.readContract({
          address: ZABAL_STAKING_CONTRACT as `0x${string}`,
          abi: STAKING_ABI,
          functionName: 'getConviction',
          args: [addr as `0x${string}`],
        }),
        client.readContract({
          address: ZABAL_STAKING_CONTRACT as `0x${string}`,
          abi: STAKING_ABI,
          functionName: 'totalStaked',
          args: [addr as `0x${string}`],
        }),
      ]);
      return {
        address: addr,
        conviction: conviction.toString(),
        staked: staked.toString(),
        stakedFormatted: formatUnits(staked, 18).split('.')[0],
        convictionFormatted: (Number(conviction) / 1e30).toFixed(1) + 'T',
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<ConvictionEntry> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((e) => e.staked !== '0')
    .sort((a, b) => Number(BigInt(b.conviction) - BigInt(a.conviction)));
}
```

- [ ] **Step 2: Create staking leaderboard component**

```typescript
// src/components/respect/StakingLeaderboard.tsx
'use client';

import { useState, useEffect } from 'react';

interface StakingEntry {
  address: string;
  conviction: string;
  staked: string;
  stakedFormatted: string;
  convictionFormatted: string;
  name?: string;
}

export function StakingLeaderboard() {
  const [entries, setEntries] = useState<StakingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/staking/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        setEntries(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalConviction = entries.reduce((sum, e) => sum + Number(BigInt(e.conviction) / BigInt(1e18)), 0);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Stakers</div>
          <div className="text-white text-xl font-bold">{entries.length}</div>
        </div>
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Staked</div>
          <div className="text-white text-xl font-bold">
            {entries.reduce((sum, e) => sum + Number(e.stakedFormatted.replace(/,/g, '')), 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Leader</div>
          <div className="text-[#f5a623] text-xl font-bold truncate">
            {entries[0]?.name || entries[0]?.address?.slice(0, 8) || '--'}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#0d1b2a] rounded-xl h-16 animate-pulse border border-white/[0.08]" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No stakers yet.</p>
          <a href="/stake" className="text-[#f5a623] text-sm mt-2 inline-block">
            Be the first to stake ZABAL
          </a>
        </div>
      ) : (
        <div className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/[0.08]">
              <tr>
                <th className="text-left text-gray-500 text-xs uppercase px-4 py-3 w-12">#</th>
                <th className="text-left text-gray-500 text-xs uppercase px-4 py-3">Staker</th>
                <th className="text-right text-gray-500 text-xs uppercase px-4 py-3">Staked</th>
                <th className="text-right text-gray-500 text-xs uppercase px-4 py-3">Conviction</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.address} className="border-b border-white/[0.08] hover:bg-[#1a2a3a]/50">
                  <td className="px-4 py-3 text-gray-400 font-mono">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{entry.name || entry.address.slice(0, 6) + '...' + entry.address.slice(-4)}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-white font-mono">{Number(entry.stakedFormatted).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[#f5a623] font-mono">{entry.convictionFormatted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-center mt-4 text-gray-600 text-xs">
        Conviction = tokens staked x seconds held
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add Staking tab to RespectPageClient**

In `src/app/(auth)/respect/RespectPageClient.tsx`:

Add dynamic import at top (after SongjamLeaderboard import):
```typescript
const StakingLeaderboard = dynamic(
  () =>
    import('@/components/respect/StakingLeaderboard').then(
      (m) => m.StakingLeaderboard,
    ),
  { ssr: false },
);
```

Change Tab type:
```typescript
type Tab = 'leaderboard' | 'mindshare' | 'songjam' | 'staking';
```

Add to tabs array:
```typescript
{ id: 'staking', label: 'Staking' },
```

Add tab content after songjam block:
```typescript
{activeTab === 'staking' && <StakingLeaderboard />}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/staking/conviction.ts src/components/respect/StakingLeaderboard.tsx src/app/\(auth\)/respect/RespectPageClient.tsx
git commit -m "feat(staking): conviction leaderboard + Staking tab on /respect page"
```

---

### Task 4: Agent Auto-Stake (14-day cycle)

**Files:**
- Create: `src/lib/agents/autostake.ts`
- Modify: `src/lib/agents/vault.ts`
- Modify: `src/lib/agents/banker.ts`
- Modify: `src/lib/agents/dealer.ts`

- [ ] **Step 1: Create auto-stake module**

```typescript
// src/lib/agents/autostake.ts
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { executeSwap } from './wallet';
import { logAgentEvent } from './events';
import { TOKENS, type AgentName } from './types';
import { ZABAL_STAKING_CONTRACT } from '@/lib/staking/contract';
import { logger } from '@/lib/logger';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const MIN_STAKE = BigInt('100000000000000000000000000'); // 100M * 1e18

/**
 * Auto-stake ZABAL if:
 * 1. Staking contract is configured
 * 2. 14+ days since last stake
 * 3. Agent ZABAL balance >= 100M
 *
 * Called at end of each agent's daily cron.
 */
export async function maybeAutoStake(agentName: AgentName): Promise<void> {
  if (!ZABAL_STAKING_CONTRACT) return;

  const db = getSupabaseAdmin();

  // Check last stake event
  const { data: lastStake } = await db
    .from('agent_events')
    .select('created_at')
    .eq('agent_name', agentName)
    .eq('action', 'add_lp') // reuse add_lp action for staking
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(1);

  if (lastStake && lastStake.length > 0) {
    const daysSince = Date.now() - new Date(lastStake[0].created_at).getTime();
    if (daysSince < FOURTEEN_DAYS_MS) {
      logger.info(`[${agentName}] Auto-stake: ${Math.floor(daysSince / (24*60*60*1000))} days since last stake, waiting for 14`);
      return;
    }
  }

  // Approve + stake via Privy wallet (using executeSwap pattern for the two calls)
  try {
    // Approve ZABAL for staking contract
    const approveData = `0x095ea7b3${ZABAL_STAKING_CONTRACT.slice(2).padStart(64, '0')}${MIN_STAKE.toString(16).padStart(64, '0')}`;
    await executeSwap(agentName, {
      to: TOKENS.ZABAL,
      data: approveData,
      value: '0',
    });

    // Stake 100M ZABAL
    const stakeData = `0xa694fc3a${MIN_STAKE.toString(16).padStart(64, '0')}`;
    const hash = await executeSwap(agentName, {
      to: ZABAL_STAKING_CONTRACT,
      data: stakeData,
      value: '0',
    });

    await logAgentEvent({
      agent_name: agentName,
      action: 'add_lp',
      token_in: 'ZABAL',
      token_out: 'CONVICTION',
      amount_in: 100_000_000,
      usd_value: 0,
      tx_hash: hash,
      status: 'success',
    });

    logger.info(`[${agentName}] Auto-staked 100M ZABAL for conviction. TX: ${hash}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`[${agentName}] Auto-stake failed: ${msg}`);
  }
}
```

- [ ] **Step 2: Wire into vault.ts**

Add import at top of `src/lib/agents/vault.ts`:
```typescript
import { maybeAutoStake } from './autostake';
```

Add at the very end of `runVault()`, just before the final `return` in the try block (after the switch statement):
```typescript
    // Check auto-stake every run (will only execute if 14+ days since last)
    await maybeAutoStake('VAULT');
```

- [ ] **Step 3: Wire into banker.ts and dealer.ts**

Same pattern: add `import { maybeAutoStake } from './autostake';` and `await maybeAutoStake('BANKER');` / `await maybeAutoStake('DEALER');` at end of their respective run functions.

- [ ] **Step 4: Commit**

```bash
git add src/lib/agents/autostake.ts src/lib/agents/vault.ts src/lib/agents/banker.ts src/lib/agents/dealer.ts
git commit -m "feat(agents): auto-stake 100M ZABAL every 14 days for conviction"
```

---

### Task 5: Staking API Route

**Files:**
- Create: `src/app/api/staking/leaderboard/route.ts`

- [ ] **Step 1: Create staking leaderboard API**

```typescript
// src/app/api/staking/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getConvictionBatch } from '@/lib/staking/conviction';

/**
 * GET /api/staking/leaderboard
 * Returns conviction data for all known stakers.
 * Pulls wallet addresses from users table + agent_config.
 */
export async function GET() {
  try {
    // Get all wallet addresses we know about
    const [usersResult, agentsResult] = await Promise.allSettled([
      supabaseAdmin
        .from('users')
        .select('wallet_address, display_name')
        .not('wallet_address', 'is', null),
      supabaseAdmin
        .from('agent_config')
        .select('wallet_address, name'),
    ]);

    const addresses: { address: string; name: string }[] = [];

    if (usersResult.status === 'fulfilled' && usersResult.value.data) {
      for (const u of usersResult.value.data) {
        if (u.wallet_address) {
          addresses.push({ address: u.wallet_address, name: u.display_name || '' });
        }
      }
    }

    if (agentsResult.status === 'fulfilled' && agentsResult.value.data) {
      for (const a of agentsResult.value.data) {
        if (a.wallet_address) {
          addresses.push({ address: a.wallet_address, name: a.name });
        }
      }
    }

    if (addresses.length === 0) {
      return NextResponse.json([]);
    }

    const convictions = await getConvictionBatch(addresses.map((a) => a.address));

    // Merge names
    const nameMap = new Map(addresses.map((a) => [a.address.toLowerCase(), a.name]));
    const result = convictions.map((c) => ({
      ...c,
      name: nameMap.get(c.address.toLowerCase()) || null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('Staking leaderboard error:', err);
    return NextResponse.json([], { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/staking/leaderboard/route.ts
git commit -m "feat(staking): API route for conviction leaderboard"
```
