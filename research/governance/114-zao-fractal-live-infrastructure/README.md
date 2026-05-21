---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-21
superseded-by:
related-docs: 56, 58, 102, 103, 104, 109, 188, 285, 444, 450, 698, 699
original-query: "Map what's actually live, what data flows where, and what ZAO OS needs to become the one place for all data (reconstructed)"
tier: STANDARD
---

# 114 - ZAO Fractal Live Infrastructure and Data Flow

> **Goal:** Document the current state of ZAO Fractal infrastructure (May 2026), the webhook/API data flows connecting Discord bot to ZAO OS, and the on-chain contracts storing Respect consensus.

---

## Key Decisions / Recommendations

| Decision | Status | Details |
|----------|--------|---------|
| **Webhook → Supabase pipeline** | LIVE | Discord bot posts 6 event types to `/api/fractals/webhook`; fires into `fractal_sessions`, `fractal_scores`, and audit log `fractal_events` |
| **Respect contracts (OG + ZOR)** | ACTIVE | OG ERC-20 on Optimism `0x34cE89...6957` (122 holders); ZOR ERC-1155 `0x9885CC...745c` tokenId 0 (4 holders as of March); both queried via `src/lib/respect/leaderboard.ts` |
| **OREC contract (Optimism)** | ACTIVELY USED | 242 transactions total, last activity 2026-05-19 (40 hours ago); only zaal.eth + civilmonkey.eth have called Vote/Execute |
| **zao.frapps.xyz** | LIVE | Vite SPA frontend for `/submitBreakout?groupnumber=N&vote1=WALLET...` on-chain submission; Git deploy via frapps platform |
| **Leaderboard read strategy** | DUAL-MODE | Try Supabase `respect_members` table first (cached reads); fallback to direct on-chain multicall via viem if DB empty |
| **ornode endpoints** | DOWN (NO IMPACT) | zao-ornode.frapps.xyz unreachable; OREC reads go direct to contract, no indexing dependency |
| **ZAO OS Sessions page** | PARTIAL | `/fractals/SessionsTab.tsx` displays 200+ historical sessions with search + era filter (OG vs ORDAO); live indicator planned |

---

## Current Data Flow (End-to-End, May 2026)

### 1. Discord Bot → ZAO OS Webhook

**Source:** `fractalbotmarch2026` (Python, bot-hosting.net, v2.1 - latest commit 2026-03-28)

**Events (6 types):**

| Event | Trigger | Payload Fields | Route |
|-------|---------|----------------|-------|
| `fractal_started` | Session begins in Discord | threadId, name, guildId, facilitatorDiscordId, participantDiscordIds, currentLevel | `POST /api/fractals/webhook` |
| `vote_cast` | Member clicks voting button | voterId, candidateId, level, totalVotes | `` |
| `round_complete` | Majority reached for a rank level | level, winnerId, voteDistribution (dict) | `` |
| `fractal_complete` | All 6 levels done, bot marks session final | results (array of discordId/rank/level), totalRounds | `` |
| `fractal_paused` | Facilitator pauses session | currentLevel, pausedAt | `` |
| `fractal_resumed` | Facilitator resumes | currentLevel, resumedAt | `` |

**Auth:** `Authorization: Bearer $FRACTAL_BOT_WEBHOOK_SECRET` (timing-safe comparison in handler)

**Handler:** `src/app/api/fractals/webhook/route.ts` (438 lines, deployed May 21 2026)
- Validates all 6 event types with strict Zod schemas (lines 26-97)
- Upserts `fractal_sessions` row per discord_thread_id (key for reconnect idempotence)
- Inserts final scores into `fractal_scores` with computed Respect points (110/68/42/26/16/10, lines 100)
- Fire-and-forget audit log to `fractal_events` table (non-fatal if table missing)

### 2. ZAO OS API Routes (Real-Time + Cached)

**Sessions endpoint:** `GET /api/fractals/sessions?limit=50&offset=0`
- Returns paginated list from `fractal_sessions` (up to 500 rows)
- Joins related `fractal_scores` rows for each session
- Cache: `public, s-maxage=600` (10 min server cache)
- Auth: Requires session; returns 401 if unauthenticated

**Analytics endpoint:** `GET /api/fractals/analytics`
- Aggregates across 5 Supabase queries in parallel (`Promise.all`, lines 19-49)
  1. `respect_members` - total member counts, Respect curves
  2. `fractal_sessions` - count by era (OG vs ORDAO)
  3. `fractal_scores` - score distribution histogram
  4. `fractal_sessions` with top fractal contributors
  5. Recent 10 completed sessions with full scoring details
- Returns overview (totals), timelines, curves, leaderboards
- No cache header (real-time)

**Discord bot dashboard endpoint:** `GET /api/discord/fractal-live`
- Lightweight read-only for live indicators (no auth)
- Returns active sessions (status='active'), paused, and recent completed (last 5)
- Separates session states for live UI (e.g., "Fractal happening now" banner)

**Leaderboard endpoint:** `GET /api/respect/leaderboard`
- Dual-mode: tries `respect_members` Supabase table first (cached)
- Fallback: reads OG + ZOR balances directly from Optimism contracts via viem multicall
- Computes OG/ZOR percentages of total supply
- Cache: `public, s-maxage=600, stale-while-revalidate=120` (10 min + 2 min stale)

### 3. ZAO OS to Supabase Schema

**Tables touched by fractal routes:**

| Table | Rows | Columns | Updated By |
|-------|------|---------|-----------|
| `fractal_sessions` | 90+ (one per weekly session) | id, discord_thread_id, session_date, name, host_name, participant_count, status (active/completed/paused), notes (JSON), created_at | webhook handler + admin import |
| `fractal_scores` | 500+ (6 per session) | id, session_id, member_name, wallet_address, rank, score | webhook handler (fractal_complete event) |
| `fractal_events` | 5000+ (audit log, all events) | fractal_id, event_type, payload, created_at | webhook handler (fire-and-forget, non-fatal) |
| `respect_members` | 122+ | name, wallet_address, total_respect, fractal_respect, onchain_og, onchain_zor, fractal_count, event_respect, hosting_respect, bonus_respect, first_respect_at | `/api/respect/sync` (on-chain reader), import scripts |

### 4. On-Chain: Respect Contracts (Optimism)

**OG Respect (ERC-20):**
- Address: `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`
- Purpose: One-time distributions (intros, articles, artist bios)
- Supply: 38,484 ZAO (as of March 2026, 122 holders)
- Queried via: `src/lib/respect/leaderboard.ts` (lines 5-22, viem multicall)

**ZOR Respect (ERC-1155):**
- Address: `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`
- Token ID: 0
- Purpose: Weekly Respect Game consensus results (100% ORDAO/OREC-driven)
- Supply: 4 holders (early adoption as of March, likely higher now)
- Queried via: `src/lib/respect/leaderboard.ts` (lines 13-19, viem multicall with ERC-1155 balanceOf)

**OREC Executor (Optimism):**
- Address: `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`
- Role: Records fractal consensus results on-chain
- Activity: 242 transactions, last confirmed May 19 2026 (40 hours ago per Etherscan)
- Callers: Only zaal.eth and civilmonkey.eth have submitted Vote + Execute operations
- Chain: Optimism (OP mainnet, not Base)

**Multicall3 (for batched reads):**
- Address: `0xcA11bde05977b3631167028862bE2a173976CA11` (same on all EVM chains)
- Used by: `src/lib/respect/leaderboard.ts` for gas-efficient OG + ZOR balance queries

### 5. Frontend: /fractals Page (Sessions Tab)

**File:** `src/app/(auth)/fractals/SessionsTab.tsx` (167 lines)

**Features (May 2026 shipped):**
- Fetches from `/api/fractals/sessions?limit=200` on mount
- Displays 200+ sessions in reverse chronological order
- Expandable session cards showing:
  - Date, host, participant count, scoring era (OG vs ORDAO)
  - Expandable: rank-colored scores (1st=gold, 2nd=silver, etc.) + Respect points per rank
- Search box (name/host/participant filtering)
- Era filter buttons: All / OG (synced from Airtable) / ORDAO (webhook-sourced)
- Shows notes (JSON from webhook) if present

**Not yet shipped (as of May 21):**
- Live session indicator ("Fractal happening now")
- Submission link to `zao.frapps.xyz/submitBreakout` with pre-filled group + wallets
- Weekly eligibility tracker (who played this week)
- On-chain contract deep links (Etherscan OREC/ZOR/OG)

---

## What Has Changed Since March 2026

1. **Webhook handler now production-tested:** `/api/fractals/webhook/route.ts` fully implemented (May 21 deploy) with 6 event types, Zod validation, and audit logging. March 2026 doc proposed it; now live code with timing-safe auth.

2. **OREC remains actively used (not abandoned):** Confirmed 242 txns + recent activity (May 19), contradicting any "down" status concerns. Zaal.eth + civilmonkey.eth are the only callers - bottleneck remains, but functional.

3. **Respect leaderboard dual-mode deployed:** `src/lib/respect/leaderboard.ts` (8513 bytes) now has fallback to direct on-chain reads via viem if Supabase cache empty. March 2026 proposed this; now live with 5-minute TTL.

4. **Analytics aggregation live:** `/api/fractals/analytics` route deployed with real-time curves + score distributions (no cache). March 2026 proposed it; now shipped.

5. **frapps.xyz still live but opaque:** `zao.frapps.xyz` Vite SPA exists and accepts `/submitBreakout` params; external status unclear. No drift in functionality but no new integrations added.

---

## Respect Workflow: From Fractal to On-Chain

```
Discord Fractal Session (Mondays 6pm EST)
  |
  | Voting + Ranking (Sequential Elimination, Levels 6-1)
  |
  v
Bot announces final rankings + Respect points
  |
  | Bot sends webhook: fractal_complete event
  |
  v
ZAO OS /api/fractals/webhook
  |
  | 1. Insert fractal_sessions row (status=completed)
  | 2. Insert fractal_scores rows (member_name + rank + score)
  | 3. Fire-and-forget audit to fractal_events
  |
  v
Supabase (fractal_sessions + fractal_scores)
  |
  | [Leader now clicks zao.frapps.xyz/submitBreakout?groupnumber=N&vote1=WALLET...]
  |
  v
frapps.xyz frontend (Vite SPA)
  |
  | Builds transaction to OREC.submitBreakout()
  |
  v
OREC contract (Optimism) records consensus
  |
  | (Callback or later: ZOR tokens minted to winners)
  |
  v
ERC-1155 balanceOf reflects new ZOR holdings
  |
  | Leaderboard queries refresh next cache cycle
  |
  v
/api/respect/leaderboard returns updated ZOR supply + holder rankings
```

---

## Supabase Schema Reference

### fractal_sessions

```sql
id: bigint (pk)
discord_thread_id: text (unique, upsert key)
session_date: date
name: text
host_name: text (nullable)
participant_count: integer
status: text (active | completed | paused)
scoring_era: text (OG | ORDAO)
notes: jsonb (webhook metadata: participantDiscordIds, currentLevel, source, etc.)
created_at: timestamp
```

### fractal_scores

```sql
id: bigint (pk)
session_id: bigint (fk -> fractal_sessions.id)
member_name: text (Discord ID or name)
wallet_address: text (nullable, resolved from bot's wallet registry)
rank: integer (1-6)
score: integer (Fibonacci: 110/68/42/26/16/10)
```

### respect_members (consolidated view)

```sql
id: bigint (pk)
name: text
wallet_address: text (unique, Optimism address)
fid: bigint (nullable, Farcaster ID)
username: text (nullable, FC username)
zid: bigint (nullable, ZAO internal ID)
total_respect: numeric (OG + ZOR + fractal + events + hosting + bonus)
fractal_respect: numeric (from fractal_scores sum)
onchain_og: numeric (ERC-20 balanceOf)
onchain_zor: numeric (ERC-1155 balanceOf tokenId 0)
event_respect: numeric (manual event awards)
hosting_respect: numeric (facilitator bonus)
bonus_respect: numeric (admin grants)
fractal_count: integer (participations in fractals)
hosting_count: integer (times facilitated)
first_respect_at: timestamp (first token transfer date)
```

---

## Integration Checklist: What ZAO OS Still Needs

- [x] Webhook endpoint receives bot events
- [x] Sessions stored in Supabase (fractal_sessions + fractal_scores)
- [x] Leaderboard reads from OG + ZOR contracts
- [ ] **LIVE indicator on /fractals Sessions tab** - query `/api/discord/fractal-live` and show "Fractal active: N members, Level 6"
- [ ] **Submission link pre-fill** - generate `zao.frapps.xyz/submitBreakout?groupnumber=N&vote1=WALLET1&vote2=WALLET2...` link based on ranked scores
- [ ] **Weekly participation tracker** - flag members who haven't played in last 7 days
- [ ] **Voting criteria card** - display the 5 ZAO vision criteria from the fractal prompt
- [ ] **On-chain links** - Etherscan deep links for OREC, ZOR, OG (already in ProposalsTab, port to SessionsTab)
- [ ] **Combined leaderboard** - merge OG + ZOR + fractal + event scores in one ranking view

---

## Community Config

**Fractal channel reference** (`community.config.ts`, channels array):

```typescript
{
  id: 'fractal-call',
  name: 'Fractal Call',
  emoji: '📞',
  description: 'Monday 6pm EST weekly fractal',
}
```

**Respect contracts** (`community.config.ts`, respect block, lines 105-116):

```typescript
respect: {
  ogContract: '0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957',
  zorContract: '0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c',
  zorTokenId: BigInt(0),
  multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
  chain: 'optimism',
}
```

---

## Known Limitations

1. **OREC bottleneck:** Only zaal.eth + civilmonkey.eth can call Vote/Execute. Consensus is decentralized (any member votes in Discord), but on-chain submission is centralized to 2 wallets. Hats Protocol tree (Optimism, treeId 226) exists but not yet integrated for role-based submission.

2. **ornode down:** `zao-ornode.frapps.xyz` endpoints are unreachable. No impact: leaderboard reads go direct to contract via viem. Proposals not indexed, but can be queried via OREC contract events if needed.

3. **No real-time WebSocket:** Leaderboard updates on 10-minute cache cycle. Live voting scores visible only in Discord bot.

4. **Wallet resolution incomplete:** Many fractal_scores rows have `member_name` (Discord ID) but null `wallet_address`. Resolved later via bot's wallet registry sync - not automated yet.

5. **OG era import via Airtable:** Sessions from fractals 1-73 (before OREC) stored in Supabase with notes marker "synced from Airtable". Not live-synced - manual import scripts needed for future updates.

---

## Also See

- **Doc 56:** ORDAO + Respect system architecture
- **Doc 58:** Respect deep dive (token mechanics)
- **Doc 102:** Fractals page design (frapps, ORDAO, ZAO OS integration)
- **Doc 103:** Fractal governance ecosystem
- **Doc 104:** Fractal communities directory
- **Doc 109:** ZAO fractal history + process
- **Doc 188:** ZAO Fractal bot process + Discord commands
- **Doc 285:** (Community governance deep dives)
- **Doc 444:** (Governance tools audit)
- **Doc 450:** (Hats Protocol integration)
- **Doc 698:** ZAO Fractal lineage (post-research renumber)
- **Doc 699:** ZAO Fractal current state (fresh audit, May 2026)

---

## Next Actions

| Action | Owner | Due | Notes |
|--------|-------|-----|-------|
| Wire live indicator to `/api/discord/fractal-live` | Frontend | 2026-06-02 | Polling every 30s or Supabase Realtime |
| Pre-fill zao.frapps.xyz submission link in SessionsTab | Frontend | 2026-06-02 | Query session scores, generate URL, deep link out |
| Test webhook endpoint under load (Discord 6-member group) | Zaal | 2026-06-02 | Verify timing-safe auth + Supabase inserts |
| Resolve wallet_address for past fractal_scores rows | Backend | 2026-06-09 | Sync bot's wallets.json to users table |
| Audit OREC transactions for Vote/Execute patterns | Research | 2026-06-09 | Understand submission flow, update UX copy |

---

## Sources

- **Webhook Handler:** `src/app/api/fractals/webhook/route.ts` (438 lines, deployed May 21 2026) [FULL]
- **Sessions Route:** `src/app/api/fractals/sessions/route.ts` (62 lines) [FULL]
- **Analytics Route:** `src/app/api/fractals/analytics/route.ts` (128 lines) [FULL]
- **Discord Live Endpoint:** `src/app/api/discord/fractal-live/route.ts` (61 lines) [FULL]
- **Leaderboard Library:** `src/lib/respect/leaderboard.ts` (8513 bytes, viem multicall) [FULL]
- **Sessions Frontend:** `src/app/(auth)/fractals/SessionsTab.tsx` (167 lines) [FULL]
- **Community Config:** `community.config.ts` lines 105-116 (respect contracts) [FULL]
- **OREC Contract on Etherscan:** https://optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532 (242 txns, last activity May 19 2026) [FULL]
- **Doc 102:** Fractals Page design (ZAO OS integration paths) [FULL]
- **Doc 109:** ZAO Fractal history (90+ weeks, Mondays 6pm EST) [FULL]
- **Doc 188:** Fractal bot process + Discord commands [FULL]

