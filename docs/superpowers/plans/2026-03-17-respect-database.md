# Respect Database Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create Supabase tables to store all respect data (replacing Airtable), add API endpoints, sync on-chain balances, and display in the app.

**Architecture:** 4 new Supabase tables. API routes for reading/writing. Admin UI for recording fractals. On-chain sync reads from Optimism.

**Tech Stack:** Supabase, Viem (Optimism reads), Next.js API routes

---

## Task 1: Create Database Tables

**Files:**
- Create: `scripts/create-respect-tables.sql`

- [ ] **Step 1: Write the migration SQL**

Create `scripts/create-respect-tables.sql` with all 4 tables exactly as specified in the design doc at `docs/superpowers/specs/2026-03-17-respect-database-design.md`. Include all indexes and RLS.

- [ ] **Step 2: Run in Supabase SQL Editor**

Copy and paste into Supabase SQL Editor and execute.

- [ ] **Step 3: Commit**

```bash
git add scripts/create-respect-tables.sql
git commit -m "Add respect database tables: members, sessions, scores, events"
```

---

## Task 2: Respect Balance API

**Files:**
- Create: `src/app/api/respect/member/route.ts`
- Modify: `src/app/api/respect/leaderboard/route.ts` (update existing to use new tables)

- [ ] **Step 1: Create member endpoint**

`GET /api/respect/member?wallet=X` or `?fid=X` — returns the member's respect data plus their fractal history:

```typescript
// Query respect_members for the member
// Query fractal_scores joined with fractal_sessions for their history
// Return: member info + array of {session_date, score, rank}
```

Requires session auth.

- [ ] **Step 2: Update leaderboard endpoint**

Modify existing `/api/respect/leaderboard` to query `respect_members` table instead of (or in addition to) the on-chain reads. Return all members sorted by `total_respect DESC`.

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/respect/member/route.ts src/app/api/respect/leaderboard/route.ts
git commit -m "Add respect member API and update leaderboard to use new tables"
```

---

## Task 3: Admin — Record Fractal Session

**Files:**
- Create: `src/app/api/respect/fractal/route.ts`

- [ ] **Step 1: Create fractal recording endpoint**

`POST /api/respect/fractal` — admin only. Accepts:

```typescript
{
  session_date: "2026-03-17",
  name: "ZAO Fractal #95",
  host_name: "Zaal",
  host_wallet: "0x7234...",
  scoring_era: "2x",
  scores: [
    { member_name: "Zaal", wallet_address: "0x7234...", rank: 1, score: 110 },
    { member_name: "Attabotty", wallet_address: "0x7990...", rank: 2, score: 68 },
    // ...
  ]
}
```

The endpoint:
1. Inserts into `fractal_sessions`
2. Inserts each score into `fractal_scores`
3. Updates `respect_members` totals (fractal_respect, total_respect, fractal_count)
4. Updates `first_respect_at` if this is the member's first score
5. If host provided, adds a hosting event to `respect_events`

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/respect/fractal/route.ts
git commit -m "Add admin endpoint to record fractal sessions with scores"
```

---

## Task 4: Admin — Record Respect Event

**Files:**
- Create: `src/app/api/respect/event/route.ts`

- [ ] **Step 1: Create event recording endpoint**

`POST /api/respect/event` — admin only. Accepts:

```typescript
{
  member_name: "Zaal",
  wallet_address: "0x7234...",
  event_type: "bonus",        // introduction, camera, article, hosting, festival, bonus, listing, other
  amount: 500,
  description: "Founding member bonus",
  event_date: "2024-06-01"
}
```

Inserts into `respect_events` and updates `respect_members` totals.

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/respect/event/route.ts
git commit -m "Add admin endpoint to record non-fractal respect events"
```

---

## Task 5: On-Chain Sync

**Files:**
- Create: `src/app/api/respect/sync/route.ts`

- [ ] **Step 1: Create sync endpoint**

`POST /api/respect/sync` — admin only. Reads on-chain balances for all members with wallet addresses and updates `respect_members.onchain_og` and `respect_members.onchain_zor`.

Uses the existing `getRespectLeaderboard()` from `src/lib/respect/leaderboard.ts` or direct Viem reads:

```typescript
// For each member with a wallet_address:
// 1. Read OG balance: ERC-20 balanceOf(wallet) on 0x34cE...6957
// 2. Read ZOR balance: ERC-1155 balanceOf(wallet, 0) on 0x9885...445c
// 3. Update respect_members row
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/respect/sync/route.ts
git commit -m "Add admin endpoint to sync on-chain OG + ZOR balances"
```

---

## Task 6: Seed Data from Airtable Export

**Files:**
- Create: `scripts/seed-respect-data.ts`

- [ ] **Step 1: Create seed script**

A one-time script that takes the Airtable data (CSV or hardcoded) and inserts it into the new tables:

1. Insert all members into `respect_members` with their totals
2. For members with known fractal per-session scores, insert into `fractal_scores`
3. Insert known events (bonuses, hosting, festivals) into `respect_events`
4. Set `first_respect_at` based on earliest known fractal participation

This can be run with `npx tsx scripts/seed-respect-data.ts`.

- [ ] **Step 2: Commit**

```bash
git add scripts/seed-respect-data.ts
git commit -m "Add seed script for importing Airtable respect data"
```

---

## Task 7: Display in App — Update Respect Page

**Files:**
- Modify: `src/app/(auth)/respect/page.tsx`

- [ ] **Step 1: Update leaderboard to show new data**

The existing respect page shows on-chain balances. Update it to also show:
- Total respect (from DB)
- Fractal respect
- Number of fractals attended
- First respect date
- On-chain OG + ZOR balances (synced)

Use the updated `/api/respect/leaderboard` endpoint.

- [ ] **Step 2: Add member detail view**

When clicking a member in the leaderboard, show their fractal history (list of sessions with scores). Use `/api/respect/member?wallet=X`.

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/respect/page.tsx
git commit -m "Update respect page to show DB + on-chain data with fractal history"
```

---

## Verification

- [ ] Tables created in Supabase
- [ ] Seed data imported (member totals match Airtable)
- [ ] `/api/respect/leaderboard` returns all members
- [ ] `/api/respect/member?wallet=0x7234...` returns Zaal's full history
- [ ] `/api/respect/fractal` records a new session (admin only)
- [ ] `/api/respect/sync` pulls on-chain balances
- [ ] Respect page shows combined data
