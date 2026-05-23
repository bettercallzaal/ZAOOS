---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-21
superseded-by:
related-docs: 56, 58, 103, 104, 105, 106, 114, 188, 285, 306, 346, 444, 450, 498, 502, 664, 702, 703
original-query: "Design a dedicated `/fractals` page in ZAO OS integrating frapps.xyz frontend, ORDAO proposal UI, and ZAO's existing fractal session/respect infrastructure (reconstructed)"
tier: STANDARD
---

# 102 - Fractals Page: frapps, ORDAO, and ZAO Fractal Governance

> **Goal:** Design a dedicated `/fractals` page in ZAO OS integrating ORDAO on-chain governance UI, Fractalgram session recording, and ZAO's soulbound Respect token infrastructure - with link-out to zao.frapps.xyz for advanced features.

---

## Key Decisions

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| **frapps link (not embed)** | Link out to `zao.frapps.xyz` in hero CTA; do NOT iframe | frapps.xyz has no embed API; external link is cleaner UX and avoids CORS/framing issues |
| **ORDAO on-chain UI** | Build native proposals tab via `@ordao/orclient` SDK v1.4.4 (May 2026 latest) | orclient abstracts both on-chain calls (viem) + ornode API; fits ZAO OS tech stack (wagmi/viem) perfectly |
| **Fractalgram UI** | Fork [Optimystics/fractalgram](https://github.com/Optimystics/fractalgram) (MIT) as Phase 2; start with native session history (Phase 1) | Fractalgram is production-grade Respect Game breakout room UI; forking avoids wheel-reinvention. Phase 1 leverages existing DB tables. |
| **Page routing** | `/fractals` as top-level nav item in community.config.ts | Mirrors `/respect` prominence; Fractal is a first-class ZAO surface (Monday 6pm EST standing call) |
| **Respect token storage** | Keep existing DB schema (`fractal_sessions`, `fractal_scores`, `respect_members`); add on-chain sync via ORDAO | ZOR token lives on-chain (Optimism 0x9885...); DB is source of truth for UX, ORDAO executes proposals |
| **Fibonacci scoring** | Reuse existing `/api/respect/fractal/route.ts` logic for both UI display + on-chain submission | Single source of truth prevents drift between DB rankings and on-chain token distribution |

---

## Architecture Overview: frapps + ORDAO + Fractalgram

### frapps Ecosystem

**frapps.xyz** = modular fractal governance deployment platform. Each fractal community gets a subdomain configured via `frapp.json` (e.g., `zao.frapps.xyz`, `eden-fractal.frapps.xyz`, `of.frapps.xyz` for Optimism Fractal). Primary repos: [Optimystics/frapps](https://github.com/Optimystics/frapps) (toolkit), [sim31/frapps](https://github.com/sim31/frapps) (deployment config).

| Component | Purpose | Status (May 2026) |
|-----------|---------|------------------|
| **Fractalgram** | Live Respect Game breakout room UI (web client) | Production, [Optimystics/fractalgram](https://github.com/Optimystics/fractalgram), MIT license |
| **ORDAO** | Smart contracts for proposal voting + execution | Production on OP Mainnet + Base, 300+ proposals executed (Optimism Fractal Season 1-5) |
| **orclient** | TypeScript SDK abstracting OREC + Respect1155 + ornode | v1.4.4, published 2026-04-02 (npm registry) |
| **ornode** | Off-chain proposal storage + metadata API | Deployed, endpoints at ornode.frapps.xyz |
| **ortypes** | Shared TypeScript types across tools | Part of ordao monorepo |

### ZAO Contract Addresses (Optimism Superchain)

| Contract | Address | Token Type | Notes |
|----------|---------|-----------|-------|
| **OREC** (Optimism) | `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` | Executable proposal contract | Live, tested by Optimism Fractal (60+ events) |
| **ZOR** (Respect1155) | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | Soulbound ERC-1155 (tokenId=0) | Non-transferable; earned via Respect Game |
| **OG Respect** | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | ERC-20 (frozen) | Epoch 1 token; migration UI at eden-fractal.frapps.xyz |
| **Hats Protocol** | 0x3bc1A0Ad72417f2d411118085256fC53CBdDd137 (OP) | Role registry | ZAO treeId 226 |

### orclient SDK v1.4.4

**Latest Release:** April 2, 2026. Published to npm as `@ordao/orclient`.

**Core Methods:**
```typescript
import { ORClient } from '@ordao/orclient';

// Read proposals from ornode
const client = new ORClient({ ornode: 'https://ornode.frapps.xyz', provider, contractAddresses });
const proposals = await client.getProposals({ status: 'active' });

// Vote on proposal
await client.vote(proposalId, 'For', respectTokenBalance);

// Submit fractal results onchain
await client.submitBreakoutResult(sessionId, rankings);

// Read ZOR balance
const balance = await client.getRespectOf(walletAddress);
```

**Integration Notes:**
- Abstracts both viem calls (on-chain) + ornode HTTP calls (off-chain data)
- Soulbound token means votes are non-transferable - each address = one voter
- Compatible with ZAO OS stack: wagmi, viem, Next.js 16, React 19

---

## ZAO OS Implementation Status (Verified 2026-05-21)

### Already Built

| Feature | File Path | Status |
|---------|-----------|--------|
| Fractal session recording (admin) | `src/app/api/fractals/sessions/route.ts` | ✅ Live |
| Fractal analytics endpoint | `src/app/api/fractals/analytics/route.ts` | ✅ Live |
| Member fractal history + leaderboard | `src/app/api/fractals/member/[wallet]/route.ts` + `src/app/api/respect/member/route.ts` | ✅ Live |
| On-chain Respect sync (multicall) | `src/lib/respect/leaderboard.ts` | ✅ Live |
| Respect member aggregate table | `respect_members` (Supabase) | ✅ 40 ZAO members tracked |
| ZAO Fractal standing call | Discord/Telegram (Monday 6pm EST) | ✅ 90+ weeks running |
| Hats Protocol integration (treeId 226) | `community.config.ts` line 125 | ✅ Integrated |

### Missing (Needed for `/fractals` Page)

| Feature | Priority | Est. Effort |
|---------|----------|-------------|
| Dedicated `/fractals` page shell | P1 | 2 hrs |
| Session calendar + past events view | P1 | 1 hr |
| ORDAO proposals tab (native orclient integration) | P1 | 3 hrs |
| Proposal voting UI (For/Against/Abstain) | P2 | 2 hrs |
| Tier badges (Newcomer/Member/Elder based on Respect) | P2 | 1 hr |
| zao.frapps.xyz CTA link | P1 | 30 min |
| Fractalgram fork for in-app session recording | P3 (Phase 2) | 1-2 days |

### Database Schema (Existing)

| Table | Columns | Purpose |
|-------|---------|---------|
| `fractal_sessions` | id, date, host, scoring_era, participant_count, status | Session metadata |
| `fractal_scores` | session_id, member_address, rank (1-6), fibonacci_score | Per-session ranking |
| `respect_members` | address, total_respect, fractal_respect, onchain_og, onchain_zor, tier | Aggregate per member |

### Fibonacci Scoring Reference

| Rank | Standard (1x) | Double (2x) | Multiplier |
|------|---------------|------------|-----------|
| 1st | 55 | 110 | 1.618x from 2nd |
| 2nd | 34 | 68 | 1.625x from 3rd |
| 3rd | 21 | 42 | 1.615x from 4th |
| 4th | 13 | 26 | 1.625x from 5th |
| 5th | 8 | 16 | 1.6x from 6th |
| 6th | 5 | 10 | - |

**Why Fibonacci:** Weber's Law - each rank earns approximately 60% more than the next, matching human perception of relative contribution quality. ZAO uses 1x baseline, 2x during special seasons (e.g., ZAOstock prep).

---

## `/fractals` Page Design (Phase 1 + Phase 2 Roadmap)

### Phase 1: MVP (Ready This Sprint)

```
/fractals
├── Hero: "ZAO Fractal Governance"
│   ├── Next call: Monday 6pm EST (Telegram/Discord link)
│   ├── Quick stats: 40 members, 90+ sessions, your score
│   └── CTA: "Play Respect Game" + "View on frapps.xyz"
│
├── Tab 1: Sessions (from fractal_sessions + fractal_scores)
│   ├── Upcoming (if any; typically ad-hoc)
│   ├── Past 20 sessions (accordion: date/host/rankings)
│   └── Admin button (Zaal + core team only)
│
├── Tab 2: Leaderboard
│   ├── Fractal respect ranked (from respect_members.fractal_respect)
│   ├── Tier badges (Newcomer <55, Member 55-300, Elder 300+)
│   └── On-chain ZOR balance (next to name)
│
├── Tab 3: Proposals (ORDAO)
│   ├── Active proposals (via orclient.getProposals)
│   ├── Vote buttons (For/Against/Abstain) for wallet-connected members
│   ├── Proposal history (executed/rejected, pagination)
│   └── Create proposal (Zaal + Council only)
│
└── Tab 4: Resources
    ├── "The Respect Game" (what + why + how to play)
    ├── Fibonacci scoring table (above)
    ├── ORDAO docs link (optimystics.io/ordao)
    ├── Eden Fractal reference (edenfractal.com)
    └── CTA: "View full Respect Game on frapps.xyz"
```

### Phase 2: Enhanced (Post-MVP)

- Fork Fractalgram for in-app breakout room UI (ZAO-branded)
- Real-time session recording (instead of admin form)
- Integration with Hats Protocol treeId 226 for role-based visibility
- Cross-chain Respect viewing (if ZAO eventually deploys to Base)

### Code Files to Create

```
src/app/(auth)/fractals/
├── page.tsx                         # Main page + tab router
├── FractalsHero.tsx                 # Next call + stats
├── SessionsTab.tsx                  # List + accordion
├── LeaderboardTab.tsx               # Ranked + badges + ZOR balance
├── ProposalsTab.tsx                 # ORDAO proposals via orclient
└── ResourcesTab.tsx                 # Help + links

src/app/api/fractals/
├── leaderboard/route.ts (PATCH)     # Admin: add tier badges
└── (existing routes verified)

src/lib/ordao/
└── client.ts                        # orclient wrapper + cache layer
```

### orclient Integration Pattern

```typescript
// src/lib/ordao/client.ts
import { ORClient } from '@ordao/orclient';
import { publicClient, walletClient } from '@/lib/viem';

export const ordaoClient = new ORClient({
  ornode: 'https://ornode.frapps.xyz',
  contractAddresses: {
    orec: '0xcB05F9254765CA521F7698e61E0A6CA6456Be532',
    respect1155: '0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c',
  },
  publicClient,
  walletClient,
});

// Usage example in API route
export async function GET(req: Request) {
  const proposals = await ordaoClient.getProposals({ status: 'active' });
  return NextResponse.json(proposals);
}
```

---

## Integration with ORDAO Ecosystem

### Tripartite Governance Model (per Optimism Fractal precedent)

| Branch | ZAO Role | Mechanism | Status |
|--------|----------|-----------|--------|
| **Judiciary** | All members | Respect Game (biweekly) | ACTIVE (Monday 6pm EST) |
| **Legislative** | Council model (from Optimism Fractal precedent) | Hats Protocol treeId 226 | NOT YET FORMED |
| **Executive** | Automated | ORDAO (OREC contract on Optimism) | ACTIVELY USED (weekly Respect distribution) |

**Current State (May 2026):** ZAO uses OREC for weekly Respect Game consensus - ZOR ERC-1155 tokens are minted weekly through OREC execution. ZAO's ZOR Respect token (fractals 74 onward, deployed Sept 11 2025) is distributed via OREC based on weekly breakout session results. Legislative council branch model adopted from Optimism Fractal precedent; not yet formed at ZAO.

### Comparison: Optimism Fractal (Paused Jan 2026) vs. ZAO (Active May 2026)

| Metric | Optimism Fractal | ZAO Fractal | Notes |
|--------|------------------|------------|-------|
| **Status** | Paused indefinitely (consolidating into Eden) | ACTIVE | ZAO continues weekly governance |
| **Chain** | OP Mainnet (paused) | Optimism Superchain | Both use ORDAO on OP Mainnet |
| **ORDAO adoption** | Season 5 (Nov 2024); 60+ proposals executed | Weekly (since Sept 2025) | ZAO uses OREC for Respect distribution, not general-purpose governance proposals |
| **Scale** | 65 Respect holders | 40 members; ~90 sessions | ZAO can scale with same ORDAO pattern |
| **Community focus** | Public goods funding (Optimism ecosystem) | Music + creator economy | Both use Respect Game + fractal structure |

**Key insight:** ZAO's ORDAO integration focuses on Respect consensus automation (weekly token mints). General-purpose governance proposals (budgets, membership) remain for future adoption on top of this foundation.

---

## Findings: Updates Since March 2026

- **orclient SDK now v1.4.4** (was v1.0.15 in March; v1.4.4 published April 2, 2026). Improved wallet integration + error handling.
- **Optimism Fractal paused Jan 2026** (confirmed 2026-05-21). Consolidation into Eden Fractal complete. ZAO now the sole active Optimism-based fractal.
- **ORDAO on both OP Mainnet + Base** (May 2026). Eden Fractal Epoch 2 deployed ORDAO to Base; Optimism Fractal + ZAO on OP Mainnet. Both chains supported by orclient.
- **ZAO actively uses OREC for weekly Respect distribution** (since Sept 2025). ZOR token mints weekly through OREC execution. Hats Protocol treeId 226 integrated in community.config.ts.
- **Fractalgram UI production-grade** (MIT license, actively maintained by Optimystics). Forking is safe + recommended for Phase 2.

---

## Also See

Related docs in fractal governance campaign: 56, 58, 103, 104, 105, 106, 109, 114, 115, 188, 285, 306, 346, 444, 450, 498, 502, 664, 702, 703.

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Create `/fractals` page shell + tab router | Frontend | Build | This sprint |
| Integrate orclient for proposal read/vote | Frontend | Build | This sprint + 1 |
| Link zao.frapps.xyz prominently in hero | UX | Copy | This sprint |
| Test first ORDAO proposal (small: e.g. event budget) | Zaal | Process | After `/fractals` live |
| Plan Fractalgram fork (Phase 2) | Zaal + Tech | Plan | Deferred (post-MVP) |

---

## Sources

- [ORDAO GitHub (Optimystics/ordao)](https://github.com/Optimystics/ordao) - [FULL] Monorepo with orclient, contracts, docs
- [Optimystics/frapps](https://github.com/Optimystics/frapps) - [FULL] Fractal apps toolkit (MIT)
- [Optimystics/fractalgram](https://github.com/Optimystics/fractalgram) - [FULL] Live session UI (MIT, production)
- [optimystics.io/ordao](https://optimystics.io/ordao) - [FULL] ORDAO docs + feature overview
- [optimismfractal.com](https://optimismfractal.com/) - [FULL] Paused status confirmed (Jan 2026) + ORDAO case study
- [OF 57: Regenerative Governance (Optimism Fractal YouTube)](https://optimismfractal.com/57) - [FULL] ZAO mentioned; Feb 2025 event showing integration patterns
- [ZAO Whitepaper Draft 3 (HackMD)](https://hackmd.io/@bB0dXoPfSAuUEqyo43pHZw/H1edVWM7eg) - [FULL] ZAO governance vision including ORDAO + Hats
- [Community.config.ts (ZAOOS codebase)](file:///Users/zaalpanthaki/Documents/worktrees/research-fractal-campaign/community.config.ts) - [FULL] Contract addresses + treeId 226 verified 2026-05-21
- npm [@ordao/orclient](https://www.npmjs.com/package/@ordao/orclient) - [FULL] npm registry API confirms latest v1.4.4 (published 2026-04-02, 30 versions total)
