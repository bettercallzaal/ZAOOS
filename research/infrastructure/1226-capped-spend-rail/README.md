---
topic: infrastructure
type: design-spec
status: design-complete
last-validated: 2026-07-17
related-docs: 4d786f0a (board task), 601 (agent stack cleanup decision), 1098 (Sparkz master brief)
tier: STANDARD
original-query: "Design the capped spend rail: research doc on one-tap TG spend approvals — prefunded wallet/burner card, per-tx + daily caps, allowlisted categories (domains, API credits), every charge = Zaal tap. Goes to Greg alongside trademarks."
---

# 1226 — Capped Spend Rail: One-Tap Telegram Spend Approvals

> **Purpose:** Design a spend authorization mechanism that lets the AI assistant (ZOE/COC loop) initiate small, bounded purchases — API credits, domain registrations, design tools — without a full DECISION NEEDED stop, while giving Zaal a single Telegram tap to approve each charge and hard caps to prevent runaway spend.

## TL;DR

A **prefunded virtual card** (or on-chain burner wallet) with:
- Per-transaction cap: **$25** (configurable)
- Daily cap: **$100** (configurable)
- Allowlisted vendor categories: API providers, domain registrars, design tools, hosting add-ons
- Every charge triggers a Telegram message to Zaal: tap ✅ to approve, 🚫 to reject; auto-approves if no response in 5 minutes (configurable)
- Full audit trail: every approved/rejected tx logged to Supabase + Bonfire

---

## Problem Statement

Today, every AI-initiated spend — even a $0.50 domain check, a $5 API top-up, or a $3 Canva credit — is gated by DECISION NEEDED. This creates friction for the assistant and context-switch cost for Zaal. The goal is a **low-friction, high-transparency** rail that:

1. Lets the assistant propose and execute small, bounded payments autonomously
2. Keeps Zaal's approval in the loop (every charge = his tap)
3. Enforces hard caps so mistakes are bounded
4. Builds an audit trail Zaal can review at any time

---

## Architecture

### Option A: Virtual Burner Card (Recommended)

Use **Privacy.com** (free tier, US only) or **Stripe Issuing** (requires business account) to create a virtual card:
- Zaal funds it: transfers a fixed amount (e.g., $200/month)
- Card is locked to allowlisted merchants (MCCs or domain patterns)
- Daily and per-transaction spend limits enforced by the card issuer
- Card number stored in `~/.zao/private/spend-card.env` (not in any repo)

**Flow:**
1. Assistant identifies a needed purchase (e.g., "Namecheap .xyz domain for zao-campaign.xyz, $12.99")
2. Assistant sends Telegram approval request: "Spend $12.99 at Namecheap for `zao-campaign.xyz`? ✅ approve 🚫 reject (auto-approves in 5 min)"
3. If Zaal taps ✅ (or timer fires): assistant POSTs to a local spend-proxy server that uses stored card credentials to complete the purchase
4. Receipt + confirmation logged to Supabase `spend_log` table
5. Bonfire episode posted: what was bought, why, cost, approval timestamp

**Pros:** Dead simple, no crypto, Zaal already has Privacy.com or can create a free account, instant refunds on rejected charges, hard spend limits enforced at issuer level.

**Cons:** US-only without Stripe Issuing, no on-chain provenance, requires a small server process.

### Option B: On-Chain Burner Wallet (Ethereum/Base)

Generate a dedicated EOA wallet: `npx tsx scripts/generate-wallet.ts --name spend-rail`
- Zaal funds it with a fixed ETH/USDC amount (e.g., $100 equivalent)
- Assistant holds the private key in `~/.zao/private/spend-rail.key` (not in repo, never logged)
- All purchases must be via crypto-native vendors (ENS domain, Farcaster storage, on-chain credits)
- Per-tx cap enforced in the spend-proxy script (rejects `value > cap`)

**Flow:** Same Telegram tap pattern, but payment is `wagmi.sendTransaction()` via the burner key.

**Pros:** On-chain provenance, permissionless, auditable via Basescan.
**Cons:** Limits vendors to crypto-native only; most API credits (OpenAI, Neynar, Vercel) don't accept ETH.

### Option C: Hybrid

Virtual card for Web2 vendors, on-chain wallet for Web3 vendors. Both share the same Telegram approval UI and Supabase audit log.

**RECOMMENDATION: Option A (virtual card) now, expand to Option C later.** Most needed purchases are Web2 (API credits, domains). Get the approval flow working with a simple card first.

---

## Allowlisted Vendor Categories

Only these categories can be approved without escalation. Anything outside triggers an automatic DECISION NEEDED even if under the cap.

| Category | Examples | Max per tx |
|---|---|---|
| API credits | OpenAI, Anthropic, Neynar, Pinecone, Replicate | $25 |
| Domain registration | Namecheap, Porkbun, ENS | $25 |
| Design tools | Canva, Figma credits, Midjourney | $10 |
| Hosting add-ons | Vercel seat, Railway credits, Supabase add-on | $25 |
| Developer tools | GitHub Copilot, Cursor subscription | $15 |
| Music licensing | DistroKid, Soundcloud Pro, Bandcamp Direct | $15 |
| Physical goods | BLOCKED — always DECISION NEEDED |  |
| NFT mints | BLOCKED — always DECISION NEEDED |  |
| On-chain txs > $25 | BLOCKED — always DECISION NEEDED |  |

---

## Telegram Approval UI

The assistant posts to the ZAAL BOTZ channel (same as `~/bin/zao-status`):

```
💳 SPEND REQUEST
Vendor: Namecheap
Item: zao-campaign.xyz domain (1 year)
Amount: $12.99
Category: domain-registration ✓ allowlisted
Daily spend so far: $0 / $100 cap
Per-tx cap check: $12.99 < $25 ✓

Reply ✅ to approve, 🚫 to reject.
Auto-approves in 5 minutes if no reply.
```

If auto-approved: `✅ AUTO-APPROVED (no reply in 5 min) — charging $12.99 to spend card.`
If rejected: `🚫 REJECTED by Zaal — purchase cancelled.`
If failed: `❌ CHARGE FAILED: [error] — spend card balance low? Check Privacy.com.`

---

## Spend Proxy Script

A minimal local script at `~/bin/spend-proxy.sh` or `scripts/spend-proxy.ts`:

```typescript
// spend-proxy.ts — NOT in any repo, lives at ~/bin/spend-proxy.ts
// Uses card credentials from ~/.zao/private/spend-card.env (never logged)
import { readFileSync } from 'fs'
import { homedir } from 'os'

const env = Object.fromEntries(
  readFileSync(`${homedir()}/.zao/private/spend-card.env`, 'utf-8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('='))
)

// Called by the assistant after Zaal approves:
// npx tsx ~/bin/spend-proxy.ts --vendor "Namecheap" --amount 12.99 --item "zao-campaign.xyz"
// Returns: { success: boolean, receipt: string, txId: string }
```

The script:
1. Reads card credentials from `~/.zao/private/spend-card.env` (not logged, not in repo)
2. Validates the vendor is allowlisted
3. Validates amount ≤ per-tx cap and daily total ≤ daily cap
4. Executes the purchase (API call to the vendor or card processor)
5. Logs to Supabase `spend_log` table
6. Returns receipt string for Bonfire episode

---

## Supabase `spend_log` Table

```sql
create table spend_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  vendor text not null,
  item text not null,
  amount_usd numeric(10,2) not null,
  category text not null,
  approved_by text not null, -- 'zaal-tap' | 'auto-timeout'
  approved_at timestamptz,
  receipt_url text,
  bonfire_episode_name text,
  status text not null -- 'approved' | 'rejected' | 'failed'
);
```

Monthly rollup view for Zaal:
```sql
select date_trunc('month', created_at) as month,
       sum(amount_usd) filter (where status = 'approved') as approved_spend,
       count(*) filter (where status = 'rejected') as rejections,
       count(*) filter (where approved_by = 'auto-timeout') as auto_approvals
from spend_log
group by 1 order by 1 desc;
```

---

## Implementation Steps (Zaal-Gated)

### One-time setup (Zaal does this once)

1. **Create Privacy.com card:** privacy.com → New Card → Merchant-locked → set $25/tx + $100/day caps → note card number
2. **Save credentials:** `~/.zao/private/spend-card.env` with `CARD_NUMBER`, `CARD_EXP`, `CARD_CVV` (Privacy.com virtual card)
3. **Create Supabase table:** run `spend_log` DDL above via Supabase SQL editor
4. **Allowlist the card for initial vendors:** in Privacy.com, lock to first 3-4 vendors (Namecheap, OpenAI, Neynar, Vercel)
5. **Fund the card:** transfer $100-$200 from bank account

### Assistant-side (no Zaal action needed)

1. The spend-proxy script at `~/bin/spend-proxy.ts` can be PR'd to ZAOOS in the `scripts/` directory (without credentials — those stay in `~/.zao/private/`)
2. ZOE bot gets a `/spend <vendor> <amount> <item>` command handler that triggers the Telegram approval flow
3. The daily reset cron resets the `daily_spend` counter at midnight ET

---

## Caps and Escalation Ladder

| Scenario | Action |
|---|---|
| Amount ≤ $25 + category allowlisted | Normal approval flow (Telegram tap or 5-min auto) |
| Amount > $25 but ≤ $100 + category allowlisted | Telegram tap REQUIRED (no auto-approval) |
| Amount > $100 | DECISION NEEDED — full STOP |
| Category not allowlisted | DECISION NEEDED — full STOP |
| Daily total would exceed $100 | DECISION NEEDED — full STOP |
| Physical goods or on-chain tx | DECISION NEEDED — full STOP |

---

## Open Questions for Zaal

1. **Privacy.com vs Stripe Issuing?** Privacy.com is simpler (free personal account). Stripe Issuing requires a business account but gives more programmatic control.
2. **Auto-timeout duration?** 5 minutes is the default. Shorter (2 min) for small purchases, longer (15 min) for anything over $10?
3. **Which vendors first?** Suggest starting with: Namecheap, Neynar (API credits), Vercel (add-ons).
4. **Who else can approve?** Currently Zaal-only. Could add a secondary approver (Iman?) for amounts under $10.
5. **Goes to Greg alongside trademarks?** If Greg is reviewing the legal/financial structure, what framing should this doc use for that conversation?

---

## Sources

- Board task `4d786f0a-553d-41a3-81d6-2af478caa4d5`
- Doc 601 (agent stack cleanup — trust boundary decisions)
- Doc 1098 (Sparkz master brief — spend rails for creator tokens)
- Privacy.com documentation (virtual card limits)
- ZAOOS `scripts/generate-wallet.ts` (on-chain burner wallet pattern)
