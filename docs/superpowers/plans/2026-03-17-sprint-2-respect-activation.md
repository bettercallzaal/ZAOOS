# Sprint 2: Respect Activation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate the Respect token system in ZAO OS — off-chain ledger, tier system, decay, governance weight integration, and tier badges on profiles. This is the keystone feature that unlocks gamification, Hats roles, referrals, and curation rewards.

**Architecture:** Off-chain PostgreSQL ledger synced from on-chain Optimism token balances. New `respect_ledger` and `respect_balances` tables in Supabase. Weekly decay via pg_cron or Edge Function. Tier system displayed across all profile surfaces. Vote weight connected to Respect balance.

**Tech Stack:** Supabase (PostgreSQL), Viem (Optimism RPC reads), existing `src/lib/respect/leaderboard.ts` as foundation.

**Key files to read first:**
- `src/lib/respect/leaderboard.ts` — existing on-chain query logic
- `src/app/(auth)/respect/page.tsx` — existing leaderboard page
- `src/app/(auth)/governance/page.tsx` — vote weight calculation
- `src/components/chat/ProfileDrawer.tsx` — user profile popup
- `src/app/(auth)/tools/ProfileCard.tsx` — profile card with ZID badge
- `research/04-respect-tokens/README.md` — full Respect design spec
- `community.config.ts` — contract addresses

---

## Task 1: Create Respect Database Tables

**Files:**
- Create: `scripts/create-respect-tables.sql`

- [ ] **Step 1: Write the SQL migration**

```sql
-- Off-chain Respect ledger — every earning/spending event
CREATE TABLE IF NOT EXISTS respect_ledger (
  id SERIAL PRIMARY KEY,
  fid BIGINT NOT NULL,
  action TEXT NOT NULL,            -- 'fractal', 'curation', 'peer', 'consistency', 'bonus', 'decay'
  amount DECIMAL NOT NULL,         -- positive = earn, negative = decay/spend
  source_hash TEXT,                -- cast hash or event ID that triggered it
  metadata JSONB DEFAULT '{}',     -- extra context (e.g., fractal rank, track URL)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Current Respect balance with tier (materialized view of ledger)
CREATE TABLE IF NOT EXISTS respect_balances (
  fid BIGINT PRIMARY KEY,
  total_earned DECIMAL DEFAULT 0,
  total_decayed DECIMAL DEFAULT 0,
  current_balance DECIMAL DEFAULT 0,
  tier TEXT DEFAULT 'newcomer' CHECK (tier IN ('newcomer', 'member', 'curator', 'elder', 'legend')),
  onchain_og DECIMAL DEFAULT 0,    -- synced from Optimism OG Respect
  onchain_zor DECIMAL DEFAULT 0,   -- synced from Optimism ZOR
  last_decay_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_respect_ledger_fid ON respect_ledger(fid);
CREATE INDEX IF NOT EXISTS idx_respect_ledger_action ON respect_ledger(action);
CREATE INDEX IF NOT EXISTS idx_respect_ledger_created ON respect_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_respect_balances_tier ON respect_balances(tier);
CREATE INDEX IF NOT EXISTS idx_respect_balances_balance ON respect_balances(current_balance DESC);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_respect_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER respect_balances_updated
  BEFORE UPDATE ON respect_balances
  FOR EACH ROW EXECUTE FUNCTION update_respect_updated_at();

-- RLS
ALTER TABLE respect_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE respect_balances ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Run the migration against Supabase**

```bash
# Copy the SQL and run in Supabase SQL editor, or:
npx supabase db push
```

- [ ] **Step 3: Verify tables exist**

Check Supabase dashboard → Table Editor → confirm `respect_ledger` and `respect_balances` appear.

- [ ] **Step 4: Commit**

```bash
git add scripts/create-respect-tables.sql
git commit -m "feat(respect): create off-chain respect ledger and balances tables"
```

---

## Task 2: Respect Balance API

**Files:**
- Create: `src/lib/respect/balances.ts`
- Create: `src/app/api/respect/balance/route.ts`

- [ ] **Step 1: Create the balance utility module**

Create `src/lib/respect/balances.ts`:

```typescript
import { supabaseAdmin } from '@/lib/db/supabase';

const TIERS = [
  { name: 'legend', min: 10000 },
  { name: 'elder', min: 2000 },
  { name: 'curator', min: 500 },
  { name: 'member', min: 100 },
  { name: 'newcomer', min: 0 },
] as const;

export type RespectTier = typeof TIERS[number]['name'];

export function getTier(balance: number): RespectTier {
  for (const tier of TIERS) {
    if (balance >= tier.min) return tier.name;
  }
  return 'newcomer';
}

export function getNextTier(balance: number): { name: string; required: number; remaining: number } | null {
  const currentIdx = TIERS.findIndex(t => balance >= t.min);
  if (currentIdx <= 0) return null; // already legend
  const next = TIERS[currentIdx - 1];
  return { name: next.name, required: next.min, remaining: next.min - balance };
}

export async function getBalance(fid: number) {
  const { data } = await supabaseAdmin
    .from('respect_balances')
    .select('*')
    .eq('fid', fid)
    .single();
  return data;
}

export async function recordRespect(opts: {
  fid: number;
  action: string;
  amount: number;
  sourceHash?: string;
  metadata?: Record<string, unknown>;
}) {
  // Insert ledger entry
  await supabaseAdmin.from('respect_ledger').insert({
    fid: opts.fid,
    action: opts.action,
    amount: opts.amount,
    source_hash: opts.sourceHash || null,
    metadata: opts.metadata || {},
  });

  // Upsert balance
  const { data: existing } = await supabaseAdmin
    .from('respect_balances')
    .select('current_balance, total_earned')
    .eq('fid', opts.fid)
    .single();

  const newBalance = (existing?.current_balance || 0) + opts.amount;
  const newEarned = opts.amount > 0
    ? (existing?.total_earned || 0) + opts.amount
    : (existing?.total_earned || 0);
  const tier = getTier(newBalance);

  await supabaseAdmin.from('respect_balances').upsert({
    fid: opts.fid,
    current_balance: Math.max(0, newBalance),
    total_earned: newEarned,
    tier,
  }, { onConflict: 'fid' });

  return { balance: Math.max(0, newBalance), tier };
}
```

- [ ] **Step 2: Create the API route**

Create `src/app/api/respect/balance/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getBalance, getNextTier } from '@/lib/respect/balances';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const fidParam = req.nextUrl.searchParams.get('fid');
  const fid = fidParam ? parseInt(fidParam, 10) : session.fid;

  const balance = await getBalance(fid);

  if (!balance) {
    return NextResponse.json({
      fid,
      current_balance: 0,
      total_earned: 0,
      tier: 'newcomer',
      nextTier: { name: 'member', required: 100, remaining: 100 },
    });
  }

  return NextResponse.json({
    ...balance,
    nextTier: getNextTier(balance.current_balance),
  });
}
```

- [ ] **Step 3: Verify API works**

```bash
npm run dev
# curl http://localhost:3000/api/respect/balance
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/respect/balances.ts src/app/api/respect/balance/route.ts
git commit -m "feat(respect): add off-chain balance API with tier calculation"
```

---

## Task 3: On-Chain Sync Job

**Files:**
- Create: `src/lib/respect/sync.ts`
- Create: `src/app/api/respect/sync/route.ts`

- [ ] **Step 1: Create the sync utility**

Create `src/lib/respect/sync.ts` — reads on-chain OG + ZOR balances from Optimism and writes to `respect_balances`:

```typescript
import { supabaseAdmin } from '@/lib/db/supabase';
import { getRespectLeaderboard } from '@/lib/respect/leaderboard';
import { getTier } from '@/lib/respect/balances';

export async function syncOnChainRespect() {
  const leaderboard = await getRespectLeaderboard();

  for (const entry of leaderboard.entries) {
    const onchainTotal = entry.ogBalance + entry.zorBalance;

    await supabaseAdmin.from('respect_balances').upsert({
      fid: entry.fid,
      onchain_og: entry.ogBalance,
      onchain_zor: entry.zorBalance,
      current_balance: onchainTotal,
      total_earned: onchainTotal,
      tier: getTier(onchainTotal),
    }, { onConflict: 'fid' });
  }

  return { synced: leaderboard.entries.length };
}
```

- [ ] **Step 2: Create admin-only sync endpoint**

Create `src/app/api/respect/sync/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { syncOnChainRespect } from '@/lib/respect/sync';

export async function POST() {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await syncOnChainRespect();
  return NextResponse.json({ success: true, ...result });
}
```

- [ ] **Step 3: Test sync**

```bash
npm run dev
# Trigger sync as admin user via API or admin panel
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/respect/sync.ts src/app/api/respect/sync/route.ts
git commit -m "feat(respect): on-chain to off-chain sync for OG + ZOR balances"
```

---

## Task 4: Weekly Decay Mechanism

**Files:**
- Create: `scripts/respect-decay.sql`

- [ ] **Step 1: Write the decay SQL**

Create `scripts/respect-decay.sql`:

```sql
-- Apply 2% weekly decay to all balances
-- Run this weekly via Supabase pg_cron or Edge Function cron
UPDATE respect_balances
SET
  current_balance = GREATEST(0, current_balance * POWER(0.98, EXTRACT(EPOCH FROM (NOW() - last_decay_at)) / 604800)),
  total_decayed = total_decayed + (current_balance - GREATEST(0, current_balance * POWER(0.98, EXTRACT(EPOCH FROM (NOW() - last_decay_at)) / 604800))),
  tier = CASE
    WHEN GREATEST(0, current_balance * POWER(0.98, EXTRACT(EPOCH FROM (NOW() - last_decay_at)) / 604800)) >= 10000 THEN 'legend'
    WHEN GREATEST(0, current_balance * POWER(0.98, EXTRACT(EPOCH FROM (NOW() - last_decay_at)) / 604800)) >= 2000 THEN 'elder'
    WHEN GREATEST(0, current_balance * POWER(0.98, EXTRACT(EPOCH FROM (NOW() - last_decay_at)) / 604800)) >= 500 THEN 'curator'
    WHEN GREATEST(0, current_balance * POWER(0.98, EXTRACT(EPOCH FROM (NOW() - last_decay_at)) / 604800)) >= 100 THEN 'member'
    ELSE 'newcomer'
  END,
  last_decay_at = NOW()
WHERE current_balance > 0;
```

- [ ] **Step 2: Set up Supabase pg_cron (or document Edge Function cron)**

In the Supabase SQL editor, enable pg_cron and schedule:

```sql
SELECT cron.schedule(
  'respect-weekly-decay',
  '0 0 * * 1',  -- Every Monday at midnight UTC
  $$UPDATE respect_balances SET ... $$ -- (full decay SQL here)
);
```

Or create a Supabase Edge Function triggered by cron.

- [ ] **Step 3: Commit**

```bash
git add scripts/respect-decay.sql
git commit -m "feat(respect): weekly 2% decay mechanism via pg_cron"
```

---

## Task 5: Connect Respect to Governance Vote Weight

**Files:**
- Modify: `src/app/api/proposals/vote/route.ts`
- Modify: `src/app/(auth)/governance/page.tsx`

- [ ] **Step 1: Read the current vote route to understand how respect_weight is calculated**

The existing vote route likely queries on-chain Respect balance at vote time. Modify it to also check the off-chain `respect_balances` table and use the higher value (covering both on-chain and off-chain earned Respect).

- [ ] **Step 2: Update vote weight calculation**

In the vote route, after the current on-chain query, also fetch off-chain balance:

```typescript
import { getBalance } from '@/lib/respect/balances';

// Existing on-chain weight
const onchainWeight = ogBalance + zorBalance;

// Off-chain weight
const offchainData = await getBalance(session.fid);
const offchainWeight = offchainData?.current_balance || 0;

// Use the higher of the two (covers both systems during transition)
const respectWeight = Math.max(onchainWeight, offchainWeight);
```

- [ ] **Step 3: Update governance UI to show tier badge**

In the governance page overview section, display the user's tier alongside their Respect weight. Use the same badge styling as ZID:

```tsx
{tier && tier !== 'newcomer' && (
  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tierColors[tier]}`}>
    {tier.charAt(0).toUpperCase() + tier.slice(1)}
  </span>
)}
```

- [ ] **Step 4: Test voting with tier display**

```bash
npm run dev
```

Navigate to governance page. Verify tier badge appears. Create a proposal, vote, verify weight is correct.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/proposals/vote/route.ts src/app/(auth)/governance/page.tsx
git commit -m "feat(respect): connect off-chain balance to governance vote weight + tier badge"
```

---

## Task 6: Display Tier Badges Across UI

**Files:**
- Modify: `src/components/chat/ProfileDrawer.tsx`
- Modify: `src/app/(auth)/tools/ProfileCard.tsx`
- Modify: `src/components/chat/Message.tsx`
- Create: `src/components/shared/TierBadge.tsx`

- [ ] **Step 1: Create a shared TierBadge component**

Create `src/components/shared/TierBadge.tsx`:

```tsx
'use client';

const TIER_COLORS: Record<string, string> = {
  newcomer: 'text-gray-400 bg-gray-400/10',
  member: 'text-blue-400 bg-blue-400/10',
  curator: 'text-purple-400 bg-purple-400/10',
  elder: 'text-yellow-400 bg-yellow-400/10',
  legend: 'text-[#f5a623] bg-[#f5a623]/10',
};

export function TierBadge({ tier }: { tier: string | null }) {
  if (!tier || tier === 'newcomer') return null;
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TIER_COLORS[tier] || TIER_COLORS.newcomer}`}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
}
```

- [ ] **Step 2: Add TierBadge to ProfileDrawer**

In `src/components/chat/ProfileDrawer.tsx`, fetch the user's tier from `/api/respect/balance?fid=X` and display `<TierBadge tier={tier} />` next to the display name (alongside ZID badge).

- [ ] **Step 3: Add TierBadge to ProfileCard**

In `src/app/(auth)/tools/ProfileCard.tsx`, add `<TierBadge />` next to the ZID badge.

- [ ] **Step 4: Add TierBadge to Message component (optional)**

In `src/components/chat/Message.tsx`, show a small tier indicator next to the author name in chat messages for Curator, Elder, and Legend tiers.

- [ ] **Step 5: Test across all surfaces**

```bash
npm run dev
```

Check: ProfileDrawer (click user in chat), ProfileCard (tools page), chat messages.

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/TierBadge.tsx src/components/chat/ProfileDrawer.tsx src/app/(auth)/tools/ProfileCard.tsx src/components/chat/Message.tsx
git commit -m "feat(respect): tier badges displayed across ProfileDrawer, ProfileCard, and chat"
```

---

## Task 7: Update Respect Leaderboard

**Files:**
- Modify: `src/app/(auth)/respect/page.tsx` (or RespectLeaderboard.tsx)

- [ ] **Step 1: Add tier column to leaderboard**

The existing leaderboard shows rank, name, OG/ZOR split, and total. Add a "Tier" column showing the TierBadge component for each user.

- [ ] **Step 2: Add "Next Tier" progress indicator**

For each user in the leaderboard, show a small progress bar or text like "150 to Curator" indicating how much Respect they need for the next tier.

- [ ] **Step 3: Add search/filter**

Add a search input to filter leaderboard by username. Add tier filter buttons (All / Members / Curators / Elders / Legends).

- [ ] **Step 4: Commit**

```bash
git add src/app/(auth)/respect/
git commit -m "feat(respect): leaderboard shows tiers, progress, search, and filtering"
```

---

## Sprint 2 Complete Checklist

- [ ] `respect_ledger` and `respect_balances` tables created in Supabase
- [ ] Balance API returns current balance, tier, and next tier progress
- [ ] On-chain OG + ZOR balances synced to off-chain ledger
- [ ] Weekly 2% decay mechanism scheduled
- [ ] Governance vote weight connected to Respect balance
- [ ] Tier badges visible on ProfileDrawer, ProfileCard, governance, and chat
- [ ] Leaderboard shows tiers, progress bars, search, and filtering
- [ ] All changes committed and pushed

---

## What This Unlocks

With Respect activation complete, the following features become possible:

- **Sprint 3:** Engagement streaks earn bonus Respect. OG Badge for founding 40. Track of the Day awards Respect.
- **Sprint 4:** Respect-weighted community flagging. Curator tier required for moderation queue access.
- **Sprint 5:** Hats Protocol eligibility modules check Respect balance for role assignment.
- **Sprint 6:** AI agent curation scoring awards Respect.
