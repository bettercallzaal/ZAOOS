# 351 -- ZABAL Agent Swarm Activation Checklist: How It SHOULD Work vs How It COULD Work

> **Status:** Activation guide
> **Date:** April 13, 2026
> **Goal:** Exact remaining steps to go live, what happens when crons fire, what could go wrong, and honest assessment of current code vs ideal behavior

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Run SQL migration NOW** | The `agent_config` and `agent_events` tables DON'T EXIST yet in Supabase. Nothing works until you run `scripts/seed-agent-config.sql`. This is the #1 blocker |
| **Fund wallets with ETH** | YES, Privy wallets need ETH on Base for gas. Even though Base gas is cheap (~$0.001/tx), the wallets start at $0. Send 0.005 ETH (~$12.50) to each wallet. Without ETH, every transaction fails |
| **Enable trading AFTER funding** | Set `trading_enabled = true` in `agent_config` ONLY after wallets are funded. The code checks this flag first -- if false, agent skips silently |
| **Merge PR #156 first** | The staking code is on `ws/zabal-staking-0411`. PR #155 (research) and #156 (staking) need to be merged to main for Vercel to deploy the cron routes |
| **Test locally BEFORE Vercel crons** | Run `npm run dev` and `curl` the cron endpoint manually. Don't wait for the 6 AM UTC cron to find out something's broken |
| **Staking contract is SEPARATE** | The Solidity contract at `contracts/ZabalConviction.sol` does NOT deploy with `next build`. You need to deploy it separately with Foundry or Hardhat to Base. This is a Phase 2 item -- agents can trade without it |

---

## Remaining Steps (Exact Order)

### DONE (you've completed these)

| Step | Status |
|------|--------|
| Privy account created | DONE |
| 3 server wallets created (VAULT/BANKER/DEALER) | DONE |
| Wallet IDs and addresses captured | DONE |
| Env vars added to Vercel (PRIVY_APP_ID, PRIVY_APP_SECRET, wallet IDs, ZX_API_KEY) | DONE |

### TODO (in this order)

| # | Step | Where | Time | Blocker? |
|---|------|-------|------|----------|
| 1 | **Merge PRs #155 and #156** to main | GitHub | 2 min | YES -- cron routes, staking page, agent code not on main yet |
| 2 | **Run SQL migration** in Supabase | Supabase SQL Editor: paste `scripts/seed-agent-config.sql` | 2 min | YES -- `agent_config` table doesn't exist, `getAgentConfig('VAULT')` returns null, agent skips |
| 3 | **Update wallet addresses** in Supabase | SQL Editor | 1 min | YES -- `config.wallet_address` is empty, agent skips |
| 4 | **Fund each wallet** with 0.005 ETH on Base | Send from Coinbase/any wallet to each 0x address | 5 min | YES -- no gas = every Privy tx fails |
| 5 | **Set `trading_enabled = true`** for each agent | SQL Editor | 1 min | YES -- agents check this first |
| 6 | **Add `CRON_SECRET`** to Vercel env vars if not already set | Vercel dashboard | 1 min | YES -- cron auth fails without it |
| 7 | **Test manually** via curl | Terminal | 5 min | NO -- but highly recommended |
| 8 | **Deploy to Vercel** (auto on merge) | Vercel | 3 min | NO -- happens automatically |

### SQL Commands for Steps 2-5

```sql
-- Step 2: Run the full migration (creates tables + seeds 3 agents)
-- Paste the entire contents of scripts/seed-agent-config.sql

-- Step 3: Update wallet addresses
UPDATE agent_config SET wallet_address = '0xbE18081E178Ce6a100D71f626453e0A752851CFF' WHERE name = 'VAULT';
UPDATE agent_config SET wallet_address = '0x130288629B7C6777767c44D259256fC58df0ef5A' WHERE name = 'BANKER';
UPDATE agent_config SET wallet_address = '0xB3426fC23F048fa2EaB16e46b366321D1E6229d5' WHERE name = 'DEALER';

-- Step 5: Enable trading (only after wallets are funded!)
UPDATE agent_config SET trading_enabled = true WHERE name = 'VAULT';
UPDATE agent_config SET trading_enabled = true WHERE name = 'BANKER';
UPDATE agent_config SET trading_enabled = true WHERE name = 'DEALER';
```

### How to Test Manually (Step 7)

```bash
# Start local dev server
npm run dev

# In another terminal, trigger VAULT manually:
curl -s http://localhost:3000/api/cron/agents/vault \
  -H "Authorization: Bearer YOUR_CRON_SECRET" | jq .

# Expected response (if everything is configured):
{
  "agent": "VAULT",
  "action": "buy_zabal",  // depends on day of week
  "status": "success",
  "details": "Bought X ZABAL for ~$0.50",
  "timestamp": "2026-04-13T..."
}

# Expected if SQL not run:
{ "agent": "VAULT", "action": "report", "status": "failed", "details": "No config found for VAULT" }

# Expected if trading_enabled = false:
{ "agent": "VAULT", "action": "report", "status": "skipped", "details": "Trading disabled" }

# Expected if wallet not funded:
{ "agent": "VAULT", "action": "buy_zabal", "status": "failed", "details": "Privy transaction failed: insufficient funds" }
```

---

## What Happens When the First Cron Fires

### VAULT (6 AM UTC daily) -- Step by Step

```
1. Vercel triggers GET /api/cron/agents/vault
2. Auth check: Bearer CRON_SECRET header matches

3. runVault() called:
   a. getAgentConfig('VAULT') → reads from Supabase agent_config table
      - If table doesn't exist → returns null → "No config found" → STOP
      - If exists → returns config object

   b. Check config.trading_enabled
      - If false → "Trading disabled" → STOP
      - If true → continue

   c. Check config.wallet_address
      - If empty → "No wallet configured" → STOP
      - If set → continue

   d. Determine action by day of week:
      Sunday(0)=report, Monday(1)=buy_zabal, Tuesday(2)=buy_sang,
      Wednesday(3)=buy_content, Thursday(4)=buy_zabal,
      Friday(5)=buy_content, Saturday(6)=add_lp

   e. Check daily budget: getDailySpend('VAULT') < $5
      - Sums all successful events today
      - If over budget → STOP

   f. Try maybeAutoStake('VAULT')
      - If no staking contract → skip silently
      - If <14 days since last stake → skip
      - If >=14 days + has 100M ZABAL → approve + stake

   g. Execute today's action (e.g. buy_zabal on Monday):
      i.   getZabalPrice() → 0x API price check
      ii.  Check price < buy_price_ceiling (default $0.001)
      iii. Calculate ETH amount: ($0.30-$0.70 random) / $2500 * 1e18
      iv.  getSwapQuote() → 0x API returns calldata
      v.   executeSwap('VAULT', quote) → Privy signs + sends tx on Base
      vi.  burnZabal('VAULT', buyAmount) → sends 1% to 0x...dEaD
      vii. logAgentEvent() → writes to Supabase agent_events
      viii.postTradeUpdate() → posts to /zao Farcaster channel

4. Return JSON response with result
```

### Today is Sunday (April 13) -- What Would Happen?

```
Day of week: 0 (Sunday)
VAULT_SCHEDULE[0] = 'report'

VAULT would:
1. Load config ✓
2. Check trading_enabled ✓
3. Try auto-stake (skip if no staking contract)
4. Log a 'report' event to agent_events
5. Post "VAULT weekly report" to /zao Farcaster channel
6. Return: { action: 'report', status: 'success', details: 'Weekly report' }

No trades on Sunday. First real trade would be Monday (buy_zabal).
```

---

## What Could Go Wrong

| Failure Mode | Symptom | Cause | Fix |
|-------------|---------|-------|-----|
| **"No config found"** | Agent returns immediately with failed status | `agent_config` table doesn't exist in Supabase | Run `scripts/seed-agent-config.sql` in Supabase SQL Editor |
| **"Trading disabled"** | Agent skips silently | `trading_enabled` is `false` (default) | `UPDATE agent_config SET trading_enabled = true WHERE name = 'VAULT'` |
| **"No wallet configured"** | Agent skips | `wallet_address` is empty string (default) | Update with actual Privy wallet addresses |
| **Privy tx fails** | `executeSwap` throws error | Wallet has 0 ETH on Base (no gas) | Send 0.005 ETH to each Privy wallet address on Base |
| **0x quote fails** | `getSwapQuote` throws 400/403 | Bad API key, or ZABAL has no liquidity path | Verify `ZX_API_KEY` is set; check ZABAL pool on Base |
| **CRON_SECRET missing** | Cron returns 500 | Env var not set in Vercel | Add `CRON_SECRET` to Vercel environment variables |
| **Cron never fires** | No events in agent_events | PR not merged, code not deployed | Merge PRs #155 + #156, check Vercel deployment |
| **RLS blocks writes** | `logAgentEvent` silently fails | Supabase RLS enabled on `agent_events` with no policies | Add RLS policy: `CREATE POLICY "service_role_all" ON agent_events FOR ALL USING (true) WITH CHECK (true)` or use service role key (which bypasses RLS) |
| **Privy API error** | "Invalid app_id" or "Unauthorized" | Wrong `PRIVY_APP_ID` or `PRIVY_APP_SECRET` | Verify in Privy dashboard, re-copy |
| **Burn fails** | burnZabal throws | Wallet has ZABAL to burn but no approval | Non-fatal -- caught in try/catch, trade still succeeds |
| **Farcaster post fails** | postTradeUpdate returns null | `ZAO_OFFICIAL_SIGNER_UUID` not set | Non-fatal -- trade still succeeds, just no Farcaster post |

---

## How It SHOULD Work vs How It COULD Work

### Comparison: Ideal vs Current Reality

| Aspect | SHOULD (ideal) | COULD (current code) | Gap |
|--------|---------------|---------------------|-----|
| **Swap execution** | Agent gets 0x quote, Privy signs in TEE, tx executes on Base, ZABAL appears in wallet | Same -- this is fully wired | NONE -- code is complete |
| **Auto-burn** | 1% of every ZABAL buy sent to 0x...dEaD automatically | Same -- `burnZabal()` called after every `buy_zabal` | NONE -- but burn could fail if wallet has no ZABAL yet (first trade) |
| **Farcaster posting** | Trade summary posted to /zao channel with Blockscout tx link | Uses `autoCastToZao()` which requires `ZAO_OFFICIAL_SIGNER_UUID` | WORKS if signer UUID is set. SILENT FAIL if not -- trade still happens, just no post |
| **Daily budget** | Max $5/day enforced | Checks `agent_events` sum -- relies on events being logged correctly | WORKS but if event logging fails (RLS), budget tracking breaks |
| **Price ceiling** | Don't buy if ZABAL price > $0.001 | `getZabalPrice()` calls 0x, falls back to hardcoded $0.0000001429 if API fails | WORKS but if 0x price API is down, fallback price is always below ceiling (will always buy) |
| **Knowledge graph signals** | Agents read graph signals before schedule | NOT BUILT -- agents use hardcoded day-of-week schedule only | Phase 2 -- `agent_signals` table not created yet |
| **Content purchases (x402)** | Agents buy each other's content on publish.new | PLACEHOLDER -- logs "Content purchases not yet wired (Phase 2)" | Phase 2 -- no x402 integration yet |
| **Auto-stake** | Every 14 days, stake 100M ZABAL | Code exists but requires: staking contract deployed + `NEXT_PUBLIC_ZABAL_STAKING_CONTRACT` set + wallet has 100M ZABAL | Phase 2 -- contract not deployed yet, agents start with $0 ZABAL |
| **Staking UI** | /stake page with one-tap EIP-5792 | Code exists but staking contract not deployed yet | Phase 2 -- set env var after contract deploy |
| **Staking leaderboard** | Staking tab on /respect page | Code exists but no data without deployed contract | Phase 2 -- shows "No stakers yet" |
| **Admin dashboard** | Agent cards with status, trades, toggles | NOT BUILT in current branch -- was on the old worktree | Phase 3 -- need to rebuild |
| **ERC-8004 identity** | Agents discoverable by 45K+ other agents | NOT BUILT in current branch -- was on old worktree | Phase 2 -- recreate identity.ts + register script |

### What Works RIGHT NOW (after activation steps)

1. VAULT/BANKER/DEALER daily crons fire on schedule
2. Agents buy ZABAL and SANG with ETH via 0x + Privy
3. 1% auto-burn on every ZABAL purchase
4. All events logged to Supabase `agent_events` table
5. Trade summaries posted to /zao Farcaster (if signer configured)
6. Daily budget enforcement ($5/day max)
7. Price ceiling check before buying
8. Random noise on trade amounts ($0.30-$0.70)

### What DOESN'T Work Yet

1. Content purchases (x402) -- placeholder only
2. Knowledge graph signals -- hardcoded schedules
3. Staking contract -- not deployed on Base
4. Admin dashboard -- needs rebuild
5. ERC-8004 registration -- needs rebuild
6. Oracle rewards -- not built
7. Bounty board -- not deployed
8. Conviction governance -- not deployed

---

## Recommended Activation Order

```
TODAY:
  1. Merge PRs ← 2 min
  2. Run SQL ← 2 min
  3. Update wallet addresses ← 1 min
  4. Fund wallets (0.005 ETH each) ← 5 min
  5. Enable trading ← 1 min
  6. Test manually with curl ← 5 min
  7. Wait for first cron (Monday 6 AM UTC for VAULT)

TOMORROW (Monday):
  - VAULT fires at 6 AM UTC → buys ZABAL → burns 1% → posts to /zao
  - Check agent_events table for the log entry
  - Check Basescan for the tx hash
  - Check /zao Farcaster channel for the post

TUESDAY:
  - VAULT buys SANG at 6 AM
  - BANKER fires at 2 PM → buys ZABAL
  - Volume starts appearing on DexScreener

NEXT WEEK:
  - Deploy staking contract to Base ($0.50)
  - Set NEXT_PUBLIC_ZABAL_STAKING_CONTRACT env var
  - Staking page goes live
  - Rebuild admin dashboard + ERC-8004 registration
```

---

## ZAO Ecosystem Integration

### Codebase Files Verified

| File | Status | Notes |
|------|--------|-------|
| `src/lib/agents/vault.ts` | READY | Full flow: config → budget → action → swap → burn → log → post |
| `src/lib/agents/banker.ts` | READY | Same pattern, 2 PM UTC schedule |
| `src/lib/agents/dealer.ts` | READY | Same pattern, 10 PM UTC schedule |
| `src/lib/agents/wallet.ts` | READY | Privy TEE signing, no raw keys |
| `src/lib/agents/swap.ts` | READY | 0x Swap API v1 on Base |
| `src/lib/agents/burn.ts` | READY | 1% to 0x...dEaD |
| `src/lib/agents/cast.ts` | READY | Posts via autoCastToZao |
| `src/lib/agents/config.ts` | READY | Reads from Supabase agent_config |
| `src/lib/agents/events.ts` | READY | Writes to Supabase agent_events |
| `src/lib/agents/autostake.ts` | READY | 14-day cycle (needs staking contract) |
| `src/app/api/cron/agents/vault/route.ts` | READY | Bearer auth + runVault |
| `scripts/seed-agent-config.sql` | NEEDS RUN | Tables don't exist yet |
| `vercel.json` | READY | 3 cron schedules configured |
| `src/app/stake/` | READY | Mini App page (needs contract deploy) |
| `src/components/respect/StakingLeaderboard.tsx` | READY | Shows "No stakers" until contract deployed |

---

## Sources

- [Privy Node SDK Docs](https://docs.privy.io/basics/nodeJS/quickstart)
- [0x Swap API v1](https://0x.org/docs/api)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Doc 345 - Master Blueprint](../345-zabal-agent-swarm-master-blueprint/)
- [Doc 343 - Wallet Security](../../security/343-agent-wallet-security-zabal-swarm/)
