# 115 — ZAO Respect Data Reconciliation Plan (March 2026)

> **Status:** Research complete — ready to build import
> **Date:** 2026-03-22
> **Goal:** Map all ZAO Respect data sources and create a single source of truth in Supabase

## The Two Eras

| Era | Fractals | Data Source | Token Type | Contract |
|-----|----------|-------------|------------|----------|
| **OG Era** | 1-73.2 | Airtable CSV (`csv import/Respect-Grid view.csv`) | ERC-20 | `0x34cE...6957` |
| **ORDAO Era** | 74-90+ | awards.csv (3 files, on-chain mints) | ERC-1155 | `0x9885...445c` via OREC |

**Transition point:** Fractal 73 was skipped (one day off), 73.2 is the last OG-tracked fractal. Fractal 74 onward = ORDAO on-chain submissions.

## Data Sources Inventory

### Airtable CSVs (6 files in `csv import/`)

| File | Rows | Key Fields |
|------|------|------------|
| **Respect** | 173 | Per-member scores for Fractals 1-92 + video participation (10 pts each) |
| **Summary** | 173 | Name, wallet, total points, actual on-chain OG, fractal sum, intro/hosting/festival sums |
| **Wallet Data** | 174 | ETH wallets, SOL wallets, ENS names |
| **Fractal Hosts** | 174 | Hosting points, Fractalgram certification |
| **Misc** | 174 | Discord/Charmverse intros, forms, website artist listing, newsletter, proposals |
| **ZAO Festivals** | 174 | ZAO-PALOOZA (250 pts) and ZAO-CHELLA (250 pts) attendance |

### ORDAO Awards CSVs (3 files in Downloads/)

| File | Awards | Meetings | Wallets |
|------|--------|----------|---------|
| **awards.csv** | 49 | 85-90 | 24 |
| **awards (2).csv** | 49 | 75-85 | 20 |
| **awards (3).csv** | 47 | 74-79 | 28 |
| **TOTAL** | 148 | 74-90 (17 meetings) | 42 unique |

### On-Chain Contracts

| Contract | Type | Holders | Supply |
|----------|------|---------|--------|
| OG Respect | ERC-20 | 122 | 38,484 ZAO |
| ZOR Respect | ERC-1155 | 4 (contract-level) | Per-token tracking |
| OREC | Executive | — | 175 transactions |

## What Each "0" Means in the Airtable

In the Respect CSV, from Fractal 74 onward, members show "0" for fractal Respect but still show "10" for video. This means:
- **0 in Fractal column** = "score is on-chain via ORDAO, not tracked here"
- **10 in Video column** = "camera was on" (still tracked in Airtable, not on-chain)
- **Empty** = "did not attend"

## Contribution Types and Their Sources

| Type | Points | Source | On-Chain? |
|------|--------|--------|-----------|
| Fractal Respect (OG era) | 5-55 per rank | Airtable | Yes (ERC-20, manually distributed) |
| Fractal Respect (ORDAO era) | 10-110 per rank | awards.csv / OREC | Yes (ERC-1155, auto via ORDAO) |
| Video participation | 10 per meeting | Airtable | No |
| Discord intro | 10 | Airtable (Misc) | Distributed as OG ERC-20 |
| Charmverse intro | 25 | Airtable (Misc) | Distributed as OG ERC-20 |
| ZAO Form | 5 | Airtable (Misc) | Distributed as OG ERC-20 |
| Website artist listing | 50 | Airtable (Misc) | Distributed as OG ERC-20 |
| Newsletter writing | varies | Airtable (Misc) | Distributed as OG ERC-20 |
| Fractal hosting | 10-40 per session | Airtable (Hosts) | Distributed as OG ERC-20 |
| Fractalgram certification | varies | Airtable (Hosts) | Distributed as OG ERC-20 |
| ZAO-PALOOZA attendance | 250 | Airtable (Festivals) | Distributed as OG ERC-20 |
| ZAO-CHELLA attendance | 250 | Airtable (Festivals) | Distributed as OG ERC-20 |
| Proposal rewards | 100-500 | Airtable (Misc) | Distributed as OG ERC-20 |

## Top Members (Combined)

| Rank | Name | Total | Fractal (OG) | Fractal (ORDAO est.) | Other |
|------|------|-------|-------------|---------------------|-------|
| 1 | Zaal | 3,558 | 2,103 (OG era) | ~300+ (ORDAO) | 1,455 |
| 2 | Attabotty | 3,079 | 1,669 | ~400+ | 1,410 |
| 3 | Hurric4n3ike | 2,740 | 2,130 | ~200+ | 610 |
| 4 | Prizem | 2,550 | 2,040 | ~300+ | 510 |
| 5 | EZinCrypto | 2,402 | 2,072 | ~200+ | 330 |

## Import Plan for Supabase

### Step 1: Import Summary CSV -> `respect_members`
- 173 members with wallets, totals, category breakdowns
- Set `total_respect` = Total Points from Summary
- Set `fractal_respect` = SUM of Fractals (OG era only)
- Set `onchain_og` = actual ZAO onchain column

### Step 2: Import Respect CSV -> `fractal_scores` + `fractal_sessions`
- Create sessions for Fractals 1-73.2
- Parse per-member scores into `fractal_scores` rows
- Skip "0" entries (ORDAO era) and empty entries (absent)

### Step 3: Import awards.csv -> `fractal_scores` + `fractal_sessions`
- Create sessions for Meetings 74-90
- Map wallet addresses to member names via Wallet Data CSV
- Each award = one `fractal_scores` row with rank (level) and score (denomination)

### Step 4: Cross-reference on-chain
- Read OG ERC-20 balances via multicall (already built)
- Read ZOR ERC-1155 balances via multicall (already built)
- Compare with CSV totals to find discrepancies

### Step 5: Going forward
- New fractal results come from bot webhook OR direct OREC contract reads
- Video participation could be tracked in ZAO OS (camera-on detection)
- OG Respect distributions (intros, articles) could be done from admin panel

## Sources

- `csv import/` directory (6 Airtable export CSVs)
- `~/Downloads/awards.csv`, `awards (2).csv`, `awards (3).csv` (ORDAO on-chain exports)
- Research docs 113, 114 in this library
- Direct context from founder Zaal (March 22, 2026)
