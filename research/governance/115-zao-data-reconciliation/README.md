---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-21
superseded-by:
related-docs: 56, 58, 102, 103, 104, 114, 184, 188, 285, 306, 702, 703
original-query: "How do we unify ZAO's two Respect ledgers (OG ERC-20 fractals 1-73 in Airtable, ZOR ERC-1155 fractals 74+ on-chain) into a single source of truth in Supabase, and what is the reconciliation plan? (reconstructed)"
tier: STANDARD
---

# 115 - ZAO Respect Data Reconciliation Plan

> **Goal:** Unify ZAO's two Respect ledgers (OG ERC-20 historical Airtable data + ZOR ERC-1155 on-chain ORDAO data) into a single canonical Supabase schema, with clear reconciliation rules and ongoing sync pathways.

---

## Key Decisions (Recommendations First)

| # | Recommendation | Why | Status |
|---|---|---|---|
| 1 | **Adopt Supabase `respect_members` + `fractal_sessions` + `fractal_scores` as the single source of truth** | Consolidates OG Airtable + ZOR on-chain into one schema. Leaderboard queries already built to read this schema first, fall back to multicall. | IN PROGRESS (code ready, import pending) |
| 2 | **Archive OG Airtable CSV import as historical read-only, never re-import** | Prevents accidental overwrites. OG data is final (no new fractals in that era). Airtable CSVs serve as audit trail only. | READY |
| 3 | **Lock ZOR on-chain data to OREC contract reads + bot webhook, never manual CSV import** | ORDAO moving forward is automated: bot submits, OREC executes, Supabase syncs via webhook. No more awards.csv files. | READY |
| 4 | **Publish OG-to-ZOR ledger mapping (fractal 74 transition formula)** | Enable future migrations/audits. Map which OG fractals (1-73.2, ERC-20 era) become ZOR fractals (74+, ERC-1155 era). Export before legacy data is archived. | MEDIUM PRIORITY |
| 5 | **Establish reconciliation rule for member wallet changes** | Members may update wallet (respect_wallet vs primary_wallet). Leaderboard code reads respect_wallet first, falls back to primary. Lock this rule in CLAUDE.md. | READY |

---

## The Two Eras (Technical Audit)

| Era | Fractals | Data Source | Token Standard | Contract Address | Holders | Total Supply | Bot Status |
|-----|----------|-------------|-----------------|------------------|---------|--------------|-----------|
| **OG Era** | 1-73.2 | Airtable CSV (offline) | ERC-20 | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | 122 | 38,484 | N/A (pre-bot) |
| **ZOR Era** | 74+ | OREC executor + fractal bot v2.0+ | ERC-1155 (token ID 0) | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | 4 (early) | Per-session | v2.1 (as of May 2026) |
| **OREC Contract** | (executive) | On-chain voting (ORDAO) | Executor | `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` | (signers: zaal.eth, civilmonkey.eth) | 242 txns total | Deployed 2025-09-11 |

**Transition point:** Fractal 73 was skipped (one calendar day off); 73.2 is the final OG-era fractal. Fractal 74 onward = ORDAO + ZOR governance era.

**Bot history:** fractalbotmarch2026 v2.0 (March 27, 2026) migrated all JSON storage to Supabase (respect_members, fractal_sessions, fractal_scores tables). v2.0.1 wired direct Supabase table writes. Current: v2.1 with auto-submit to OREC, Farcaster linking, Snapshot polls.

---

## Live Codebase Integration

| File Path | Function | Status | Notes |
|-----------|----------|--------|-------|
| `src/lib/respect/leaderboard.ts` | Fetch leaderboard from Supabase + multicall | PRODUCTION | Reads Supabase first (respect_members.respect_wallet), falls back to on-chain multicall. Cache TTL 5min. |
| `src/app/api/respect/leaderboard/route.ts` | HTTP GET endpoint for leaderboard | PRODUCTION | Returns ranked list + stats (totalOG, totalZOR, holdersWithRespect). |
| `src/app/api/respect/sync/route.ts` | Webhook endpoint for bot -> Supabase sync | PRODUCTION | Ingests fractal results, writes to fractal_sessions + fractal_scores. |
| `src/app/api/respect/member/route.ts` | Member detail endpoint | PRODUCTION | Single user's respect breakdown (OG + ZOR + contributions). |
| `src/app/api/admin/respect-import/route.ts` | Import handler (legacy) | READY FOR USE | Maps Airtable CSVs to Supabase schema. One-time operation. |
| `community.config.ts` lines 105-116 | Respect contract config | REFERENCE | Defines ogContract, zorContract, zorTokenId, chain=optimism. |

---

## Supabase Schema (Target State)

### `respect_members` Table

| Column | Type | Source | Purpose |
|--------|------|--------|---------|
| id | UUID | Supabase | Primary key |
| fid | integer | users table | Farcaster ID |
| username | text | users table | Display name |
| primary_wallet | text | users table | Primary ETH wallet |
| respect_wallet | text | users table | Override wallet for respect reads (OG era members may use different address) |
| og_respect | integer | OG Airtable import | Total ERC-20 balance from OG era |
| zor_respect | integer | OREC on-chain reads | Total ERC-1155 (tokenID 0) balance from ZOR era |
| total_respect | integer | COMPUTED | og_respect + zor_respect |
| first_token_date | date | Multicall (Transfer logs) | Earliest block where wallet received any respect token |
| updated_at | timestamp | Supabase | Synced at bot webhook or manual import |

### `fractal_sessions` Table

| Column | Type | Source | Purpose |
|--------|------|--------|---------|
| id | UUID | Supabase | Primary key |
| fractal_number | integer | OG Airtable (1-73.2) or bot (74+) | Week identifier |
| scoring_era | enum ('OG', 'ZOR') | Automatically inferred | OG fractals 1-73.2, ZOR fractals 74+ |
| session_date | date | Airtable or bot submit time | When the fractal occurred |
| attendance_count | integer | Count of fractal_scores rows | How many members participated |
| total_respect_awarded | integer | SUM(fractal_scores.respect_points) | Total respect distributed that week |
| submission_method | enum ('airtable_import', 'bot_webhook', 'manual') | Source | How results entered |

### `fractal_scores` Table

| Column | Type | Source | Purpose |
|--------|------|--------|---------|
| id | UUID | Supabase | Primary key |
| fractal_session_id | FK | fractal_sessions.id | Link to session |
| member_wallet | text | OG Airtable or bot submit | Member's eth address |
| rank | integer (1-6) | Group consensus | Final ranking by peer vote |
| respect_points | integer | Fibonacci [1,2,3,5,8,13] | Points awarded for that rank |
| contribution_note | text | Member description (OG) or auto-summary (bot) | What they contributed |

---

## Airtable CSVs (Historical Data Inventory)

### OG Era Source Files (6 CSVs, offline storage)

| File | Rows | Key Fields | Purpose |
|------|------|-----------|---------|
| **Respect** | 173 | Per-member scores for Fractals 1-92 + video participation | Core fractal ranking data |
| **Summary** | 173 | Name, wallet, total points, OG on-chain balance, fractal sum | Member-level aggregate |
| **Wallet Data** | 174 | ETH wallets, SOL wallets, ENS names | Address mapping |
| **Fractal Hosts** | 174 | Hosting points (10-40 pts), Fractalgram certification | Special role recognition |
| **Misc** | 174 | Discord intro (10), Charmverse intro (25), form (5), artist listing (50), newsletter (varies) | One-time contributions |
| **ZAO Festivals** | 174 | ZAO-PALOOZA (250 pts), ZAO-CHELLA (250 pts) | Event attendance |

**Special encoding in OG Airtable (fractals 74-92 rows):**
- **0 in Fractal column** = "score is on-chain via ORDAO, not tracked here"
- **10 in Video column** = "camera was on" (still tracked in Airtable, not on-chain)
- **Empty** = "did not attend"

### ORDAO Awards CSVs (Deprecated, for reference only)

| File | Awards | Meetings | Unique Wallets | Purpose |
|------|--------|----------|-----------------|---------|
| **awards.csv** | 49 | Fractals 85-90 | 24 | Early ORDAO submissions |
| **awards (2).csv** | 49 | Fractals 75-85 | 20 | Mid-period ORDAO |
| **awards (3).csv** | 47 | Fractals 74-79 | 28 | Initial ZOR deployments |
| **TOTAL** | 148 | 17 fractal sessions (74-90) | 42 unique | Pre-bot manual exports |

**Note:** These CSVs are DEPRECATED. OREC contract is the source of truth for fractals 74+. Bot syncs OREC -> Supabase directly. No new awards.csv files are created.

---

## Contribution Types and Point Mappings

| Contribution Type | Points | Source Era | On-Chain Storage | Sync Method |
|-------------------|--------|-----------|-----------------|------------|
| **Fractal Respect (OG, ranks 1-6)** | 1-55 per Fibonacci | Airtable 1-73.2 | ERC-20 (manually) | One-time import |
| **Fractal Respect (ZOR, ranks 1-6)** | 1-110 per Fibonacci | Bot webhook 74+ | ERC-1155 (auto via OREC) | Bot webhook + multicall |
| **Video participation** | 10 per session | Airtable (OG era) | NO | Historical only, not replicated |
| **Discord intro** | 10 | Airtable (Misc) | ERC-20 (OG era only) | One-time import |
| **Charmverse intro** | 25 | Airtable (Misc) | ERC-20 (OG era only) | One-time import |
| **Website artist listing** | 50 | Airtable (Misc) | ERC-20 (OG era only) | One-time import |
| **Fractal hosting** | 10-40 | Airtable (Hosts) | ERC-20 (OG era only) | One-time import |
| **ZAO Festival attendance** | 250 | Airtable (Festivals) | ERC-20 (OG era only) | One-time import |
| **Proposal rewards** | 100-500 | Airtable (Misc) | ERC-20 (OG era only) | One-time import |

---

## Top Members by Total Respect (as of May 2026)

| Rank | Name | OG Respect | ZOR Respect | Total | Notes |
|------|------|-----------|-----------|-------|-------|
| 1 | Zaal | 2,103 | ~500+ | 2,603+ | Founder, consistent top performer |
| 2 | Attabotty | 1,669 | ~450+ | 2,119+ | Early and sustained |
| 3 | Hurric4n3ike | 2,130 | ~200+ | 2,330+ | Strong OG era |
| 4 | Prizem | 2,040 | ~350+ | 2,390+ | Early contributor |
| 5 | EZinCrypto | 2,072 | ~250+ | 2,322+ | Consistent voter |

*Estimates based on March 2026 baseline + ~8 weeks growth to May 2026.*

---

## Import Plan: Airtable to Supabase (One-Time Operation)

### Phase 1: Prepare OG Airtable CSVs

1. Export all 6 Airtable CSVs from `csv import/` folder.
2. Normalize wallet addresses to lowercase + validate format.
3. Map member names to FID/username via users table (LEFT JOIN).
4. Audit: Check for duplicates, missing wallets, name inconsistencies.

### Phase 2: Import to respect_members

- Insert 173 rows from Summary CSV.
- Set `og_respect` = Total Points from Summary.
- Set `respect_wallet` = ETH wallet (Wallet Data CSV).
- Set `zor_respect` = 0 for all OG-era members (will be populated by bot sync later).
- Set `first_token_date` = CURRENT_DATE (will be backfilled by multicall on first leaderboard fetch).

### Phase 3: Import to fractal_sessions + fractal_scores

- Create 73 sessions for OG era (fractals 1-73.2).
- For each session: parse Respect CSV, find rows with non-empty Fractal column.
- Insert one fractal_scores row per member-per-session with rank + points.
- Skip rows with "0" in Fractal column (ORDAO era, handled by bot).
- Skip rows with empty cells (no attendance).

### Phase 4: Backfill ZOR Data from OREC

- Query OREC contract for all executed proposals (fractals 74-90+).
- Parse proposal outcomes -> member ranks + points.
- Insert fractal_sessions rows for each OREC submit.
- Insert fractal_scores rows with bot-extracted data.
- Set `scoring_era = 'ZOR'` for all fractals 74+.

### Phase 5: Validate and Lock

- Run leaderboard query, compare total OG + ZOR against known totals.
- Reconcile discrepancies: check for wallet mismatches, missing submissions.
- Set `submission_method` = 'airtable_import' for OG era, 'orec_query' for ZOR era.
- Archive Airtable CSVs (read-only backup).

---

## Going Forward: Live Data Pipelines

### New Fractal Results (Fractals 74+)

1. **Bot submits to OREC:** fractalbotmarch2026 v2.1 collects votes, calls OREC executor.
2. **OREC executes:** 2 signers (zaal.eth, civilmonkey.eth) approve, contract mints ZOR ERC-1155.
3. **Bot syncs to Supabase:** Webhook endpoint `src/app/api/respect/sync/route.ts` ingests bot event -> writes fractal_session + fractal_scores.
4. **Leaderboard updates:** On next fetch, multicall reads ZOR contract -> aggregates with Supabase.

### One-Time OG Contributions (Intros, Articles, Hosting)

**Current:** Airtable manual entry.  
**Future:** ZAO OS admin panel (planned) with form inputs -> direct Supabase writes -> optional ERC-20 distribution via admin wallet.

### Member Wallet Changes

**Rule (locked in code):** `src/lib/respect/leaderboard.ts` reads `respect_wallet` first. If null, falls back to `primary_wallet`. Member can update `respect_wallet` via settings page -> next leaderboard fetch reflects old address's balance on new row (separate entry in respect_members).

---

## Reconciliation Rules

### OG ERC-20 to ZOR ERC-1155 Mapping

**Rule:** OG-era members (fractals 1-73.2) receive no automatic ZOR at transition. ZOR is earned post-fractal-74 via new voting. OG balance is archived as historical record.

**Formula for unified leaderboard:**
```
total_respect = og_respect + zor_respect
ogPct = 100 * og_respect / (sum of all og_respect)
zorPct = 100 * zor_respect / (sum of all zor_respect)
```

### Address Mismatch Resolution

| Scenario | Resolution | Code Location |
|----------|-----------|--------------|
| OG CSV has ETH, on-chain reads SOL | Respect wallet (ETH) canonical, keep both in users table but query ETH for respect | leaderboard.ts |
| Member transfers ETH (OG era) | Old address holds old tokens, new address starts fresh. Supabase reflects both. | Multicall per session. |
| FID not found in users table | Fallback to wallet address for leaderboard display. | leaderboard.ts line 140 |

---

## Also See

- **Doc 703** - ZAO Fractal: Current State (May 2026) - operatonal status + open issues
- **Doc 702** - Respect & Fractal Governance: The Complete Lineage - protocol history
- **Doc 114** - ZAO Fractal Governance on Optimism - original ORDAO audit
- **Doc 188** - ZAO Fractal Bot Process - fractalbotmarch2026 design
- **Doc 56, 58** - ORDAO-Respect system + Respect deep dive - governance mechanics

---

## Next Actions

| Task | Owner | Priority | Deadline |
|------|-------|----------|----------|
| Run Airtable import to Supabase (Phase 1-2) | Zaal or engineer | HIGH | ASAP |
| Backfill ZOR data from OREC contract queries (Phase 4) | Engineer | HIGH | ASAP |
| Validate leaderboard totals vs. known OG + ZOR on-chain (Phase 5) | Zaal | HIGH | Post-import |
| Archive OG Airtable CSVs (read-only) + publish export | Zaal | MEDIUM | Post-import |
| Document wallet update rules in CLAUDE.md | Engineer | MEDIUM | Post-import |
| Establish ZOR submission via ZAO OS UI (remove 2-wallet bottleneck) | Engineer | MEDIUM | Next sprint |

---

## Sources

- **Codebase:** `src/lib/respect/leaderboard.ts` [FULL], `src/app/api/respect/sync/route.ts` [FULL], `community.config.ts` lines 105-116 [FULL]
- **Supabase tables:** respect_members, fractal_sessions, fractal_scores (schema inspected 2026-05-21) [FULL]
- **Optimism on-chain:** OG ERC-20 `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`, ZOR ERC-1155 `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`, OREC `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` [FULL]
- **Bot:** fractalbotmarch2026 v2.1 (git history at bot-hosting.net), deployed March 28 2026 [FULL]
- **Historical docs:** 114, 188 in research/ library [FULL]
