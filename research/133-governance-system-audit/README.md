# 133 — Governance System: Complete Audit

> **Status:** Research complete
> **Date:** March 25, 2026
> **Goal:** Catalog every governance feature built in ZAO OS, verified against actual codebase, then map the future roadmap
> **Builds on:** Doc 131 (On-Chain Governance), Doc 132 (Snapshot Weekly Polls), Doc 56 (ORDAO Respect System)

---

## Summary Stats

| Metric | Count |
|--------|-------|
| **API Routes** | 5 files across `proposals/`, `zounz/`, `snapshot/` |
| **Components** | 6 (`ProposalsTab`, `ProposalComments`, `SnapshotPolls`, `CreateWeeklyPoll`, `ZounzProposals`, `ZounzAuction`) |
| **Lib utilities** | 2 (`zounz/contracts.ts`, `snapshot/client.ts`) |
| **Database tables** | 3 (`proposals`, `proposal_votes`, `proposal_comments`) |
| **Test files** | 4 (`proposals-route.test.ts`, `vote-route.test.ts`, `comment-route.test.ts`, `schemas.test.ts`) |
| **Governance tiers** | 3 (Community Proposals, ZOUNZ On-Chain, Snapshot Polls) |

---

## Architecture Diagram

```
+------------------------------------------------------------------+
|                     ZAO OS Governance System                      |
+------------------------------------------------------------------+
|                                                                    |
|  Tier 1: ZOUNZ On-Chain (Nouns Builder on Base)                   |
|  +---------------------------------------------------------+      |
|  | Governor Contract: 0x9d98...17f                          |      |
|  | Token: 0xCB80...883  |  Auction: 0xb2d4...bfb           |      |
|  | Treasury: 0x2bb5...3f                                    |      |
|  | NFT holders vote on-chain -> trustless execution          |      |
|  | UI: ZounzProposals.tsx + ZounzAuction.tsx                 |      |
|  | API: /api/zounz/proposals (reads proposalCount, quorum)   |      |
|  | Links to nouns.build for full proposal lifecycle          |      |
|  +---------------------------------------------------------+      |
|                                                                    |
|  Tier 2: Snapshot Weekly Polls (Gasless)                          |
|  +---------------------------------------------------------+      |
|  | Space: community.config.ts -> snapshot.space              |      |
|  | SDK: @snapshot-labs/snapshot.js (Client712)                |      |
|  | Voting type: Approval (multi-select)                      |      |
|  | Period: 7 days (Monday to Monday)                         |      |
|  | Admin one-click creation via CreateWeeklyPoll.tsx          |      |
|  | Display: SnapshotPolls.tsx (bar charts, expand/collapse)   |      |
|  | API: /api/snapshot/polls (GraphQL proxy, 60s cache)        |      |
|  | Server lib: snapshot/client.ts (fetchActive, fetchRecent)  |      |
|  +---------------------------------------------------------+      |
|                                                                    |
|  Tier 3: Community Proposals (Supabase + Cross-Platform Publish)  |
|  +---------------------------------------------------------+      |
|  | DB: proposals, proposal_votes, proposal_comments          |      |
|  | Vote weight: on-chain OG Respect + ZOR Respect (Optimism) |      |
|  | Threshold: configurable (default 1000R)                   |      |
|  | Period: 7-day default, deferred publish until deadline     |      |
|  | Auto-publish: Farcaster + Bluesky + X at threshold         |      |
|  | Categories: governance, technical, community, wavewarz,    |      |
|  |             social, treasury                               |      |
|  | Status flow: open -> approved/rejected/published/completed |      |
|  | UI: ProposalsTab.tsx (filter by status/category)           |      |
|  | Comments: ProposalComments.tsx (threaded, real-time)        |      |
|  | Notifications: in-app + Mini App push on new proposal/vote |      |
|  | Admin: status transitions, audit logging                   |      |
|  +---------------------------------------------------------+      |
|                                                                    |
+------------------------------------------------------------------+
```

---

## Part 1: Community Proposals (Supabase)

### 1.1 API Routes

| Endpoint | Method | File | Auth | Description |
|----------|--------|------|------|-------------|
| `/api/proposals` | GET | `src/app/api/proposals/route.ts` | Session | List proposals with vote tallies, filter by status/category, pagination |
| `/api/proposals` | POST | `src/app/api/proposals/route.ts` | Session | Create proposal (Zod-validated: title, description, category, closes_at, publish_text, publish_image_url, respect_threshold) |
| `/api/proposals` | PATCH | `src/app/api/proposals/route.ts` | Admin | Update proposal status with valid transition enforcement |
| `/api/proposals/vote` | POST | `src/app/api/proposals/vote/route.ts` | Session | Vote (for/against/abstain), Respect-weighted via on-chain balance lookup |
| `/api/proposals/comment` | GET | `src/app/api/proposals/comment/route.ts` | Session | Get comments for a proposal |
| `/api/proposals/comment` | POST | `src/app/api/proposals/comment/route.ts` | Session | Add comment (Zod-validated) |
| `/api/proposals/test-publish` | GET | `src/app/api/proposals/test-publish/route.ts` | Admin | Debug endpoint for publish threshold testing |

### 1.2 Vote Weighting

Votes are weighted by on-chain Respect balance, read at vote time via Viem `multicall`:

- **OG Respect** (`0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`) — ERC-20 on Optimism, `balanceOf(address)`, formatted from wei
- **ZOR Respect** (`0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`) — ERC-1155 on Optimism, `balanceOf(address, 0)`, raw integer
- **Weight** = `Math.round(og + zor)`
- Zero-weight votes are allowed but get a warning message

### 1.3 Auto-Publishing Flow

When a "for" vote is cast, `checkPublishThreshold()` runs:

1. Skip if already published (`published_cast_hash` set)
2. Skip if voting deadline hasn't passed yet (deferred publishing)
3. Sum Respect-weighted "for" votes
4. If `totalRespectFor >= threshold` (default 1000):
   - Publish to Farcaster via Neynar (`postCast`) to `/zao` or `/wavewarz` channel based on category
   - Publish to Bluesky via `@atproto/api` (`postToBluesky`)
   - Publish to X/Twitter via `twitter-api-v2` (`publishToX`)
   - Update proposal status to `published` with all platform results and errors
5. On GET, `checkExpiredProposalsForPublish()` auto-approves proposals where deadline passed + threshold met

### 1.4 Status Transitions

Valid transitions are enforced server-side:

```
open -> approved, rejected, completed
approved -> completed, open
rejected -> open
completed -> open
published -> completed, open
```

### 1.5 Categories

| Category | Color | Description |
|----------|-------|-------------|
| `governance` | Gold | DAO structure, voting rules, role changes |
| `technical` | Blue | Code, infrastructure, integrations |
| `community` | Purple | Events, partnerships, culture |
| `wavewarz` | Emerald | WaveWarZ integration, music battles |
| `social` | Pink | Social features, cross-posting |
| `treasury` | Green | Budget, spending, revenue |

### 1.6 Notifications

- **New proposal** — all active members get in-app + Mini App push notification
- **Vote on proposal** — proposal author gets in-app notification
- **Comment on proposal** — proposal author gets in-app notification

### 1.7 Database Schema

**`proposals`** table:
- `id` (uuid), `title`, `description`, `status`, `category`
- `author_id` (FK to users), `closes_at` (timestamptz, optional)
- `publish_text`, `publish_image_url` (custom cross-platform publish content)
- `published_cast_hash`, `published_bluesky_uri`, `published_x_url`
- `publish_fc_error`, `publish_bsky_error`, `publish_x_error`
- `respect_threshold` (default 1000), `published_at`
- `created_at`, `updated_at`

**`proposal_votes`** table:
- `id`, `proposal_id` (FK), `voter_id` (FK to users)
- `vote` (enum: for/against/abstain), `respect_weight` (integer)
- Unique constraint on `(proposal_id, voter_id)` — upsert allows changing vote

**`proposal_comments`** table:
- `id`, `proposal_id` (FK), `author_id` (FK to users)
- `body` (text), `created_at`

### 1.8 UI Components

| Component | File | Features |
|-----------|------|----------|
| **ProposalsTab** | `src/app/(auth)/fractals/ProposalsTab.tsx` | Full proposal list with filters (status, category), create form, vote buttons, Respect progress bar, status badges, admin controls, publish status display |
| **ProposalComments** | `src/components/governance/ProposalComments.tsx` | Threaded comments with author avatars, time-ago, keyboard submit, lazy-loaded via `next/dynamic` |

### 1.9 Tests

| Test File | Coverage |
|-----------|----------|
| `proposals-route.test.ts` | GET (list, filter), POST (create, validation), PATCH (admin status) |
| `vote-route.test.ts` | Vote submission, Respect weight, duplicate vote handling |
| `comment-route.test.ts` | GET comments, POST comment, validation |
| `schemas.test.ts` | Zod schema validation for all proposal inputs |

---

## Part 2: ZOUNZ On-Chain Governance (Nouns Builder)

### 2.1 Contracts on Base

| Contract | Address | ABI Functions |
|----------|---------|---------------|
| **Token** | `0xCB80Ef04DA68667c9a4450013BDD69269842c883` | `auction()`, `tokenURI()`, `totalSupply()`, `ownerOf()`, `name()`, `contractURI()` |
| **Auction** | `0xb2d43035c1d8b84bc816a5044335340dbf214bfb` | `auction()`, `createBid()`, `settleCurrentAndCreateNewAuction()`, `minBidIncrement()`, `reservePrice()`, `duration()`, `paused()` |
| **Governor** | `0x9d98ec4ba9f10c942932cbde7747a3448e56817f` | `proposalCount()`, `state()`, `getVotes()`, `proposalThreshold()`, `quorum()`, `proposalVotes()`, `proposals()`, `castVote()`, `propose()` |
| **Treasury** | `0x2bb5fd99f870a38644deafe7e4ecb62ac77a213f` | (used by Governor for execution) |

### 2.2 API Route

| Endpoint | Method | File | Description |
|----------|--------|------|-------------|
| `/api/zounz/proposals` | GET | `src/app/api/zounz/proposals/route.ts` | Reads `proposalCount`, `proposalThreshold`, `quorum` from Governor via `Promise.allSettled`. Returns governance stats + nouns.build URLs. |

### 2.3 UI Components

| Component | File | Features |
|-----------|------|----------|
| **ZounzProposals** | `src/components/zounz/ZounzProposals.tsx` | Stats grid (proposal count, quorum, user voting power via `useReadContract`), wallet connection prompt, links to nouns.build for full proposal lifecycle |
| **ZounzAuction** | `src/components/zounz/ZounzAuction.tsx` | Live auction display (current token, highest bid, time remaining), bid placement via `useWriteContract`, token metadata rendering, share to Farcaster |

### 2.4 Architecture Notes

- All contract reads use Viem `createPublicClient` with Base RPC
- Voting power is read client-side via `useReadContract` (wagmi hook)
- Full proposal creation/voting happens on nouns.build (not in-app) -- ZAO OS provides a read-only dashboard with external links
- The Governor supports `propose()`, `castVote()`, and `state()` but these are not wired up in-app yet

---

## Part 3: Snapshot Weekly Polls

### 3.1 Server Library

**File:** `src/lib/snapshot/client.ts`

| Function | Description |
|----------|-------------|
| `fetchActivePolls()` | GraphQL query for active proposals in ZAO space (first 10, desc by created) |
| `fetchRecentPolls(limit)` | GraphQL query for all proposals (default 20, any state) |
| `fetchPollResults(id)` | Single proposal detail query |

- Uses `communityConfig.snapshot.graphqlUrl` and `communityConfig.snapshot.space`
- Server-side `fetch` with `next: { revalidate: 60 }` (60-second ISR cache)

### 3.2 API Route

| Endpoint | Method | File | Auth | Description |
|----------|--------|------|------|-------------|
| `/api/snapshot/polls` | GET | `src/app/api/snapshot/polls/route.ts` | None | Public endpoint, returns active + recent polls via `Promise.allSettled` |

### 3.3 UI Components

| Component | File | Features |
|-----------|------|----------|
| **SnapshotPolls** | `src/components/governance/SnapshotPolls.tsx` | Active/recent poll display, expandable cards, score bar charts (sorted by score desc), vote count, state badges (Active/Pending/Closed), link to Snapshot for voting |
| **CreateWeeklyPoll** | `src/components/governance/CreateWeeklyPoll.tsx` | Admin-only one-click poll creation. Pre-fills title ("ZAO Weekly Priority Vote -- Week of [date]"), body, 10 workstream choices from `communityConfig.snapshot.weeklyPollChoices`. Two creation paths: (1) wallet-connected direct creation via `Client712.proposal()` with viem-to-ethers signer shim, (2) copy JSON + open Snapshot web UI. Editable title/body/choices preview. Approval voting type, 7-day period (Monday to Monday). |

### 3.4 SDK Integration

- **Package:** `@snapshot-labs/snapshot.js`
- **Client:** `Client712` (EIP-712 typed data signing)
- **Signer shim:** Adapts viem `walletClient` to ethers-like signer via `_signTypedData` mapping
- **Snapshot block:** Read via `eth_blockNumber` from connected wallet
- **App identifier:** `zao-os`

---

## Part 4: Governance Tab Integration

All three tiers are integrated into the **ProposalsTab** component at `src/app/(auth)/fractals/ProposalsTab.tsx`:

- **ZOUNZ On-Chain** section (top) — dynamically loaded `ZounzProposals`
- **Snapshot Polls** section — dynamically loaded `SnapshotPolls` + admin `CreateWeeklyPoll`
- **Community Proposals** section — full CRUD with filters, voting, comments

All heavy components use `next/dynamic` with `{ ssr: false }` for code splitting.

---

## Part 5: File Inventory

### API Routes (5 files)

| File | Lines |
|------|-------|
| `src/app/api/proposals/route.ts` | 316 |
| `src/app/api/proposals/vote/route.ts` | 371 |
| `src/app/api/proposals/comment/route.ts` | 112 |
| `src/app/api/proposals/test-publish/route.ts` | ~60 |
| `src/app/api/zounz/proposals/route.ts` | 57 |
| `src/app/api/snapshot/polls/route.ts` | 28 |

### Components (6 files)

| File | Type |
|------|------|
| `src/app/(auth)/fractals/ProposalsTab.tsx` | Page-level tab with all 3 tiers |
| `src/components/governance/ProposalComments.tsx` | Threaded comment system |
| `src/components/governance/SnapshotPolls.tsx` | Snapshot poll display with bar charts |
| `src/components/governance/CreateWeeklyPoll.tsx` | Admin poll creator |
| `src/components/zounz/ZounzProposals.tsx` | On-chain governance dashboard |
| `src/components/zounz/ZounzAuction.tsx` | Live NFT auction with bidding |

### Libraries (2 files)

| File | Purpose |
|------|---------|
| `src/lib/zounz/contracts.ts` | Contract addresses + parsed ABIs for Token, Auction, Governor, Treasury on Base |
| `src/lib/snapshot/client.ts` | GraphQL client for Snapshot reads (server-side, 60s cache) |

### Tests (4 files)

| File | Purpose |
|------|---------|
| `src/app/api/proposals/__tests__/proposals-route.test.ts` | Proposal CRUD tests |
| `src/app/api/proposals/__tests__/vote-route.test.ts` | Vote submission + weight tests |
| `src/app/api/proposals/__tests__/comment-route.test.ts` | Comment CRUD tests |
| `src/app/api/proposals/__tests__/schemas.test.ts` | Zod schema validation tests |

---

## Part 6: Future Roadmap

### Near Term

| Feature | Complexity | Description |
|---------|------------|-------------|
| **In-app ZOUNZ voting** | Medium | Wire up `castVote()` from Governor ABI in ZounzProposals instead of linking to nouns.build |
| **Snapshot vote display** | Low | Show per-user vote status in SnapshotPolls (requires wallet-signed GraphQL query) |
| **Poll config admin UI** | Low | Admin panel to customize weekly poll choices (currently from community.config.ts) |
| **Proposal templates** | Low | Pre-filled templates for common proposal types (budget request, role change, feature request) |

### Medium Term

| Feature | Complexity | Description |
|---------|------------|-------------|
| **Snapshot X (on-chain execution)** | High | When Base is supported by Snapshot X, enable on-chain execution of poll results |
| **Custom OZ Governor with Respect-weighted voting** | High | Deploy a custom OpenZeppelin Governor where vote weight comes from Respect tokens instead of NFT ownership |
| **Delegation support** | Medium | Allow members to delegate their Respect voting power to trusted representatives |
| **Quadratic voting option** | Medium | Alternative voting mode where vote power = sqrt(Respect) to reduce whale dominance |

### Long Term

| Feature | Complexity | Description |
|---------|------------|-------------|
| **Optimistic governance** | High | OREC-style consent-based governance where proposals pass unless blocked by sufficient opposition |
| **Cross-DAO proposals** | High | Proposals that span ZAO + Eden Fractal or other allied DAOs via cross-chain Respect |
| **AI-assisted proposal drafting** | Medium | ElizaOS agent helps members draft well-structured proposals from natural language |
| **Governance analytics dashboard** | Medium | Historical voting patterns, participation rates, Respect distribution, proposal success rates |

---

## Sources

- `src/app/api/proposals/` — verified in codebase March 25, 2026
- `src/lib/zounz/contracts.ts` — ZOUNZ contract addresses verified on Base
- `src/lib/snapshot/client.ts` — Snapshot GraphQL integration verified
- Doc 131 — On-Chain Governance research
- Doc 132 — Snapshot Weekly Polls research
- Doc 56 — ORDAO Respect System
- [Nouns Builder Docs](https://docs.zora.co/docs/smart-contracts/nouns-builder/intro)
- [Snapshot.js SDK](https://github.com/snapshot-labs/snapshot.js)
- [OpenZeppelin Governor](https://docs.openzeppelin.com/contracts/5.x/governance)
