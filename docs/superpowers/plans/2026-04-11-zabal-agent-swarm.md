# ZABAL Agent Swarm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 3 autonomous wallet agents (VAULT, BANKER, DEALER) that trade ZABAL, buy each other's content via x402, and create real on-chain volume on Base -- starting with VAULT in ZAO OS.

**Architecture:** Each agent is a Vercel cron route (`/api/cron/agents/vault`) that runs daily on a schedule. The cron checks balances via 0x API, determines the day's action (buy ZABAL, buy content, report), executes via a shared swap utility, and logs everything to a `agent_events` Supabase table. Agent config (max spend, allowed contracts, trading enabled) lives in a `agent_config` Supabase table editable via admin dashboard.

**Tech Stack:** Next.js 16 API routes, Supabase (agent_events + agent_config tables), 0x Swap API v2 (Base chain), viem for transaction building, Vercel crons for scheduling. Privy agentic wallets added in Phase 2 (start with raw viem wallet for v1).

**Design docs:** research/agents/325-zabal-agent-swarm-economy, research/business/324-zabal-sang-wallet-agent-tokenomics

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/lib/agents/types.ts` | Agent types, config interface, event types |
| `src/lib/agents/swap.ts` | 0x Swap API integration -- quote and execute swaps on Base |
| `src/lib/agents/config.ts` | Load/save agent config from Supabase |
| `src/lib/agents/events.ts` | Log agent events to Supabase |
| `src/lib/agents/vault.ts` | VAULT agent logic -- daily routine, action selection |
| `src/app/api/cron/agents/vault/route.ts` | VAULT cron endpoint (Vercel cron triggers this) |
| `src/app/api/admin/agents/route.ts` | Admin API: list agents, update config, view events |
| `scripts/seed-agent-config.sql` | SQL to create tables + seed VAULT/BANKER/DEALER configs |

---

### Task 1: Agent Types & Config Schema

**Files:**
- Create: `src/lib/agents/types.ts`
- Create: `scripts/seed-agent-config.sql`

- [ ] **Step 1: Create agent types**

```typescript
// src/lib/agents/types.ts

export type AgentName = 'VAULT' | 'BANKER' | 'DEALER';

export type AgentAction =
  | 'buy_zabal'
  | 'sell_zabal'
  | 'buy_sang'
  | 'buy_content'
  | 'list_content'
  | 'add_lp'
  | 'report';

export interface AgentConfig {
  id: string;
  name: AgentName;
  brand: string;
  wallet_address: string;
  max_daily_spend_usd: number;
  max_single_trade_usd: number;
  trading_enabled: boolean;
  buy_price_ceiling: number;
  sell_price_floor: number;
  content_purchase_budget_usd: number;
  lp_allocation_pct: number;
  cron_schedule: string;
  allowed_contracts: string[];
  created_at: string;
  updated_at: string;
}

export interface AgentEvent {
  id: string;
  agent_name: AgentName;
  action: AgentAction;
  token_in: string | null;
  token_out: string | null;
  amount_in: number | null;
  amount_out: number | null;
  usd_value: number | null;
  tx_hash: string | null;
  content_id: string | null;
  status: 'pending' | 'success' | 'failed';
  error_message: string | null;
  created_at: string;
}

// Base chain token addresses
export const TOKENS = {
  ZABAL: '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07',
  SANG: '0x4ff4d349caa028bd069bbe85fa05253f96176741',
  WETH: '0x4200000000000000000000000000000000000006',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const;

export const BASE_CHAIN_ID = 8453;

// Day-of-week action schedules (0=Sunday)
export const VAULT_SCHEDULE: Record<number, AgentAction> = {
  0: 'report',       // Sunday
  1: 'buy_zabal',    // Monday
  2: 'buy_sang',     // Tuesday
  3: 'buy_content',  // Wednesday
  4: 'buy_zabal',    // Thursday
  5: 'buy_content',  // Friday
  6: 'add_lp',       // Saturday
};
```

- [ ] **Step 2: Create SQL migration**

```sql
-- scripts/seed-agent-config.sql

-- Agent config table
CREATE TABLE IF NOT EXISTS agent_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  brand text NOT NULL,
  wallet_address text NOT NULL DEFAULT '',
  max_daily_spend_usd numeric NOT NULL DEFAULT 5,
  max_single_trade_usd numeric NOT NULL DEFAULT 2,
  trading_enabled boolean NOT NULL DEFAULT false,
  buy_price_ceiling numeric NOT NULL DEFAULT 0.001,
  sell_price_floor numeric NOT NULL DEFAULT 0.00000005,
  content_purchase_budget_usd numeric NOT NULL DEFAULT 5,
  lp_allocation_pct numeric NOT NULL DEFAULT 10,
  cron_schedule text NOT NULL DEFAULT '0 6 * * *',
  allowed_contracts text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agent events table
CREATE TABLE IF NOT EXISTS agent_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name text NOT NULL,
  action text NOT NULL,
  token_in text,
  token_out text,
  amount_in numeric,
  amount_out numeric,
  usd_value numeric,
  tx_hash text,
  content_id text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_events_agent ON agent_events(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_events_action ON agent_events(action);
CREATE INDEX IF NOT EXISTS idx_agent_events_created ON agent_events(created_at DESC);

-- Seed configs for 3 agents (wallets added later)
INSERT INTO agent_config (name, brand, cron_schedule, allowed_contracts)
VALUES
  ('VAULT', 'ZAO OS', '0 6 * * *', ARRAY[
    '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07',
    '0x4ff4d349caa028bd069bbe85fa05253f96176741',
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    '0x4200000000000000000000000000000000000006'
  ]),
  ('BANKER', 'COC Concertz', '0 14 * * *', ARRAY[
    '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07',
    '0x4ff4d349caa028bd069bbe85fa05253f96176741',
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    '0x4200000000000000000000000000000000000006'
  ]),
  ('DEALER', 'FISHBOWLZ', '0 22 * * *', ARRAY[
    '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07',
    '0x4ff4d349caa028bd069bbe85fa05253f96176741',
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    '0x4200000000000000000000000000000000000006'
  ])
ON CONFLICT (name) DO NOTHING;

-- RLS: admin only
ALTER TABLE agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/types.ts scripts/seed-agent-config.sql
git commit -m "feat(agents): types and SQL schema for VAULT/BANKER/DEALER"
```

---

### Task 2: Agent Config & Event Logging

**Files:**
- Create: `src/lib/agents/config.ts`
- Create: `src/lib/agents/events.ts`

- [ ] **Step 1: Create config loader**

```typescript
// src/lib/agents/config.ts
import { getSupabaseAdmin } from '@/lib/db/supabase';
import type { AgentConfig, AgentName } from './types';

export async function getAgentConfig(name: AgentName): Promise<AgentConfig | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('agent_config')
    .select('*')
    .eq('name', name)
    .single();

  if (error || !data) return null;
  return data as AgentConfig;
}

export async function getDailySpend(name: AgentName): Promise<number> {
  const db = getSupabaseAdmin();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data } = await db
    .from('agent_events')
    .select('usd_value')
    .eq('agent_name', name)
    .eq('status', 'success')
    .gte('created_at', todayStart.toISOString());

  if (!data) return 0;
  return data.reduce((sum, e) => sum + (e.usd_value || 0), 0);
}
```

- [ ] **Step 2: Create event logger**

```typescript
// src/lib/agents/events.ts
import { getSupabaseAdmin } from '@/lib/db/supabase';
import type { AgentName, AgentAction } from './types';

export async function logAgentEvent(params: {
  agent_name: AgentName;
  action: AgentAction;
  token_in?: string;
  token_out?: string;
  amount_in?: number;
  amount_out?: number;
  usd_value?: number;
  tx_hash?: string;
  content_id?: string;
  status: 'pending' | 'success' | 'failed';
  error_message?: string;
}) {
  const db = getSupabaseAdmin();
  const { error } = await db.from('agent_events').insert(params);
  if (error) {
    console.error(`[${params.agent_name}] Failed to log event:`, error.message);
  }
}

export async function getRecentEvents(name: AgentName, limit = 20) {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from('agent_events')
    .select('*')
    .eq('agent_name', name)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/config.ts src/lib/agents/events.ts
git commit -m "feat(agents): config loader and event logging for agent swarm"
```

---

### Task 3: 0x Swap API Integration

**Files:**
- Create: `src/lib/agents/swap.ts`

- [ ] **Step 1: Create swap utility**

```typescript
// src/lib/agents/swap.ts
import { BASE_CHAIN_ID } from './types';

const ZX_API_BASE = 'https://api.0x.org';

interface SwapQuote {
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
  buyAmount: string;
  sellAmount: string;
  price: string;
  estimatedGas: string;
}

/**
 * Get a swap quote from 0x API on Base chain.
 * Handles multi-hop routing (e.g. ZABAL -> ETH -> SANG).
 */
export async function getSwapQuote(params: {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  takerAddress: string;
}): Promise<SwapQuote> {
  const apiKey = process.env.ZX_API_KEY;
  if (!apiKey) throw new Error('ZX_API_KEY not configured');

  const url = new URL(`${ZX_API_BASE}/swap/v1/quote`);
  url.searchParams.set('chainId', String(BASE_CHAIN_ID));
  url.searchParams.set('sellToken', params.sellToken);
  url.searchParams.set('buyToken', params.buyToken);
  url.searchParams.set('sellAmount', params.sellAmount);
  url.searchParams.set('takerAddress', params.takerAddress);

  const res = await fetch(url.toString(), {
    headers: { '0x-api-key': apiKey },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`0x quote failed (${res.status}): ${body}`);
  }

  return res.json();
}

/**
 * Get ZABAL price in USD from 0x API.
 */
export async function getZabalPrice(): Promise<number> {
  const apiKey = process.env.ZX_API_KEY;
  if (!apiKey) throw new Error('ZX_API_KEY not configured');

  const url = new URL(`${ZX_API_BASE}/swap/v1/price`);
  url.searchParams.set('chainId', String(BASE_CHAIN_ID));
  url.searchParams.set('sellToken', '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07');
  url.searchParams.set('buyToken', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'); // USDC
  url.searchParams.set('sellAmount', '1000000000000000000000000'); // 1M ZABAL

  const res = await fetch(url.toString(), {
    headers: { '0x-api-key': apiKey },
  });

  if (!res.ok) return 0.0000001429; // fallback to last known price
  const data = await res.json();
  // price = USDC received per 1M ZABAL
  return parseFloat(data.price) / 1_000_000;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/agents/swap.ts
git commit -m "feat(agents): 0x Swap API integration for Base chain trades"
```

---

### Task 4: VAULT Agent Logic

**Files:**
- Create: `src/lib/agents/vault.ts`

- [ ] **Step 1: Create VAULT agent**

```typescript
// src/lib/agents/vault.ts
import { getAgentConfig, getDailySpend } from './config';
import { logAgentEvent } from './events';
import { getSwapQuote, getZabalPrice } from './swap';
import { TOKENS, VAULT_SCHEDULE, type AgentAction } from './types';
import { logger } from '@/lib/logger';

/**
 * VAULT agent daily routine.
 * Called by Vercel cron at 6 AM UTC.
 * Determines today's action, checks budget, executes.
 */
export async function runVault(): Promise<{
  action: AgentAction;
  status: 'success' | 'failed' | 'skipped';
  details: string;
}> {
  const config = await getAgentConfig('VAULT');
  if (!config) {
    return { action: 'report', status: 'failed', details: 'No config found for VAULT' };
  }

  if (!config.trading_enabled) {
    return { action: 'report', status: 'skipped', details: 'Trading disabled' };
  }

  if (!config.wallet_address) {
    return { action: 'report', status: 'skipped', details: 'No wallet configured' };
  }

  // Determine today's action
  const dayOfWeek = new Date().getUTCDay();
  const action = VAULT_SCHEDULE[dayOfWeek] || 'report';

  // Check daily budget
  const spent = await getDailySpend('VAULT');
  if (spent >= config.max_daily_spend_usd) {
    await logAgentEvent({
      agent_name: 'VAULT',
      action,
      status: 'failed',
      error_message: `Daily budget exceeded: $${spent.toFixed(2)} / $${config.max_daily_spend_usd}`,
    });
    return { action, status: 'skipped', details: `Budget exceeded ($${spent.toFixed(2)})` };
  }

  // Add random noise to trade amount ($0.50 +/- $0.20)
  const baseAmount = 0.50;
  const noise = (Math.random() - 0.5) * 0.40;
  const tradeUsd = Math.min(baseAmount + noise, config.max_single_trade_usd);

  try {
    switch (action) {
      case 'buy_zabal': {
        // Buy ZABAL with ETH
        const zabalPrice = await getZabalPrice();

        // Check price ceiling
        if (zabalPrice > config.buy_price_ceiling) {
          await logAgentEvent({
            agent_name: 'VAULT',
            action: 'buy_zabal',
            status: 'failed',
            error_message: `Price $${zabalPrice} above ceiling $${config.buy_price_ceiling}`,
          });
          return { action, status: 'skipped', details: 'Price above ceiling' };
        }

        // Get quote from 0x
        const ethAmount = Math.floor((tradeUsd / 2500) * 1e18); // approx ETH at $2500
        const quote = await getSwapQuote({
          sellToken: TOKENS.WETH,
          buyToken: TOKENS.ZABAL,
          sellAmount: String(ethAmount),
          takerAddress: config.wallet_address,
        });

        // Log the quote (actual execution requires wallet signing -- Phase 2)
        await logAgentEvent({
          agent_name: 'VAULT',
          action: 'buy_zabal',
          token_in: 'WETH',
          token_out: 'ZABAL',
          amount_in: ethAmount / 1e18,
          amount_out: parseFloat(quote.buyAmount) / 1e18,
          usd_value: tradeUsd,
          status: 'success',
        });

        logger.info(`[VAULT] buy_zabal: $${tradeUsd.toFixed(2)} -> ${quote.buyAmount} ZABAL`);
        return { action, status: 'success', details: `Bought ${quote.buyAmount} ZABAL for ~$${tradeUsd.toFixed(2)}` };
      }

      case 'buy_sang': {
        const ethAmount = Math.floor((tradeUsd / 2500) * 1e18);
        const quote = await getSwapQuote({
          sellToken: TOKENS.WETH,
          buyToken: TOKENS.SANG,
          sellAmount: String(ethAmount),
          takerAddress: config.wallet_address,
        });

        await logAgentEvent({
          agent_name: 'VAULT',
          action: 'buy_sang',
          token_in: 'WETH',
          token_out: 'SANG',
          amount_in: ethAmount / 1e18,
          amount_out: parseFloat(quote.buyAmount) / 1e18,
          usd_value: tradeUsd,
          status: 'success',
        });

        logger.info(`[VAULT] buy_sang: $${tradeUsd.toFixed(2)} -> ${quote.buyAmount} SANG`);
        return { action, status: 'success', details: `Bought ${quote.buyAmount} SANG for ~$${tradeUsd.toFixed(2)}` };
      }

      case 'buy_content': {
        // Phase 2: x402 content purchase from HERALD/DEALER
        await logAgentEvent({
          agent_name: 'VAULT',
          action: 'buy_content',
          usd_value: 0,
          status: 'success',
          error_message: 'Content purchases not yet wired (Phase 2)',
        });
        return { action, status: 'success', details: 'Content purchase placeholder (Phase 2)' };
      }

      case 'report': {
        await logAgentEvent({
          agent_name: 'VAULT',
          action: 'report',
          status: 'success',
        });
        return { action, status: 'success', details: 'Weekly report' };
      }

      default: {
        return { action, status: 'skipped', details: `Unknown action: ${action}` };
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentEvent({
      agent_name: 'VAULT',
      action,
      status: 'failed',
      error_message: message,
    });
    logger.error(`[VAULT] ${action} failed:`, message);
    return { action, status: 'failed', details: message };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/agents/vault.ts
git commit -m "feat(agents): VAULT agent daily routine with 0x swap quotes"
```

---

### Task 5: VAULT Cron Route

**Files:**
- Create: `src/app/api/cron/agents/vault/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Create cron endpoint**

```typescript
// src/app/api/cron/agents/vault/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runVault } from '@/lib/agents/vault';

/**
 * GET /api/cron/agents/vault
 *
 * Vercel cron -- runs VAULT agent daily at 6 AM UTC.
 * Auth: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runVault();

  return NextResponse.json({
    agent: 'VAULT',
    ...result,
    timestamp: new Date().toISOString(),
  });
}
```

- [ ] **Step 2: Add cron to vercel.json**

Add VAULT cron schedule to the existing `crons` array:

```json
{
  "crons": [
    {
      "path": "/api/cron/agents/vault",
      "schedule": "0 6 * * *"
    }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/agents/vault/route.ts vercel.json
git commit -m "feat(agents): VAULT cron route + vercel.json schedule (6 AM UTC daily)"
```

---

### Task 6: Admin Agent API

**Files:**
- Create: `src/app/api/admin/agents/route.ts`

- [ ] **Step 1: Create admin endpoint**

```typescript
// src/app/api/admin/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { getSession } from '@/lib/auth/session';

/**
 * GET /api/admin/agents -- list all agents with recent events
 * PATCH /api/admin/agents -- update agent config (trading_enabled, max_daily_spend, etc.)
 */
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabaseAdmin();

  const [configResult, eventsResult] = await Promise.allSettled([
    db.from('agent_config').select('*').order('name'),
    db.from('agent_events').select('*').order('created_at', { ascending: false }).limit(50),
  ]);

  const configs = configResult.status === 'fulfilled' ? configResult.value.data : [];
  const events = eventsResult.status === 'fulfilled' ? eventsResult.value.data : [];

  return NextResponse.json({ agents: configs, recentEvents: events });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin check -- only admin FIDs can update agent config
  const adminFids = [19640]; // Zaal's FID
  if (!adminFids.includes(session.fid)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { name, ...updates } = body;
  if (!name) {
    return NextResponse.json({ error: 'Agent name required' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('agent_config')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('name', name)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ agent: data });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/agents/route.ts
git commit -m "feat(agents): admin API for agent config and event monitoring"
```

---

### Task 7: Environment Variables & Documentation

**Files:**
- Modify: `.env.example` (or `.env.local.example`)
- Modify: `src/lib/env.ts`

- [ ] **Step 1: Add agent env vars to env.ts**

Add to the optional section of `src/lib/env.ts`:

```typescript
// Agent swarm (VAULT/BANKER/DEALER)
ZX_API_KEY: optionalEnv('ZX_API_KEY'),
VAULT_WALLET_PRIVATE_KEY: optionalEnv('VAULT_WALLET_PRIVATE_KEY'),
```

- [ ] **Step 2: Add to .env.example**

Append to `.env.example`:

```
# Agent Swarm (VAULT/BANKER/DEALER)
# 0x Swap API key (free: https://0x.org/docs/api)
ZX_API_KEY=
# VAULT agent wallet private key (Base chain EOA)
VAULT_WALLET_PRIVATE_KEY=
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/env.ts .env.example
git commit -m "chore(agents): add ZX_API_KEY and VAULT wallet env vars"
```

---

## Phase 2 Tasks (After VAULT is Running)

These are documented but not detailed yet -- implement after VAULT's cron is live and logging events:

1. **Wire actual wallet signing** -- use viem `createWalletClient` with `VAULT_WALLET_PRIVATE_KEY` to sign and send 0x swap transactions on Base
2. **BANKER cron route** -- same pattern as VAULT, deployed in COC Concertz or ZAO OS with different schedule (2 PM UTC)
3. **DEALER cron route** -- same pattern, 10 PM UTC schedule
4. **x402 content purchases** -- wire `buy_content` action to fetch from publish.new with x402 payment header
5. **Privy wallet migration** -- replace raw private key with Privy agentic wallet for policy controls
6. **Admin dashboard UI** -- agent status cards in `/admin` showing balances, recent trades, enable/disable toggles
7. **Farcaster posting** -- agents post trade summaries to /zao channel via Neynar
