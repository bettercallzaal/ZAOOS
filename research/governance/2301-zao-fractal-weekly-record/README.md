---
topic: governance
type: data-convention
status: in-progress
last-validated: 2026-08-17
related-docs: 1254, 1202, 1200, 1770, 1069, 696
original-query: "inventory every existing store of past ZAO Fractal data, design a durable per-week data shape, and backfill the weekly record newest-first"
tier: STANDARD
---

# 2301 - ZAO Fractal Weekly Record (inventory + data convention)

> **Purpose:** The durable home for the ZAO Fractal week-by-week record - rankings, Respect awarded per person, attendance, camera-on/video awards, photos. This doc is two things: (1) the exhaustive INVENTORY of where fractal data already lives, done before storing anything new, and (2) the per-week JSON convention plus the first backfill.
>
> **This lane RECORDS, it never computes.** Points are awarded manually by Zaal and settled on-chain. Nothing here derives, scores, or proposes an award.

---

## Part 1 - Inventory: what already exists

Searched 2026-08-17 across the ZAOOS repo, `~/Desktop/repos/*`, `~/Documents/*`, and the research estate. Every row below was opened and measured, not inferred.

### 1.1 The Airtable era - the deepest record we hold

`csv import/` in ZAOOS. Six Airtable grid exports, 173-174 rows each (one row per member).

| File | Rows | What it holds |
|---|---|---|
| `Respect-Grid view.csv` | 173 | **Per-session Respect, weeks 1 through 92**, as one column per session, plus **87 `ZAO Video N` columns** - the camera-on/video award record for the same span |
| `Summary-Grid view.csv` | 173 | Member totals: Total Points, `actual ZAO onchain`, ZRespect Sum, Form/Intros Sum, Fractal Host sum, ZAO Festivals sum |
| `Wallet Data-Grid view.csv` | 174 | Name to ETH/SOL wallet map (also carries email addresses - those never leave this file, per `pii-hygiene.md`) |
| `Fractal Hosts-Grid view.csv` | 174 | Host credit per member, Fractalgram certification |
| `Misc-Grid view.csv` | 174 | Intros, forms, newsletter roles, four named proposals |
| `ZAO Festivals-Grid view.csv` | 174 | ZAO-PALOOZA, ZAO-CHELLA |

Session column names drift across the record (`ZAO Fractal #1 Respect`, `ZAO Fractactal 7 RESPECT`, `ZAO Respect 57`, `ZAO Fractal 73.2`) - a parser must be tolerant.

### 1.2 The ORDAO era - on-chain awards, exported

`data/ordaoawards.csv` in ZAOOS. 162 award rows, **meetings 74 through 91** (period 73-90), minted 2025-11-10 through 2026-03-26. Columns: recipient, denomination, mintType, periodNumber, meetingNumber, groupNum, level, title, reason, tokenId, mintTs, mintTxHash, burn, mintProposalId. Every row is `mintType 10` (the x2 tier). Denominations present: 110, 68, 42, 26, 16, 10 (ranked) and 40 (an even split - three rows whose reason reads "Split Points 40 since bot not working").

This is the strongest structured per-person, per-week data we hold: it carries the settlement tx hash for every award.

### 1.3 On-chain state - counted, but not enumerated per week

`research/governance/1202-fractal-onchain-settlement-history/fractal-onchain-facts.json` (verified 2026-07-17 via Blockscout). It holds **aggregates only**:

- OG ERC-20 `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` - 33 distinct weeks, 438 txs, 2024-07-30 to 2025-12-20
- ZOR ERC-1155 `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` - 31 distinct weeks, 67 txs, 2025-09-25 to 2026-07-06
- Combined 63 distinct on-chain-settled weeks, 1 week of overlap

Both contracts are on **Optimism**, not Base. There is no per-week, per-recipient enumeration checked in anywhere - only these counts. `research/governance/1200-respect-onchain-facts-verified/respect-facts.json` is the sibling holder-level fact sheet.

### 1.4 The Discord bot - thin, not the record

`~/Desktop/repos/fractalbotjuly2026/data/`. `history.json` holds **7 entries total** (one test, then weeks 88, 90, 92 with partial groups, Feb-Mar 2026). `names_to_wallets.json` maps 143 names, `wallets.json` maps Discord id to wallet, `intros.json` and `proposals.json` (24 proposals) are separate streams. `events.json` is empty. The bot is a live-session driver, never a durable archive.

### 1.5 Supabase - schema exists, contents UNVERIFIED

ZAOOS has live tables `fractal_sessions`, `fractal_scores`, `respect_events`, `respect_members`, `respect_transfers`, `fractal_events`, `fractal_live_sessions`, `fractal_webhook_log` - schema in `scripts/archive/old/create-respect-tables.sql` and `create-fractal-live-tables.sql`, read by 12 API routes under `src/app/api/fractals/` and `src/app/api/respect/`. An importer for the Airtable CSVs exists at `scripts/archive/2026-04-25-cleanup/import-fractal-history.ts` (idempotent upserts, handles both the 1x and 2x Fibonacci eras).

**Whether that importer was ever run against production, and what those tables currently hold, was NOT verified** - reading `.env.local` was declined in this session, so no query was made. Treat the tables as unknown-state until someone queries them. Do not assume the backfill below is redundant with them, and do not assume it is not.

**Narrowed 2026-08-17, but still open.** The `zaoos-infra` lane checked its own independent, read-only Supabase grant (project `etwvzrmlxeobinrlytza`) and listed 38 tables: none of the eight are among them. That project is the cowork tracker - `tasks`, `contacts`, `meeting_notes`, `bot_*`, `agent_runs`, `receipts`. So the fractal tables live in a **different Supabase project** that no lane currently holds a grant for. This is real evidence about where they are not; it says nothing about what they contain.

**Closing this needs Zaal, deliberately.** A permission declined in one session must not be routed around by asking another session to run the same query - that turns a "no" into a question of which lane happens to be watching. The unblock is Zaal granting access on purpose, not a lane finding a side door.

### 1.6 Frontend and in-flight work

`src/app/(auth)/fractals/` (FractalsClient, FractalLeaderboardTab), `src/components/governance/LiveFractalDashboard.tsx`. Branch `feat/fractal-run-awards` (unmerged, 1 commit) adds a `RunAwardsTab.tsx` operator view - the weekly awards under one roof. No open PR or remote branch is doing fractal DATA storage; this lane is not duplicating a sibling.

### 1.7 Photos and camera-on

No dedicated fractal photo archive exists on disk. The closest is `~/Documents/zao-media/appearances/` which holds per-event directories (e.g. `2025-06-24-zao-fractal-56-live`, `2026-06-01-zao-fractal-zaal-workshop`) - appearance records, not a per-week visual archive. The camera-on award itself is recorded two ways: as the 87 `ZAO Video N` columns in the Airtable export (weeks 1-92), and, in the current era, as the parallel video-Respect mint stream described in [doc 1770](../1770-fractal-respect-operations/). The 2026-08-16 camera batch (Zaal, Candy, Dank Phart, Jose, Ohnahji, Paper, Metamu) is not yet in any store - it lives only in the lane's founding directive.

### 1.8 The doc estate

~95 fractal/respect research docs exist. The load-bearing ones for this lane: [1254](../1254-zao-fractal-100-week-record/) (the 100+ week headline and its cite discipline), [1202](../1202-fractal-onchain-settlement-history/) (on-chain settlement), [1200](../1200-respect-onchain-facts-verified/) (holder facts), [1770](../1770-fractal-respect-operations/) (how an award is actually made - the rank-to-denomination table this convention uses), [1069](../1069-fractal-discord-bot-voting-mechanism/) (how ranking happens), [696](../696-respect-fractal-lineage-summary/) (lineage). [1608](../1608-fractal-doc-navigator/) navigates the rest.

### 1.9 What the inventory says, in one line

**The record is real but split across four incompatible stores, and the newest ~20 weeks are in none of them.** Airtable covers weeks 1-92 by name. ORDAO covers weeks 74-91 by wallet with tx proof. On-chain holds 63 settled weeks as a COUNT with no per-week rows. The Discord bot holds 3 real weeks.

Doc 1770's live-session horizon is **week 107**: line 53 cites week 106 (the even split, 40 each), line 63 cites week 106 cameras, **line 64 cites week 107 cameras** (Ohnahji + Zaal), and line 73 cites week 103 newcomers. On-chain settlement runs to 2026-07-06. So **weeks ~92 through ~111 exist on Optimism and in Discord, and nowhere in a file anyone can read.**
**The record is real but split across four incompatible stores, and the newest ~19 weeks are in none of them.** Airtable covers weeks 1-92 by name. ORDAO covers weeks 74-91 by wallet with tx proof. On-chain holds 63 settled weeks as a COUNT with no per-week rows. The Discord bot holds 3 real weeks. Doc 1770 was written from the live session at **week 106** on 2026-07-20, and on-chain settlement runs to 2026-07-06 - so weeks ~92 through ~110 exist on Optimism and in Discord, and nowhere in a file anyone can read.

---

## Part 2 - The data shape

One JSON per week at `weeks/week-NNN.json`, `NNN` zero-padded to the meeting number. Newest week = highest number. The shape is additive: a field with no data is `null` or `[]`, never omitted and never guessed.

```jsonc
{
  "week": 91,                  // meeting number - the primary key
  "period_number": 90,         // ORDAO period (meeting - 1 in the whole export)
  "date": "2026-03-26",        // earliest settlement date for the week (UTC)
  "era": "zor",                // "og" (ERC-20) | "zor" (ERC-1155) | "airtable" (pre-chain)
  "contract": "0x9885...445c", // settlement contract, or null pre-chain
  "chain": "optimism",
  "mint_type": 10,             // 0 = Respect Breakout, 10 = Breakout x2 (doc 1770)
  "groups": [
    {
      "group": 1,
      "mode": "ranked",        // "ranked" | "even_split"
      "results": [
        {
          "name": "Hurric4n3ike",     // null when the wallet is unmapped - never a guess
          "wallet": "0x29F5...aa34",
          "rank": 1,                  // 1 = first; null on an even split
          "level": 6,                 // ORDAO level; rank = 7 - level
          "respect": 110,
          "settled": { "tx": "0x...", "token_id": "0x...", "minted_at": "..." },
          "title": null,              // verbatim from the award, when present
          "reason": null
        }
      ]
    }
  ],
  "video_awards": [],          // the camera-on / video Respect stream (doc 1770 s.3)
  "camera_on": [],             // names credited camera-on that week
  "photos": [],                // paths or URLs to the week's visual record
  "attendance": null,          // headcount when known - NOT inferred from participants
  "participants": 8,           // derived: award rows in this week
  "respect_total": 492,        // derived: sum of respect awarded
  "unnamed_wallets": 0,        // how many results still lack a name
  "sources": ["..."],          // every file this week was built from
  "coverage": "partial",       // "partial" until video/camera/attendance/photos land
  "notes": []                  // anomalies found while building, verbatim
}
```

### Conventions that matter

- **`coverage` is honest, not aspirational.** Every backfilled week is `"partial"` because it carries breakout Respect only - no video awards, no attendance, no photos. A week only becomes `"complete"` when a human confirms those four are in.
- **`name: null` beats a plausible name.** 18 of 44 distinct ORDAO recipient wallets have no mapping in the Airtable export or in any award title. They stay null.
- **`attendance` is not `participants`.** Someone can attend and receive nothing. Never derive one from the other.
- **`sources` is per week**, so any number can be traced back to the file it came from.
- **Nothing in this tree awards anything.** `build-weeks.py` re-shapes a settled record; it does not score.

---

## Part 3 - Backfill (newest first)

`build-weeks.py` reads `data/ordaoawards.csv` + `csv import/Wallet Data-Grid view.csv` and writes `weeks/`. Run:

```bash
python3 build-weeks.py --repo "/path/to/ZAO OS V1" --out weeks
```

**Built 2026-08-17: 18 weeks, meetings 91 down to 74.**

| Week | Settled | Groups | Participants | Respect |
|---|---|---|---|---|
| 91 | 2026-03-26 | 2 | 8 | 492 |
| 90 | 2026-03-16 | 3 | 14 | 754 |
| 89 | 2026-03-09 | 3 | 13 | 754 |
| 88 | 2026-03-03 | 3 | 13 | 754 |
| 87 | 2026-02-23 | 1 | 6 | 272 |
| 86 | 2026-02-16 | 2 | 9 | 592 |
| 85 | 2026-02-09 | 1 | 6 | 466 |
| 84 | 2026-02-02 | 1 | 4 | 246 |
| 83 | 2026-01-26 | 1 | 6 | 272 |
| 82 | 2026-01-26 | 1 | 5 | 262 |
| 81 | 2025-12-29 | 1 | 6 | 272 |
| 80 | 2025-12-22 | 1 | 5 | 262 |
| 79 | 2025-12-22 | 1 | 8 | 460 |
| 78 | 2025-12-22 | 1 | 6 | 272 |
| 77 | 2025-12-07 | 2 | 9 | 508 |
| 76 | 2025-11-24 | 4 | 17 | 1100 |
| 75 | 2025-11-17 | 4 | 17 | 984 |
| 74 | 2025-11-10 | 2 | 10 | 524 |

**Verification.** 162 of 162 source rows landed in a week file. Respect totals sum to 9,246 - identical to the sum of the `denomination` column in the source CSV. Zero level/denomination mismatches across all 162 rows (the `rank = 7 - level` mapping holds everywhere). 18 award rows carry `name: null`. Every row in the table above was read back out of the generated JSON, not computed from an assumed weekly cadence.

**The date column is a SETTLEMENT date, not a session date, and the difference is visible in the data.** Weeks 78, 79 and 80 all settled on 2025-12-22; weeks 82 and 83 both settled on 2026-01-26. Awards were batched and minted after the fact. Nothing here tells you when those sessions actually ran - do not cite these as session dates, and do not infer a missed week from a gap.

`groups` counts the group numbers that appear in the export for that week, which is a floor: a group whose awards were never minted leaves no trace here.

### Validate before you trust it

`validate-weeks.py` checks every week file against the convention above: filename matches the `week` field, no duplicate weeks, valid `era`/`coverage`/`mode`, `date` is `YYYY-MM-DD`, `sources` non-empty, every wallet a real 20-byte address, no wallet twice in one group, `respect` maps to the rank it claims, `level` and `rank` agree (`rank = 7 - level`), the derived `participants`/`respect_total`/`unnamed_wallets` match a recount, and `attendance` never below the number of people who received awards.

```bash
python3 validate-weeks.py --dir weeks   # PASS - 18 week file(s) valid
```

**Why this is here rather than in CI.** `docs-automerge.yml` classifies `research/**` as docs and auto-merges with `GITHUB_TOKEN`, and GitHub does not start a workflow run for a push made with that token - so the merge result gets **zero CI** (measured 2026-08-12: four consecutive bot-merged commits, zero runs between them; doc 2291). Branch protection is `strict:false`, so a branch need not be current with main to merge. The daily scheduled run on main (PR #3069, confirmed firing) catches problems the *next morning*; it does not gate them. Anything asserted about these files has to be asserted from the branch, before the merge - so it is, and the validator is checked in so the next person can re-run it.

**The validator was proven to fail before it was trusted.** Run against deliberately corrupted copies it caught all four planted faults (an off-table denomination, a level/rank disagreement, and two derived-field mismatches) and exited 1; run against an empty directory it refuses to pass vacuously. A check that has only ever passed is not evidence.

### What is not backfilled yet, and why

| Gap | Where the data is | Blocker |
|---|---|---|
| **Weeks ~92-111** (the newest, and top priority) | Optimism ZOR contract + zao.frapps.xyz + Discord | Needs an enumeration of ZOR transfers per week; no local export exists |
| **Weeks ~92-110** (the newest, and top priority) | Optimism ZOR contract + zao.frapps.xyz + Discord | Needs an enumeration of ZOR transfers per week; no local export exists |
| **Weeks 1-73** | `csv import/Respect-Grid view.csv`, by name | Parser must handle drifting column names and both Fibonacci tiers; no wallets, no tx proof |
| **Video / camera-on awards, all weeks** | 87 `ZAO Video N` columns (weeks 1-92); doc 1770 stream after | Not yet parsed; current-era video mints not exported |
| **Attendance** | Discord session records | No source enumerated |
| **Photos** | scattered; `~/Documents/zao-media/appearances/` is the nearest thing | No per-week visual archive exists to point at |
| **2026-08-16 camera batch** | the lane's founding directive only | Week number for 2026-08-16 not yet confirmed - do not file it under a guessed week |

Newest-first means weeks 92+ are the next work, not weeks 1-73.

---

## Sources

- ZAOOS repo, measured 2026-08-17: `csv import/*.csv`, `data/ordaoawards.csv`, `scripts/archive/old/create-respect-tables.sql`, `scripts/archive/old/create-fractal-live-tables.sql`, `scripts/archive/2026-04-25-cleanup/import-fractal-history.ts`, `src/app/api/fractals/*`, `src/app/api/respect/*`, branch `feat/fractal-run-awards`
- `~/Desktop/repos/fractalbotjuly2026/data/*.json` (Discord bot state), `~/Desktop/repos/ZAOfractal`, `~/Desktop/repos/zaofractal-contracts`, `~/Documents/zao-media/appearances/`
- Docs [1254](../1254-zao-fractal-100-week-record/), [1202](../1202-fractal-onchain-settlement-history/), [1200](../1200-respect-onchain-facts-verified/), [1770](../1770-fractal-respect-operations/) (the rank-to-denomination table), [1069](../1069-fractal-discord-bot-voting-mechanism/), [696](../696-respect-fractal-lineage-summary/)
- Founding directive: `~/.zao/handoffs/2026-08-17-fractal-data-lane.md` (Zaal, 2026-08-17)
