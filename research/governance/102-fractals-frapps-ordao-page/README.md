# 102 — Fractals Page: frapps, ORDAO, and ZAO Fractal Governance

> **Status:** Research complete — ready to build
> **Date:** 2026-03-21
> **Goal:** Design a dedicated `/fractals` page in ZAO OS integrating frapps.xyz frontend, ORDAO proposal UI, and ZAO's existing fractal session/respect infrastructure

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **frapps embed** | Do NOT iframe frapps.xyz — no embed support. Link out to `zao.frapps.xyz` or build native UI with orclient SDK |
| **Fractalgram** | Fork [Optimystics/fractalgram](https://github.com/Optimystics/fractalgram) (MIT license) for the breakout session UI — build as a Next.js component |
| **ORDAO integration** | Use `orclient` TypeScript SDK from sim31/ordao to read proposals, vote, and submit results directly |
| **Page location** | `/fractals` as top-level nav item — replace or sit alongside `/respect` |
| **Session recording** | Keep existing admin `/api/respect/fractal` endpoint; add user-facing session results submission via orclient |
| **Fibonacci scoring** | Already implemented in `/api/respect/fractal/route.ts` — reuse for on-chain submission too |
| **On-chain data** | Read ZOR balances via multicall (already built in `src/lib/respect/leaderboard.ts`) |

---

## What is frapps?

**frapps** = Fractal Apps — a deployment platform + open-source toolkit for fractal governance.

- **frapps.xyz** hosts fractal apps as subdirectories (e.g., `zao.frapps.xyz`, `of.frapps.xyz`)
- Each app is configured via `frapp.json` — points to a deployed contract + frontend
- **Tech stack:** TypeScript (93.6%), Solidity (5.6%), React frontends, The Graph for on-chain indexing
- **GitHub:** [sim31/frapps](https://github.com/sim31/frapps) — deployment config/scripts
- **GitHub:** [Optimystics/frapps](https://github.com/Optimystics/frapps) — official meta-repo linking all tools

**Key components in the ecosystem:**
1. **Fractalgram** — React web app for running live fractal sessions (peer ranking UI)
2. **ORDAO GUI** — React frontend for proposals/voting (available at `of.frapps.xyz`)
3. **orclient** — TypeScript SDK: reads/writes to OREC and Respect1155 contracts
4. **ornode** — Off-chain API storing proposals and token metadata
5. **ortypes** — Shared TypeScript types

---

## ORDAO Contract Interface (ZAO)

**Deployed on Optimism:**
- OREC: `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`
- Respect1155 (ZOR): `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`
- OG Respect (frozen): `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`

**Key contract functions:**

```typescript
// OREC — proposals
createProposal(to, calldata, memo)  // Create a proposal
vote(proposalId, voteType)          // Vote: For | Against | Abstain
executeProposal(proposalId)         // Execute after timelock passes
getProposal(proposalId)             // Read proposal state

// Respect1155 — token balances
balanceOf(address, tokenId)         // Read ZOR balance (tokenId = 0)
balanceOfBatch(addresses, tokenIds) // Batch read

// Reading with orclient (higher-level)
import { ORClient } from 'orclient';
const client = new ORClient({ provider, contractAddresses });
await client.getProposals()         // List proposals
await client.submitBreakoutResult(sessionId, rankings) // Submit fractal results
await client.getRespectOf(address)  // Get ZOR balance
```

**orclient SDK:**
- Package: `orclient` (from sim31/ordao monorepo)
- Abstracts both on-chain calls (via Viem) and ornode API calls
- Works with wagmi/viem — fits ZAO OS's existing stack perfectly

---

## What's Already Built in ZAO OS

| Feature | Location | Status |
|---------|----------|--------|
| Respect leaderboard (OG + ZOR + fractal) | `/respect` + `RespectLeaderboard.tsx` | ✅ Built |
| Fractal session recording (admin) | `POST /api/respect/fractal` | ✅ Built |
| Fractal score tracking + Fibonacci math | `/api/respect/fractal/route.ts` | ✅ Built |
| Member fractal history | `GET /api/respect/member` | ✅ Built |
| On-chain balance sync (multicall) | `src/lib/respect/leaderboard.ts` | ✅ Built |
| Dedicated `/fractals` page | — | ❌ Missing |
| Fractal session calendar/scheduling | — | ❌ Missing |
| User-facing breakout result submission | — | ❌ Missing |
| ORDAO proposal list + voting UI | — | ❌ Missing |
| ZOR token balance display | Only in leaderboard | ❌ Standalone missing |
| Tier badges (Newcomer/Member/Elder) | — | ❌ Missing |
| zao.frapps.xyz embedded/linked | — | ❌ Missing |

---

## Database Tables (Existing)

| Table | Purpose |
|-------|---------|
| `fractal_sessions` | Session metadata: date, host, scoring era, participant count |
| `fractal_scores` | Per-member per-session: rank (1-6), score (5/8/13/21/34/55) |
| `respect_members` | Aggregate: total_respect, fractal_respect, onchain_og, onchain_zor |
| `respect_events` | Non-fractal events: hosting, festivals, bonuses |

---

## Fibonacci Scoring Reference

| Rank | 1x Era | 2x Era |
|------|--------|--------|
| 1st | 55 | 110 |
| 2nd | 34 | 68 |
| 3rd | 21 | 42 |
| 4th | 13 | 26 |
| 5th | 8 | 16 |
| 6th | 5 | 10 |

**Why Fibonacci:** Weber's Law — each rank earns ~60% more than the next, matching human perception of relative effort/contribution differences.

---

## Fractals Page Design

### Recommended Page Structure: `/fractals`

```
/fractals
├── Hero: "ZAO Fractal Governance"
│   ├── Next fractal call (date/time + join link)
│   └── Quick stats: total sessions, total participants, your fractal score
│
├── Tab 1: Sessions
│   ├── Upcoming sessions (calendar view)
│   ├── Past sessions (accordion: date → participants + rankings)
│   └── Admin: Record new session button
│
├── Tab 2: Leaderboard
│   ├── Fractal leaderboard (fractal_respect ranked)
│   ├── ZOR token balances (on-chain)
│   └── Your position + history
│
├── Tab 3: Proposals (ORDAO)
│   ├── Active proposals (from OREC contract via orclient)
│   ├── Vote For/Against/Abstain buttons (wallet-connected)
│   ├── Proposal history (executed/rejected)
│   └── Create proposal button (min Respect threshold)
│
└── Tab 4: About
    ├── "What is the Respect Game?" explainer
    ├── Fibonacci scoring explained
    ├── Link to zao.frapps.xyz (external)
    └── Link to Optimystics / fractal resources
```

### New Files Needed

```
src/app/(auth)/fractals/
├── page.tsx                    # Main fractals page
├── FractalsHero.tsx            # Next session + quick stats
├── SessionsTab.tsx             # Session calendar + history
├── FractalLeaderboard.tsx      # Fractal-specific leaderboard (reuse RespectLeaderboard logic)
└── ProposalsTab.tsx            # ORDAO proposals via orclient

src/app/api/fractals/
├── sessions/route.ts           # GET: list sessions, POST: create session
└── [sessionId]/route.ts        # GET: session details + scores

src/lib/ordao/
└── client.ts                   # orclient wrapper (read proposals, vote, submit results)
```

### orclient Integration

```typescript
// src/lib/ordao/client.ts
import { ORClient } from 'orclient';
import { publicClient } from '@/lib/viem'; // existing viem client

export const orClient = new ORClient({
  ornode: 'https://ornode.frapps.xyz', // or self-host
  contractAddresses: {
    orec: '0xcB05F9254765CA521F7698e61E0A6CA6456Be532',
    respect: '0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c',
  },
  publicClient,
});

// Usage in API route:
const proposals = await orClient.getProposals({ status: 'active' });
const respectBalance = await orClient.getRespectOf(walletAddress);
```

---

## frapps.xyz Integration Options

| Option | Effort | Result |
|--------|--------|--------|
| **Link out** — "View on zao.frapps.xyz" button | 5 min | External, not integrated |
| **iframe embed** — not supported by frapps | N/A | ❌ Won't work |
| **orclient SDK** — native proposals/voting in ZAO OS | 2-3 days | Full native integration |
| **Fork Fractalgram** — run breakout UI in ZAO OS | 3-5 days | Full session recording inline |

**Recommendation:** Start with orclient (ORDAO proposals) + link to frapps.xyz. Fork Fractalgram as Phase 2.

---

## Implementation Priority

| Priority | Feature | Effort (CC) |
|----------|---------|-------------|
| 1 | `/fractals` page shell + sessions tab | 2 hrs |
| 2 | Session history + upcoming (from existing DB) | 1 hr |
| 3 | Fractal leaderboard tab (reuse existing data) | 1 hr |
| 4 | ORDAO proposals tab via orclient | 3 hrs |
| 5 | Voting UI (wallet-connected, For/Against) | 2 hrs |
| 6 | Link to zao.frapps.xyz prominently | 30 min |
| 7 | Tier badges in leaderboard | 1 hr |
| 8 | Fork Fractalgram for in-app breakout sessions | 1-2 days |

---

## Sources

- [sim31/frapps](https://github.com/sim31/frapps)
- [Optimystics/frapps](https://github.com/Optimystics/frapps)
- [sim31/ordao](https://github.com/sim31/ordao)
- [Optimystics/fractalgram](https://github.com/Optimystics/fractalgram)
- [The Respect Game](https://optimystics.io/introducing-the-respect-game)
- [ORDAO Docs](https://optimystics.io/ordao)
- [Optimism Fractal Council](https://optimismfractal.com/council)
- Research doc 56: ORDAO Respect Governance
- Research doc 58: Respect Deep Dive
