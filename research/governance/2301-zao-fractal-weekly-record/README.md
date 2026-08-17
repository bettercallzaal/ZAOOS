---
topic: governance
type: data-convention
status: in-progress
last-validated: 2026-08-17
related-docs: 1254, 1202, 1200, 1770, 1069, 696
original-query: "inventory every existing store of past ZAO Fractal data, design a durable per-week data shape, and backfill the weekly record newest-first"
tier: STANDARD
---

<!-- Both contracts enumerated from Optimism 2026-08-17.
     ZOR ERC-1155: 39 weeks (68-109), 288 live awards, 288+28 reversed = 316 mints.
     OG ERC-20: 69 mints -> 1 operator -> 447 distributions over 48 days; carries no
     week number, so weeks 1-73 come from the Airtable export instead, reconciled
     against the chain at 98 of 104 members exact.
     105 week files total. Remaining gaps are off-chain: attendance, photos,
     current-era camera-on, and weeks 6/61/73 which the source never recorded. -->

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

Both contracts are on **Optimism**, not Base. There was no per-week, per-recipient enumeration checked in anywhere - only these counts. `research/governance/1200-respect-onchain-facts-verified/respect-facts.json` is the sibling holder-level fact sheet.

> **Part 3 changed this for ZOR.** `zor-awards.json` in this directory is now the per-award enumeration of the ZOR contract - 316 mints and 28 burns, every one with its tx, block, timestamp, recipient, Respect value and meeting number. Doc 1202's aggregate of 31 ZOR weeks is consistent with it. The OG ERC-20 still has counts only.

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
Doc 1770's live-session horizon is **week 107**: line 53 cites week 106 (the even split, 40 each), line 63 cites week 106 cameras, **line 64 cites week 107 cameras** (Ohnahji + Zaal), and line 73 cites week 103 newcomers. So **weeks ~92 onward existed on Optimism and in Discord, and nowhere in a file anyone could read.**

> **Resolved the same day.** Part 3 enumerated the ZOR contract directly and closed this: weeks 92-109 are now files. The finding stands as the reason the work happened, and the remaining gap is now the OG era (weeks 1-67) plus meetings 72, 73 and 104.

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

Four scripts. **On-chain supersedes CSV wherever both exist**, and the order below is the order to run them:

| Script | Covers | Role |
|---|---|---|
| `fetch-zor-onchain.py` | weeks 68-109 | Enumerates the ZOR ERC-1155. Authoritative - the token id carries the meeting number |
| `build-airtable-weeks.py` | weeks 1-73 | The pre-chain record by name, plus camera-on. Never overwrites a chain-derived file that has live awards |
| `fetch-og-onchain.py` | no weeks | Enumerates the OG ERC-20 into a settlement record + the reconciliation. Deliberately writes **no** week files - see Part 4 |
| `build-weeks.py` | weeks 74-91 | The original CSV path, kept as the only reader of `data/ordaoawards.csv`'s group numbers and titles |
| `validate-weeks.py` | all | The gate. Run it last, every time |

```bash
python3 fetch-zor-onchain.py --fetch          # enumerate ZOR, cache raw
python3 fetch-zor-onchain.py --out weeks      # decode into week files
python3 build-airtable-weeks.py --out weeks   # weeks 1-73 from the Airtable export
python3 fetch-og-onchain.py --fetch           # OG settlement record + reconciliation
python3 validate-weeks.py --dir weeks         # gate it - 105/105 PASS
```

### How the ZOR encoding actually works

This was an open question - the on-chain-facts memory recorded it as unresolved ("does amount = Respect, or does tokenId encode Respect and amount = count?"). **The answer is both, in two token ids emitted by a single `TransferBatch` log:**

| token id | value | meaning |
|---|---|---|
| `0` | 110, 68, 42, 26, 16, 10, ... | the **Respect amount** |
| `mintType(4B) \| period(8B) \| recipient(20B)` | `1` | a per-period badge, one per award |

Both rows carry the same `tx_hash`, `log_index` and `to`, so an award is recovered by pairing on that triple. **`meeting = period + 1`.** That is why a naive holder-balance sum produces the mix of `1`s and Fibonacci numbers the memory flagged, and why a combined Gini could not be computed from balances: half the rows are badges, not amounts.

### Verification of the method itself

Reconstructing meetings 74-91 from the chain and diffing against `data/ordaoawards.csv`: **15 of 18 meetings match exactly**, recipient-for-recipient and value-for-value. The 3 that differ all differ the same way - the chain holds one award the CSV lacks, and the CSV holds nothing the chain lacks:

| Meeting | Chain | Export | The award only the chain has |
|---|---|---|---|
| 89 | 14 | 13 | 42 Respect to `0xfaCEf700...ff09e` |
| 90 | 15 | 14 | 110 Respect to `0x570e563b...5cad` |
| 91 | 9 | 8 | 110 Respect to `0x9763c16d...9eea` |

**The local CSV export under-reports the settled record by three awards.** The chain is the source of truth; the CSV is now used only for group numbers and titles.

Two independent cross-checks landed on top of that: meeting 106 comes back as six awards of 40 each, which is exactly the even split [doc 1770](../1770-fractal-respect-operations/) line 53 describes as "week 106 = 40 each" - confirming the meeting numbering matches the one humans use in the room. And meeting 107 exists on-chain, matching line 64's week-107 camera note.

### Mints, burns, and why four weeks show zero

The contract's 688 transfer rows are **632 mints and 56 burns**, which pair into **316 mints and 28 burns**. The burns are all dated 2025-10-24, all at the 1x tier, and all against meetings 68-71: those weeks were minted onto ZOR shortly after its 2025-10-16 launch and then **fully reversed**.

Every burn is netted against its mint, so a reversed award never counts toward a total. But the week files for 68-71 are still written, carrying `participants: 0` and a populated `reversed_awards` list, because **a reversal is not a gap** - dropping those files would erase the fact that settlement was attempted and undone. Accounting closes exactly: 288 live + 28 reversed = 316 mints.

### Built 2026-08-17 from the chain: 39 weeks, meetings 109 down to 68

| | |
|---|---|
| Weeks with live awards | **35** (74-109, less 104) |
| Weeks fully reversed | 4 (68, 69, 70, 71) |
| Live awards | **288**, totalling **16,418 Respect** |
| Reversed awards | 28, totalling 848 Respect |
| Newest settled week | **109**, settled 2026-08-10 |

Recent weeks, read back out of the generated files:

| Week | Settled | Awards | Respect | Shape |
|---|---|---|---|---|
| 109 | 2026-08-10 | 4 | 246 | ranked |
| 108 | 2026-08-10 | 12 | 644 | 3 groups |
| 107 | 2026-08-10 | 7 | 382 | matches doc 1770's week-107 note |
| 106 | 2026-08-03 | 6 | 240 | even split, 40 each - matches doc 1770 line 53 |
| 105 | 2026-07-06 | 4 | 246 | ranked |
| 103 | 2026-06-22 | 6 | 272 | ranked |

Weeks 106 through 109 all settled on 2026-08-10 - four weeks minted in one batch. This is the settlement-vs-session gap at its widest, and the reason `date` is never presented as a session date.

**Where the record actually ends.** The newest settled week on-chain is **109**. The lane was pointed at "weeks 92-111"; weeks 110 and 111 have no ZOR settlement, which means either they have not happened yet or they have not been settled. **That is not evidence they are missing** - `state-claims.md`, silence is not evidence. Someone who was in the room should say which.

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

## Part 4 - The OG era (weeks 1-73)

The OG Respect **ERC-20** `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` on Optimism. Metadata read back matches the on-chain-facts memory exactly: "ZAO RESPECT TOKEN", 18 decimals, total supply **38,484**, **122 holders**.

### Why the chain cannot number these weeks

ZOR encodes the meeting number inside the token id. **The OG ERC-20 encodes nothing** - it is a plain fungible token. Its 518 transfer rows break down as:

| | |
|---|---|
| Mints | 69, **every one to a single operator wallet** `0x7234c36A71...` |
| Operator to member | 447 |
| Member to operator | 2 (returns, 2025-12-12 and 2025-12-20) |
| Burns | 0 |

So the model is: mint to one wallet, distribute from it. Those distributions land across **48 days**, and classifying each day by whether all its values sit on the Fibonacci curve gives the decisive number:

- **8 days** are `single_week_fibonacci` - most likely one week's awards
- **40 days** are `aggregate_or_backfill` - arbitrary sums

The first day alone, 2024-07-30, pays 22 people amounts like 210, 185, 110, 93, 86 - it settled everything accumulated off-chain before the token existed. **Assigning week numbers to OG transfers would be fabrication**, so this doc does not do it. `og-settlements.json` records the settlement days, their shape classification, and every award with its tx.

### Where weeks 1-73 actually come from

`csv import/Respect-Grid view.csv` - 92 session columns and 87 `ZAO Video N` columns across 173 members. `build-airtable-weeks.py` turns those into week files:

- **70 week files written** covering weeks 1-73
- **255 camera-on entries across 50 weeks** (13-72), from the video columns - the first time the camera-on record exists as data
- `era: "airtable"`, `date: null`, `settled: null` - these weeks have **no settlement transaction** and say so
- one group with `mode: "recorded"`, because the group structure of that era is not known and a fabricated ranking would be worse than an honest absence
- wallets attached where the Airtable map knows one, `null` otherwise

**Weeks 6, 61 and 73 have no column at all** in the export - a genuine gap in the source, not a build failure. The column `ZAO Fractal 73.2` is a sub-session with no week slot; it is deliberately **not** written and left for a human to place.

### The reconciliation that makes this trustworthy

Summing what each member actually received on-chain and comparing it against Airtable's own `actual ZAO onchain` column:

| Result | Count |
|---|---|
| **Exact match** | **98** |
| Mismatched | 6 |
| Unmappable (no wallet, or never received on-chain) | 5 |

Two independent records - a spreadsheet maintained by hand and a token contract - agreeing to the unit on 98 of 104 mappable members. The largest mismatch is the operator wallet itself, understated by construction: it holds the undistributed mint balance and is the *sender* of every distribution, so what it received is not what it was awarded. The other five differ by 5-25 Respect.

### Weeks 68-71 are merged, not overwritten

Those four weeks exist in both records: the Airtable has what the room awarded, while their ZOR mints were fully burned. The builder merges rather than choosing - Airtable results become the live record, and the reversed on-chain awards stay in `reversed_awards`. A chain-derived file with live awards is never overwritten.

### A measured note on transferability

The governance docs describe Respect as non-transferable. Precisely: **the OG ERC-20 permits transfers and 449 occurred** - but 447 are the operator distributing awards, and the remaining 2 are returns to that same operator. There is no member-to-member transfer in the record, and no purchase path appears anywhere in it. So the *substance* of the claim holds on the evidence; the *mechanism* is a distribution model rather than a technical transfer lock. ZOR is the soulbound one. Anyone restating the claim externally (OP RF, Govbase, press) should use the precise form.

---

### What is not backfilled yet, and why

| Gap | Where the data is | Blocker |
|---|---|---|
| **Weeks 6, 61, 73** | nowhere found | No column exists in the Airtable export, and the OG chain cannot supply a week number. A genuine hole in the source |
| **`ZAO Fractal 73.2`** | the Airtable export | A sub-session with no week slot. Deliberately not written - a human should place it |
| **Meeting 104** | unexplained | Absent from ZOR while 103 and 105 both settled. **Nobody should assume it did not happen** |
| **Weeks 110-111** | possibly nowhere yet | No ZOR settlement. Either not yet held or not yet settled - ask someone who was there rather than infer |
| **Week numbers for OG settlements** | not recoverable from chain | The ERC-20 carries no meeting number and 40 of 48 distribution days are bulk backfills. Mapping them would be fabrication; the Airtable supplies the numbering instead |
| **Attendance, every week** | Discord session records | No source enumerated. Attendance is NOT the award count - someone can attend and receive nothing |
| **Photos, every week** | scattered; `~/Documents/zao-media/appearances/` is the nearest thing | No per-week visual archive exists to point at |
| **Camera-on after week 72** | doc 1770's video-Respect stream | The Airtable video columns stop being populated after 72, and the chain does not distinguish a video award from a breakout award |
| **2026-08-16 camera batch** | the lane's founding directive only | Week number not confirmed. Weeks 106-109 all settled 2026-08-10, so inferring a week from that date is exactly what this doc warns against |

Both contracts are now enumerated. What remains is not on any chain: attendance, photos, the current-era camera-on stream, and three weeks the source itself never recorded.

---

## Sources

- **Optimism mainnet, enumerated 2026-08-17** - ZOR Respect ERC-1155 `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` via the Blockscout v2 API (`optimism.blockscout.com`), 688 transfer rows over 14 pages, pagination run to natural exhaustion (no page cap hit). Contract confirmed as "ZAO Fractal Respect", ERC-1155, 58 holders at time of read. Raw JSON was fetched and decoded locally; `zor-awards.json` in this directory is the normalized result and is the quotable evidence for every number in Part 3.
- ZAOOS repo, measured 2026-08-17: `csv import/*.csv`, `data/ordaoawards.csv`, `scripts/archive/old/create-respect-tables.sql`, `scripts/archive/old/create-fractal-live-tables.sql`, `scripts/archive/2026-04-25-cleanup/import-fractal-history.ts`, `src/app/api/fractals/*`, `src/app/api/respect/*`, branch `feat/fractal-run-awards`
- `~/Desktop/repos/fractalbotjuly2026/data/*.json` (Discord bot state), `~/Desktop/repos/ZAOfractal`, `~/Desktop/repos/zaofractal-contracts`, `~/Documents/zao-media/appearances/`
- Docs [1254](../1254-zao-fractal-100-week-record/), [1202](../1202-fractal-onchain-settlement-history/), [1200](../1200-respect-onchain-facts-verified/), [1770](../1770-fractal-respect-operations/) (the rank-to-denomination table), [1069](../1069-fractal-discord-bot-voting-mechanism/), [696](../696-respect-fractal-lineage-summary/)
- Founding directive: `~/.zao/handoffs/2026-08-17-fractal-data-lane.md` (Zaal, 2026-08-17)
