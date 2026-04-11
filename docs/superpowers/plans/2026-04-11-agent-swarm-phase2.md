# ZABAL Agent Swarm Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire actual wallet signing, add auto-burn, create BANKER + DEALER agents, add x402 content purchases, Farcaster posting, and admin dashboard UI.

**Architecture:** Extend existing `src/lib/agents/` module. Add `wallet.ts` for viem wallet client that signs and sends 0x swap transactions. Add `burn.ts` for 1% auto-burn. Create `banker.ts` and `dealer.ts` mirroring vault.ts pattern. Wire `autoCastToZao()` for trade summaries. Build admin component.

**Tech Stack:** viem (wallet signing), 0x Swap API, Supabase, Neynar (Farcaster posting), existing Next.js patterns

---

## File Structure

| File | Responsibility |
|------|---------------|
| Create: `src/lib/agents/wallet.ts` | viem WalletClient for signing + sending txs on Base |
| Create: `src/lib/agents/burn.ts` | 1% auto-burn on ZABAL purchases |
| Create: `src/lib/agents/banker.ts` | BANKER agent daily routine (2 PM UTC) |
| Create: `src/lib/agents/dealer.ts` | DEALER agent daily routine (10 PM UTC) |
| Create: `src/lib/agents/cast.ts` | Post agent trade summaries to Farcaster /zao |
| Create: `src/app/api/cron/agents/banker/route.ts` | BANKER cron endpoint |
| Create: `src/app/api/cron/agents/dealer/route.ts` | DEALER cron endpoint |
| Modify: `src/lib/agents/types.ts` | Add BANKER_SCHEDULE, DEALER_SCHEDULE, BURN_ADDRESS |
| Modify: `src/lib/agents/vault.ts` | Wire wallet signing + burn + Farcaster posting |
| Modify: `src/lib/env.ts` | Add BANKER/DEALER wallet keys |
| Modify: `vercel.json` | Add BANKER + DEALER cron schedules |

---

### Task 1: Wallet Signing Module

**Files:**
- Create: `src/lib/agents/wallet.ts`

- [ ] **Step 1: Create wallet module**

```typescript
// src/lib/agents/wallet.ts
import { createWalletClient, createPublicClient, http, type Hash } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import type { AgentName } from './types';
import { logger } from '@/lib/logger';

const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

const KEY_MAP: Record<AgentName, string> = {
  VAULT: 'VAULT_WALLET_PRIVATE_KEY',
  BANKER: 'BANKER_WALLET_PRIVATE_KEY',
  DEALER: 'DEALER_WALLET_PRIVATE_KEY',
};

/**
 * Execute a swap transaction on Base using 0x quote data.
 * Returns the tx hash on success.
 */
export async function executeSwap(
  agentName: AgentName,
  quoteData: { to: string; data: string; value: string; gas: string }
): Promise<Hash> {
  const envKey = KEY_MAP[agentName];
  const privateKey = process.env[envKey];
  if (!privateKey) throw new Error(`${envKey} not configured`);

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(RPC_URL),
  });

  logger.info(`[${agentName}] Sending swap tx to ${quoteData.to}`);

  const hash = await walletClient.sendTransaction({
    to: quoteData.to as `0x${string}`,
    data: quoteData.data as `0x${string}`,
    value: BigInt(quoteData.value),
    gas: BigInt(quoteData.gas),
  });

  logger.info(`[${agentName}] TX submitted: ${hash}`);
  return hash;
}

/**
 * Send ERC-20 tokens (for burns, tips, transfers).
 */
export async function sendToken(
  agentName: AgentName,
  tokenAddress: string,
  to: string,
  amount: bigint
): Promise<Hash> {
  const envKey = KEY_MAP[agentName];
  const privateKey = process.env[envKey];
  if (!privateKey) throw new Error(`${envKey} not configured`);

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(RPC_URL),
  });

  // ERC-20 transfer(address,uint256) selector: 0xa9059cbb
  const data = `0xa9059cbb${to.slice(2).padStart(64, '0')}${amount.toString(16).padStart(64, '0')}` as `0x${string}`;

  const hash = await walletClient.sendTransaction({
    to: tokenAddress as `0x${string}`,
    data,
    value: 0n,
  });

  logger.info(`[${agentName}] Token transfer: ${hash}`);
  return hash;
}

/**
 * Get ETH balance for an agent wallet.
 */
export async function getBalance(address: string): Promise<bigint> {
  const publicClient = createPublicClient({
    chain: base,
    transport: http(RPC_URL),
  });
  return publicClient.getBalance({ address: address as `0x${string}` });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/agents/wallet.ts
git commit -m "feat(agents): viem wallet signing for Base chain swaps and transfers"
```

---

### Task 2: Auto-Burn Module

**Files:**
- Create: `src/lib/agents/burn.ts`
- Modify: `src/lib/agents/types.ts`

- [ ] **Step 1: Add BURN_ADDRESS to types**

Add to end of `src/lib/agents/types.ts`:

```typescript
export const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';
export const BURN_PCT = 0.01; // 1% of every buy
```

- [ ] **Step 2: Create burn module**

```typescript
// src/lib/agents/burn.ts
import { sendToken } from './wallet';
import { logAgentEvent } from './events';
import { TOKENS, BURN_ADDRESS, BURN_PCT, type AgentName } from './types';
import { logger } from '@/lib/logger';

/**
 * Burn 1% of ZABAL from an agent's buy.
 * Sends tokens to 0x...dEaD (permanently unrecoverable).
 */
export async function burnZabal(
  agentName: AgentName,
  totalAmount: bigint
): Promise<string | null> {
  const burnAmount = (totalAmount * BigInt(Math.floor(BURN_PCT * 10000))) / 10000n;
  if (burnAmount === 0n) return null;

  try {
    const hash = await sendToken(agentName, TOKENS.ZABAL, BURN_ADDRESS, burnAmount);

    await logAgentEvent({
      agent_name: agentName,
      action: 'buy_zabal',
      token_in: 'ZABAL',
      token_out: 'BURN',
      amount_in: Number(burnAmount) / 1e18,
      usd_value: 0,
      tx_hash: hash,
      status: 'success',
    });

    logger.info(`[${agentName}] Burned ${burnAmount} ZABAL (1% of ${totalAmount})`);
    return hash;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`[${agentName}] Burn failed: ${msg}`);
    return null;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/burn.ts src/lib/agents/types.ts
git commit -m "feat(agents): 1% auto-burn on ZABAL purchases (CLAWD pattern)"
```

---

### Task 3: Wire Wallet Signing + Burn into VAULT

**Files:**
- Modify: `src/lib/agents/vault.ts`

- [ ] **Step 1: Update vault.ts buy_zabal case**

Replace the `buy_zabal` case in `src/lib/agents/vault.ts` (lines 53-87) with actual wallet execution:

The key change: after `getSwapQuote()`, call `executeSwap()` to actually send the transaction, then call `burnZabal()` on the received amount.

Add imports at top:
```typescript
import { executeSwap } from './wallet';
import { burnZabal } from './burn';
```

Update the `buy_zabal` case to:
1. Get quote (already done)
2. Execute swap via `executeSwap('VAULT', quote)`
3. Burn 1% via `burnZabal('VAULT', BigInt(quote.buyAmount))`
4. Log event with real tx_hash

Do the same for `buy_sang` case (execute swap, no burn for SANG).

- [ ] **Step 2: Commit**

```bash
git add src/lib/agents/vault.ts
git commit -m "feat(agents): wire actual wallet signing + auto-burn into VAULT"
```

---

### Task 4: Farcaster Posting Module

**Files:**
- Create: `src/lib/agents/cast.ts`

- [ ] **Step 1: Create cast module**

```typescript
// src/lib/agents/cast.ts
import { autoCastToZao } from '@/lib/publish/auto-cast';
import type { AgentName, AgentAction } from './types';
import { logger } from '@/lib/logger';

/**
 * Post agent trade summary to /zao Farcaster channel.
 * Uses the @thezao official account via autoCastToZao().
 */
export async function postTradeUpdate(params: {
  agentName: AgentName;
  action: AgentAction;
  details: string;
  txHash?: string;
}): Promise<string | null> {
  const emoji: Record<AgentName, string> = {
    VAULT: '[VAULT]',
    BANKER: '[BANKER]',
    DEALER: '[DEALER]',
  };

  const actionLabel: Record<string, string> = {
    buy_zabal: 'bought ZABAL',
    buy_sang: 'bought SANG',
    buy_content: 'bought content',
    sell_zabal: 'sold ZABAL',
    report: 'weekly report',
    add_lp: 'added LP',
    list_content: 'listed content',
  };

  const text = `${emoji[params.agentName]} ${actionLabel[params.action] || params.action}\n\n${params.details}`;

  const embedUrl = params.txHash
    ? `https://base.blockscout.com/tx/${params.txHash}`
    : undefined;

  try {
    const castHash = await autoCastToZao(text, embedUrl);
    if (castHash) {
      logger.info(`[${params.agentName}] Posted to /zao: ${castHash}`);
    }
    return castHash;
  } catch (err) {
    logger.error(`[${params.agentName}] Farcaster post failed:`, err);
    return null;
  }
}
```

- [ ] **Step 2: Wire into vault.ts**

Add to vault.ts after each successful trade:
```typescript
import { postTradeUpdate } from './cast';
// ... after logAgentEvent in buy_zabal case:
await postTradeUpdate({ agentName: 'VAULT', action: 'buy_zabal', details: `$${tradeUsd.toFixed(2)} -> ${quote.buyAmount} ZABAL`, txHash: hash });
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/cast.ts src/lib/agents/vault.ts
git commit -m "feat(agents): Farcaster posting for agent trade summaries to /zao"
```

---

### Task 5: BANKER + DEALER Agents

**Files:**
- Modify: `src/lib/agents/types.ts` (add schedules)
- Create: `src/lib/agents/banker.ts`
- Create: `src/lib/agents/dealer.ts`
- Create: `src/app/api/cron/agents/banker/route.ts`
- Create: `src/app/api/cron/agents/dealer/route.ts`
- Modify: `vercel.json` (add crons)
- Modify: `src/lib/env.ts` (add wallet keys)

- [ ] **Step 1: Add schedules to types.ts**

Append to `src/lib/agents/types.ts`:

```typescript
export const BANKER_SCHEDULE: Record<number, AgentAction> = {
  0: 'report',
  1: 'buy_zabal',
  2: 'buy_content',  // buys from VAULT
  3: 'buy_zabal',
  4: 'buy_content',  // buys from DEALER
  5: 'buy_zabal',
  6: 'buy_sang',
};

export const DEALER_SCHEDULE: Record<number, AgentAction> = {
  0: 'report',
  1: 'buy_content',  // buys from VAULT
  2: 'buy_zabal',
  3: 'buy_content',  // buys from BANKER
  4: 'buy_sang',
  5: 'buy_zabal',
  6: 'buy_zabal',
};
```

- [ ] **Step 2: Create banker.ts**

Same pattern as vault.ts but uses `BANKER_SCHEDULE`, agent name `'BANKER'`, and gets config for `'BANKER'`. Copy the full vault.ts structure, change every reference from `VAULT` to `BANKER` and `VAULT_SCHEDULE` to `BANKER_SCHEDULE`.

- [ ] **Step 3: Create dealer.ts**

Same pattern but `DEALER`, `DEALER_SCHEDULE`.

- [ ] **Step 4: Create cron routes**

`src/app/api/cron/agents/banker/route.ts` -- identical to vault cron route but imports and calls `runBanker()`.

`src/app/api/cron/agents/dealer/route.ts` -- identical but `runDealer()`.

- [ ] **Step 5: Update vercel.json**

Add to crons array:
```json
{ "path": "/api/cron/agents/banker", "schedule": "0 14 * * *" },
{ "path": "/api/cron/agents/dealer", "schedule": "0 22 * * *" }
```

- [ ] **Step 6: Add env vars to env.ts**

Add to optional section:
```typescript
BANKER_WALLET_PRIVATE_KEY: optionalEnv('BANKER_WALLET_PRIVATE_KEY'),
DEALER_WALLET_PRIVATE_KEY: optionalEnv('DEALER_WALLET_PRIVATE_KEY'),
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/agents/types.ts src/lib/agents/banker.ts src/lib/agents/dealer.ts \
  src/app/api/cron/agents/banker/route.ts src/app/api/cron/agents/dealer/route.ts \
  vercel.json src/lib/env.ts
git commit -m "feat(agents): BANKER + DEALER agents with cron routes (2 PM + 10 PM UTC)"
```

---

### Task 6: Admin Dashboard UI

**Files:**
- Create: `src/components/admin/AgentDashboard.tsx`

- [ ] **Step 1: Create dashboard component**

A `"use client"` component that:
1. Fetches `/api/admin/agents` on mount
2. Shows 3 agent cards (VAULT/BANKER/DEALER) with: name, brand, trading_enabled toggle, wallet address, daily spend, last trade
3. Shows recent events table (last 20 events across all agents)
4. Toggle `trading_enabled` via PATCH to `/api/admin/agents`

Follow the existing ZAO OS dark theme: navy `#0a1628` bg, gold `#f5a623` primary. Use Tailwind CSS.

- [ ] **Step 2: Wire into AdminPanel**

Add the AgentDashboard as a new tab/section in `src/app/(auth)/admin/AdminPanel.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AgentDashboard.tsx src/app/\(auth\)/admin/AdminPanel.tsx
git commit -m "feat(agents): admin dashboard UI for VAULT/BANKER/DEALER status and controls"
```

---

## Phase 2b (After Phase 2 Ships)

These are documented but deferred -- they require smart contract deployment:

1. **Conviction governance** -- fork ClawdVictionStaking.sol, deploy on Base, build staking UI
2. **Agent Bounty Board** -- fork AgentBountyBoard.sol, deploy on Base, build job posting UI
3. **x402 content purchases** -- install `@x402/fetch`, wire buy_content action to publish.new
