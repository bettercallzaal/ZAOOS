---
topic: governance
type: guide
status: research-complete
last-validated: 2026-07-13
related-docs: 703, 942, 981, 718, 935, 936, 941, 114, 188
original-query: "What ZAO is building for the Fractal in ZAO OS - own frontend, dashboards, and ORDAO integration. Spec that turns tonight's audit into a durable build plan."
tier: DEEP
---

# 1068 - ZAO Fractal: Build Spec for Own Frontend & ORDAO Integration

> **Goal:** Turn the audit findings (docs 703, 981) into a durable, dependency-ordered build plan. Answer: what exists today in ZAOOS, what gaps block Zaal's intent (own frontend, dashboards, better organization), and the concrete next 12-month spine to own the Fractal end-to-end. Six buckets, each with its real file paths, dependencies, and delivery criteria. PR-only.

---

## Key Decisions (Recommendations First)

| # | Recommendation | Why | Priority | Blocker |
|---|---|---|---|---|
| 1 | **Own the READ layer via direct Optimism multicalls** | ornode (the ORDAO indexer) is down 6+ weeks, blocking analytics. Replace the frapps.xyz→ornode dependency with ZAOOS directly calling Optimism contracts (OREC, Respect1155, OG Respect) via viem multicalls. No rebuild—same math as `src/lib/respect/leaderboard.ts` already does. | HIGH | None—code exists |
| 2 | **Build a Weeks x People Respect heatmap** | First concrete UI piece Zaal mentioned: "dashboards and more, get all the weeks and people really easily visualized how much respect they have." This is the anchor visualization. Feeds the leaderboard, sessions, analytics. | HIGH | Requires Weeks tab design; in-progress as of 2026-07-13 |
| 3 | **Own the WRITE/submission layer via a ZAO UI, not frapps.xyz** | Zaal's core intent: "frapps isn't cutting it." Currently bot submits via manual `zao.frapps.xyz/submitBreakout?...` links OR auto-submit with env var. Replace with a `/fractals/submit` route in ZAOOS + a React component that calls `orclient` or raw OREC function `submitBreakout()` directly from ZAO, not from frapps. | HIGH | Requires orclient integration or direct contract ABI |
| 4 | **Unify bot ↔ app Respect formulas** | Two codebases compute Respect independently (bot's `utils/blockchain.py`, app's `src/lib/respect/voteWeight.ts`). A member sees different weights in Discord vs the web app. Audit, then add a shared contract test (cross-wallet consistency check) to catch drift. | MEDIUM | Pre-req for voting on-chain |
| 5 | **Document Fractal rules + onboarding in-app** | Tanja's May 18 blocker: non-technical members can't explain the Fractal to peers. Ship an in-app "How Fractals Work" guide (sections: Sortition, Presentations, Consensus, Fibonacci, On-Chain Settlement) with examples and real numbers (101 weeks, 156 holders, 72h vote window, etc.). Use verified figures from doc 977. | MEDIUM | Requires Zaal brainstorm on tone/audience |
| 6 | **Archive OG-to-ZOR ledger reconciliation** | Two Respect ledgers exist (OG ERC-20 pre-ORDAO, ZOR ERC-1155 post-ORDAO). No migration formula published. Legacy members are confused. Publish the conversion matrix (block snapshot, formula, holder mapping) so migrations are auditable and future systems don't repeat the split. | LOW | One-time audit + a research doc |

---

## The Six Buckets: What Exists, Gaps, Next Builds

### 1. Dashboards & Visualization — The Read + Present Layer

**What exists today:**

- `src/app/(auth)/fractals/` (7 tabs: FractalsClient.tsx + SessionsTab, AnalyticsTab, FractalLeaderboardTab, ProposalsTab, AboutTab, EventsTab)
- `src/components/governance/LiveFractalDashboard.tsx` — real working SVG/CSS dashboard; hand-rolled (no chart library)
- API routes read from Supabase + on-chain:
  - `GET /api/fractals/sessions` — paginated fractal_sessions (line 13-61, route.ts)
  - `GET /api/fractals/analytics` — aggregate stats (totalRespect, totalFractalRespect, totalOGOnchain, totalZOROnchain, totalSessions, uniqueParticipants, respectCurve) (line 6-127)
  - `GET /api/respect/leaderboard` — fractal_scores + on-chain balances (line 1-104)
- Data source: Supabase tables `fractal_sessions`, `fractal_scores`, `respect_members` (10-min TTL), populated by bot webhooks

**Gaps:**

- **Weeks x People heatmap missing** — Zaal's first ask. Currently scattered across SessionsTab (flat list) + AnalyticsTab (aggregate curve). Need a 2D grid: rows = people (top 20 by total Respect), columns = recent weeks (12-20 back), cells = Respect earned that week. Shows participation + contribution volume at a glance.
- **No historical drill-down** — Sessions view shows paginated list; no way to click a session and see the breakout groups, who was in each group, ranking breakdown, or individual scores.
- **Analytics page is summary only** — Shows totals + curve; no per-person or per-group trends, no "who earned most this quarter," no growth trajectories.
- **Missing "About" context in tabs** — AboutTab exists but is static. No link to "How Fractals Work" guide (recommendation 5).

**Next builds (dependency order):**

1. **Heatmap component** (`src/components/governance/WeeksHeatmap.tsx`, ~300-400 LOC) - render rows × columns grid, fetch `/api/fractals/sessions?range=20weeks`, aggregate by `(wallet, fractal_week)`, color-code by Respect value (0-200 scale, Navy-Gold gradient per ZAOOS palette). Test with 20 real wallets over 16 weeks.
   - **Criteria:** renders in <1s on live data, responsive down to 640px width, shows top 20 participants, scrollable weeks.

2. **Session detail drawer** (add to SessionsTab, ~200 LOC) - `/api/fractals/sessions/{id}` returns full session: `{ groups: [{ members: [{ wallet, discordId, rank, respect }] }], ...}`. Render a modal/drawer showing breakout composition + per-person scores. Tie to on-chain data.
   - **Criteria:** loads in <500ms, shows all participants, links to Etherscan for wallet address.

3. **Person-focused Respect view** (new `/fractals/person/[wallet]` page, ~400 LOC) - shows one member's fractal history: weeks attended, ranks achieved, total Respect, trend line (earning velocity). Fetches from `fractal_scores` grouped by wallet.
   - **Criteria:** shows 52-week trend, compares member to cohort median, shows "next 72h events" if applicable (for recurring Fractals).

**Dependency:** All three depend on ornode being UP or replaced (bucket 2).

---

### 2. Own Read Layer — Replace Dead ornode Dependency

**What exists today:**

- `src/lib/respect/leaderboard.ts` — single source of truth for on-chain Respect reads.
  - `fetchLeaderboard()` (line ~60+) does exactly this:
    - Connect to Optimism via viem (`public.optimism.io`)
    - Multicall: OG `balanceOf(wallet)` on ERC-20 `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`
    - Multicall: ZOR `balanceOf(wallet, 0)` on ERC-1155 `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`
    - Compute Transfer/TransferSingle event logs from block 123349892 to latest
- `src/app/api/respect/leaderboard/route.ts` (line 1-104) — REST wrapper, with 10-min Supabase cache
- OREC contract reads already work (used in proposals voting): `src/app/api/respect/proposals/vote/route.ts`

**Gaps:**

- **ornode.frapps.xyz is DOWN** — the ORDAO backend service (which runs MongoDB + stores full proposal content + indexes on-chain events) has been unreachable for 6+ weeks per doc 703. This blocks:
  - `/api/fractals/analytics` fallback (tries ornode for archive queries if Supabase is stale)
  - Farcaster caster stats lookup (who cast how many times in a session)
  - Proposal metadata reads (title, description, voting power calculations)
- **No local fallback for proposal content** — if ornode is down, we cannot fetch the full proposal (not just the hash). This means:
  - `/api/respect/proposals` endpoint returns cached Supabase data only, stale by up to 10 minutes
  - Voting UI shows "Proposal #123" but not the actual text/choices without going to frapps.xyz
- **Zero observability on ornode status** — no health-check endpoint pinged; we discover the outage only when users report it.

**Next builds (dependency order):**

1. **Audit ornode state + decide: restore or replace** — Is the ornode down permanently or temporarily? Reach out to Tadas (sim31, ORDAO maintainer). Check:
   - DNS resolution for `zao-ornode.frapps.xyz`
   - HTTP health endpoint (if any)
   - Logs on the host (if we have access)
   - Whether the MongoDB is intact or corrupted
   - **Decision point:** if restorable in <2 weeks with low cost, restore. Otherwise, commit to replacing the read layer entirely (see build 2 below).
   - **Criteria:** documented finding in a comment/task issue; Zaal's go/no-go decision.

2. **Replace ORDAO proposal metadata reads with direct on-chain fallback** (`src/lib/proposals/fetch.ts`, ~150 LOC) — if ornode fails, fall back to on-chain-only mode:
   - Fetch OREC contract `proposals[id]` (returns only hash, execution state, vote counts)
   - Fall back to displaying hash + vote UI without full metadata (e.g. "Proposal #123 - Vote to execute")
   - If metadata is critical, surface a link "View on frapps.xyz" instead
   - Add a `src/lib/ornode/health.ts` health-check function that pings ornode and returns boolean; UI uses this to show a warning banner if down.
   - **Criteria:** voting UI works even if ornode is down (graceful degradation); health check passes for a live ornode or returns false within 2s if unreachable.

3. **Implement a Supabase-native proposal store** (optional, Phase 2) — if restoring ornode is not feasible:
   - `supabase` table `proposals` (id, fractal_id, title, description, voting_power_formula, created_at)
   - `/api/proposals/create` writes to Supabase instead of calling orclient
   - Sync metadata bidirectionally: ZAOOS → Supabase → ornode (if available) or stays local (if not)
   - This decouples ZAO from frapps.xyz entirely but is a larger lift (~600 LOC)
   - **Criteria:** proposal creation, voting, and display all use Supabase as source of truth; falls back to on-chain if DB is unavailable.

**Real file paths involved:**
- `src/lib/respect/leaderboard.ts` (30 lines, already done)
- `src/lib/proposals/fetch.ts` (new file, 150 lines)
- `src/lib/ornode/health.ts` (new file, 30 lines)
- `src/app/api/respect/proposals/route.ts` (update to use health check, 50 lines)

**Dependency:** This unblocks bucket 1 (dashboards can now confidently read ORDAO state).

---

### 3. Own Write Layer — Submission UI, Not frapps.xyz Links

**What exists today:**

- Bot auto-submit: `fractalbotapril2026/utils/blockchain.py` calls `submitBreakout(uint256 groupNum, address[] rankedAddresses)` directly if `BOT_PRIVATE_KEY` is set, or posts a manual link to `zao.frapps.xyz/submitBreakout?...` for a human to click.
- `zao.frapps.xyz` is Tadas's ORDAO demo frontend (orfrapps repo) — runs the full GUI, writes directly to OREC.
- **ZAOOS has zero submission UI today.** No route for `/api/fractals/submit` or component for breakout-result submission.

**Gaps:**

- Friction: after a breakout vote finishes, the bot posts a URL. Member must:
  1. Click the link (leaves Discord)
  2. Land on frapps.xyz (unfamiliar domain)
  3. Sign a transaction
  4. Wait for settlement (72h vote + 72h veto)
- No ZAO branding on the submission flow — ORDAO's generic UI, not customized for Zaal's vision
- Responsibility: every submission is a human action (Zaal or the facilitator clicks the link and signs). No way to defer submissions or batch them.

**Next builds (dependency order):**

1. **Submission flow design** (with Zaal brainstorm, ~1h) — Before any code:
   - Should submission be manual (one button in ZAO UI) or automatic (bot sends every session end)?
   - Who can submit? Facilitator only, or any group member?
   - Should there be a 24h draft/review window before on-chain submission?
   - What happens if submission fails (tx reverts)? Auto-retry, manual retry, or escalate to Zaal?
   - **Decision doc: `research/governance/10xx-fractal-submission-ux-design/` (TBD number)**

2. **Breakout submission component** (`src/components/governance/BreakoutSubmit.tsx`, ~400 LOC):
   - Input: `{ groupNum: number, rankedAddresses: string[], respects: [110, 68, 42, 26, 16, 10] }`
   - UI: shows ranked members + Respect values, "Review & Submit" button
   - On submit: calls `/api/fractals/submit` (see build 3)
   - Shows tx hash link + wait-for-settlement UI (72h vote, then 72h veto, then execute)
   - **Criteria:** component renders, validates input via Zod, calls API, shows tx state (pending→confirmed→settled).

3. **Submission API route** (`src/app/api/fractals/submit/route.ts`, ~300 LOC):
   - POST body: `{ groupNum, rankedAddresses }`
   - Validation: Zod schema checks addresses, ranks, order
   - Session check: must be authenticated + either facilitator or admin
   - Calls one of:
     - **Option A (preferred if possible):** `orclient` library's `submitProposal()` function (from `sim31/ordao` libs/orclient) — abstract the on-chain/off-chain split, let it handle OREC + ornode writes
     - **Option B (if orclient unavailable):** Direct contract call via viem: `OREC.write.submitBreakout([groupNum, rankedAddresses])` (ABI in `community.config.ts`)
   - Returns: `{ txHash, settlesAt, ...}`
   - **Criteria:** submits to Optimism OREC, returns valid tx hash, member can track in block explorer.

4. **Admin submission dashboard** (new `/fractals/admin/submissions` page, ~300 LOC, admin-only):
   - Shows pending submissions (in vote window), confirmed (veto window), settled
   - Allows retry on failure, manual veto (if Zaal has veto power), or cancel (if before vote closes)
   - Audit log: who submitted, when, tx hash, group, result
   - **Criteria:** lists all submissions from past 8 weeks, shows state machine, allows admin actions per OREC rules.

**Real file paths involved:**
- `src/components/governance/BreakoutSubmit.tsx` (new, 400 lines)
- `src/app/api/fractals/submit/route.ts` (new, 300 lines)
- `src/app/(auth)/fractals/AdminSubmissionsTab.tsx` (new, 300 lines)
- `community.config.ts` (update: add OREC contract ABI + selector for `submitBreakout`)

**Dependency:** Requires bucket 2 (ornode decision/fallback) to be clear; orclient may or may not be available. No blocker for starting design.

---

### 4. Voting System Direction — Consensus Ranking vs Elimination

**What exists today:**

- Discord bot implements **elimination voting** (`fractalbotapril2026/cogs/fractal/group.py`, line 407-411): one colored button per remaining candidate, vote per level (6 down to 1), majority threshold `max(1, n//2 + n%2)`, ties broken by random draw. Functionally equivalent to consensus ranking but mechanical, not open-ended negotiation.
- Whitepaper (718b) prose describes "collaborative consensus ranking," which reads more free-form than the bot actually implements.
- Doc 981 (section 4, gap analysis #2) flags: **"the bot's elimination voting is functionally equivalent to collaborative consensus ranking but is a harder, mechanical vote-per-level rather than open-ended negotiation."**

**Gaps:**

- No public documentation of **how consensus ranking actually works in ZAO practice**. New members (like Tanja) don't understand if it's a vote, a discussion, or a consensus-building ritual.
- Whitepaper (Ch 5) will describe ZAO's mechanism as current architecture (Ch 5/6) but does not yet explain the elimination-voting implementation.
- No evidence that the Fibonacci curve + elimination voting actually preserves honest signaling (the Nash equilibrium argument in 718b assumes free-form consensus, not mechanical voting). This is more of a research gap than a code gap, but it affects the story told to new members.

**Next builds (dependency order):**

1. **Document the actual mechanism in code** (`src/app/(auth)/fractals/AboutTab.tsx`, add section, ~150 LOC):
   - Add a "How We Vote" subsection showing:
     - 6-person group → sortition randomization
     - Presentations (4 min each, ordered by timer)
     - **Consensus ranking via elimination:** "Each round, we vote (1 person = 1 vote) on who should rank highest among the remaining candidates. Majority wins. If tied, random draw breaks it."
     - Fibonacci reward table (110, 68, 42, 26, 16, 10) and explain the golden ratio (each level absorbs disagreement about exact effort while still rewarding order)
     - Real example: show a 6-person group, 3 rounds, outcome
   - Link to whitepaper Ch 5 for the theory (once written)

2. **Validate elimination voting's incentive structure** (research doc, ~2000 words):
   - Question: does elimination voting (majority per level, random tie-break) preserve honest signaling the way 718b's consensus-ranking sketch claims?
   - Approach: game-theory model (3-player game, 6 levels, compute Nash equilibrium for honest vs collusive strategies)
   - Outcome: either "yes, equivalent for ZAO's case" or "no, here's the drift and why it's acceptable" or "here's a tweak to the tie-break rule that preserves honesty better"
   - **File:** `research/governance/10xx-fractal-voting-incentives/` (TBD number)
   - **Criteria:** model is sound, result is documented, decision is made: ship as-is or tweak tie-break rule.

3. **(Optional, Phase 2) Consensus-ranking UI mode** (if Zaal prefers free-form discussion):
   - Add a `/admin/voting-mode` toggle: `elimination` (current) or `consensus` (new)
   - Consensus mode: bot doesn't take votes; instead, posts a 15-min timer, members discuss + build consensus in voice, then bot asks "agree on this ranking?" + one affirm/reject vote (super-majority to confirm)
   - Requires Discord thread UI for discussion + new state machine in bot (not in ZAOOS)
   - **Criteria:** toggleable mode, works in practice for 3-4 sessions, members report preference.

**Real file paths involved:**
- `src/app/(auth)/fractals/AboutTab.tsx` (update, 150 lines)
- `research/governance/10xx-fractal-voting-incentives/` (new research doc, TBD)
- (Optional) bot cog update for consensus mode

**Dependency:** Mostly standalone; informs the whitepaper (942) but doesn't block other builds.

---

### 5. Rules & Onboarding Organization — In-App Documentation

**What exists today:**

- `src/app/(auth)/fractals/AboutTab.tsx` — static "About" page with contract addresses, Fibonacci table, channel links
- `community.config.ts` — has channel description: "Fractal Call, Monday 6pm EST weekly fractal"
- Fractally whitepaper (718) + Fractal book (doc 675 transcript) exist but are external to the app

**Gaps:**

- No **"How Fractals Work" guide in-app** — new members cannot learn the system without reading external docs or asking Discord
- Tanja's May 18 feedback (doc 703): "non-technical members cannot explain the fractal to peers" — structural onboarding failure
- Terms like "sortition," "Fibonacci," "OREC," "consensus ranking," "Respect" are unexplained
- No "first-timer checklist": connect wallet, join Discord, watch 3-minute video, attend one session, understand the payout

**Next builds (dependency order):**

1. **"How Fractals Work" guide component** (`src/components/governance/FractalGuide.tsx`, ~800 LOC, reusable):
   - Sections:
     - **Sortition (random grouping):** explain why (rational ignorance, small-group optimization); show a 6-person group example
     - **Presentations (4 min each):** explain what counts (code, mentorship, research, music, facilitation); show examples
     - **Consensus Ranking (elimination voting):** how voting works, majority threshold, tie-break
     - **Fibonacci Rewards:** why golden ratio, what each rank means (110 = "major contributor," 10 = "participated")
     - **On-Chain Settlement:** OREC 72h vote + veto, ZOR minting, Respect accumulation
   - Tone: manifesto-like (passionate) + precision (numbers) per doc 942 Ch 5 voice
   - Real numbers from doc 977: 101 weeks, 156 holders, 72h vote window, 1,000 Respect threshold
   - Interactive: expand/collapse sections, real-time video embeds (once Fractal 101 video ships, build 4)

2. **First-timer checklist modal** (`src/components/governance/FirstTimerChecklist.tsx`, ~300 LOC):
   - Shows when user opens `/fractals` for the first time (checked via Supabase `users.fractal_onboarded` flag)
   - Checklist:
     - [ ] Connect your wallet
     - [ ] Join the ZAO Discord (#fractal-call)
     - [ ] Read "How Fractals Work" (link to component above)
     - [ ] Attend one live session (Monday 6pm EST)
     - [ ] Review your first ranking & Respect earned
   - Links to Discord, video guide, session schedule
   - "Skip for now" + "Mark complete" buttons

3. **Fractal 101 video script** (`research/governance/1069-fractal-101-video-script/`, ~3000 words):
   - Screenplay format, 5-7 minutes total
   - Narrator: Zaal (build-in-public voice)
   - Visuals: animation (breakout groups forming), real session clips (if available), Fibonacci curve, OREC settlement flow
   - Segments:
     - 0:00-1:00 "Why small groups beat big votes"
     - 1:00-2:30 "The ZAO Fractal: presentations & ranking"
     - 2:30-4:00 "Fibonacci rewards & on-chain settlement"
     - 4:00-5:30 "You're now a Respect holder"
   - Numbers: 101 weeks, 156 holders, 72h settlement
   - **Criteria:** script is factually accurate (checked against docs 703, 977, 981), approved by Zaal, ready for video production with e.g. Remotion or manual post-production.

4. **FAQ page** (`src/app/(auth)/fractals/FAQTab.tsx`, ~400 LOC):
   - Q: "What is Respect?" A: soulbound governance token, non-transferrable, accumulates from fractal participation
   - Q: "Can I buy Respect?" A: No. You earn it by contributing + placing high in fractals.
   - Q: "What happens if I miss a session?" A: Sortition is weekly; join the next one.
   - Q: "Is this a token?" A: Yes, ZOR (ERC-1155 on Optimism), non-transferrable.
   - Q: "How do I vote?" A: Attend a fractal session, join a breakout group, participate in consensus ranking.
   - Q: "What's OREC?" A: Optimistic Respect Executive Contract; it settles fractal rankings on-chain after 72h vote + 72h veto.
   - Link each Q to external docs (whitepaper, OREC specs, etc.)

**Real file paths involved:**
- `src/components/governance/FractalGuide.tsx` (new, 800 lines)
- `src/components/governance/FirstTimerChecklist.tsx` (new, 300 lines)
- `src/app/(auth)/fractals/FAQTab.tsx` (new, 400 lines)
- `research/governance/1069-fractal-101-video-script/` (new research doc)

**Dependency:** Mostly standalone; improves onboarding immediately once shipped, but does not block other buckets.

---

### 6. Data Integrity — Respect Formula Parity, Civil Wallet, Reconciliation

**What exists today:**

- Canonical Respect formula: `src/lib/respect/voteWeight.ts`, `computeRespectWeight(og, zor)` — OG (ERC-20, formatEther) + ZOR (ERC-1155, integer), sum rounded, never writes zero on failed read.
- Bot formula: `fractalbotapril2026/utils/blockchain.py`, independent `eth_call` for both balances, summed locally.
- Supabase tables:
  - `respect_members` (10-min TTL cache of leaderboard + on-chain balances)
  - `fractal_scores` (per-session scores, populated by bot webhooks)
- Two OG/ZOR eras (pre-ORDAO ERC-20, post-ORDAO ERC-1155), no reconciliation published.

**Gaps (from doc 981, section 4-5):**

- **Respect formula drift:** bot's `blockchain.py` was not line-by-line verified to match `voteWeight.ts`. Different language (Python vs TypeScript), different read paths (raw `eth_call` vs viem multicall). Unknown drift on:
  - Rounding behavior (bot uses Python `round()`, app uses JavaScript `Math.round()` — same? maybe not on all platforms)
  - Failure handling (bot unclear if it catches failed reads as 0 or propagates the error)
  - Decimal conversion (bot uses raw integer for ZOR, app also does; but OG formatEther — both agree?)
  - **Impact:** Member's Discord-displayed Respect (via bot `/leaderboard`) and web-app Respect (via `/api/respect/leaderboard`) disagree.

- **Civil wallet fix pending** — Doc 981 section 7, todo #3: "Civil wallet fix + verify ordao state." Exact wallet unknown, issue location unclear (ZAOOS app or on-chain state).

- **OG-to-ZOR ledger unconciled** — Two Respect ledgers (122 OG holders, 4 ZOR holders, 21 overlap). No migration formula or conversion matrix published. When ZAO moves to all-ZOR governance, legacy members won't know their old OG is "worth" in new currency.

**Next builds (dependency order):**

1. **Audit Respect formula parity** (`src/lib/respect/__tests__/voteWeight.parity.test.ts`, ~200 LOC + one bot PR):
   - Create a list of 10 real wallets with known on-chain balances (sample from top OG holders, top ZOR holders, and bot admins)
   - For each wallet: compute Respect via both `voteWeight.ts` and bot's `blockchain.py`
   - Compare results: weight must match exactly, failure signals must match
   - Run as a Vitest test suite; add to pre-merge checks
   - If any mismatch: file a PR to bot repo with the fix (e.g. change rounding, catch-propagate errors, etc.)
   - **Criteria:** all 10 wallets match exactly; test is green; bot PR is merged or filed with detailed findings.

2. **Civil wallet fix** (depends on identifying the wallet first):
   - Query Zaal: "What is the Civil wallet issue?" (unclear from docs)
   - Likely scenarios:
     - Wallet has zero Respect but should have non-zero (data corruption, migration bug)
     - Wallet is out-of-sync between on-chain + Supabase (cache staleness)
     - Wallet was merged/renamed but old ID still exists (dupe in DB)
   - Fix: likely one-time correction in `src/app/api/admin/respect-import/route.ts` or on-chain via a bot submission
   - **Criteria:** Civil wallet Respect is correct in both on-chain + Supabase; verified by Zaal.

3. **OG-to-ZOR reconciliation archive** (`research/governance/10xx-respect-ledger-reconciliation/`, ~3000 words):
   - Snapshot both contracts at block N (e.g. block where ORDAO was deployed)
   - Compute OG supply, ZOR supply, holders overlap
   - Propose a conversion formula: `ZOR_migration = OG_balance * (total_ZOR_supply / total_OG_supply)` or similar, justified
   - Publish the mapping: `[{ ogWallet, ogBalance, mirrorZORAllocation }, ...]`
   - Explain why the split happened (ORDAO was post-fractal governance decision, OG was historical one-off distributions)
   - **Criteria:** formula is mathematically sound, mapping is published, all legacy holders know their conversion, future migrations reference this as precedent.

4. **Continuous parity testing** (ongoing, no new file):
   - Add bot formula to Supabase schema: `respect_members.bot_computed_weight` (populated by a new `/api/admin/test-bot-parity` route)
   - Quarterly audit: compare app-computed vs bot-computed for the top 50 wallets, flag any drift >1%
   - Alert: if drift appears, surface in a Telegram task to Zaal for investigation
   - **Criteria:** no drift >1%; quarterly audit completes; any drift is captured + fixed within 1 week.

**Real file paths involved:**
- `src/lib/respect/__tests__/voteWeight.parity.test.ts` (new, 200 lines)
- `src/app/api/admin/respect-import/route.ts` (update for Civil wallet fix, ~50 lines)
- `research/governance/10xx-respect-ledger-reconciliation/` (new research doc)
- `src/app/api/admin/test-bot-parity/route.ts` (new, 150 lines, optional Phase 2)

**Dependency:** Mostly standalone audits; no blocker for other buckets, but required before any on-chain voting changes.

---

## Dependency-Ordered Spine: "ZAO Owns Its Fractal"

**Month 1 (July 2026): Foundation**

1. Decide on ornode (audit, restore, or replace) — **Blocker for dashboards**
2. Audit Respect formula parity — **Blocker for on-chain voting changes**
3. Brainstorm submission UX flow (with Zaal) — **Blocker for bucket 3 builds**
4. Fractal 101 video script + approval — **Blocker for onboarding (bucket 5)**

**Month 2-3 (Aug-Sep 2026): Read & Viz Layer**

5. Implement heatmap, session detail, person view (bucket 1)
6. Deploy fallback ornode health check + on-chain-only proposal reads (bucket 2)
7. First-timer checklist + How Fractals Work guide (bucket 5)

**Month 3-4 (Sep-Oct 2026): Write Layer**

8. Build BreakoutSubmit component + /api/fractals/submit route (bucket 3)
9. Admin submissions dashboard
10. Integrate orclient or direct OREC calls; test with 3 real sessions

**Ongoing (Month 1-12): Quality**

11. Validate voting mechanism (bucket 4, game-theory analysis)
12. OG-to-ZOR reconciliation archive (bucket 6)
13. Continuous parity testing (bucket 6, Phase 2)
14. FAQ + interactive guide refinement based on Tanja + new member feedback

---

## What Stays on frapps.xyz vs What ZAO Takes Over

| Layer | Today | After This Build |
|-------|-------|---|
| **Proposal viewing** | frapps.xyz (ORDAO GUI) | ZAO `/fractals/proposals` (metadata from Supabase or fallback ornode) |
| **Voting** | frapps.xyz or Discord bot | ZAO `/fractals/proposals/[id]/vote` (calls OREC via orclient or direct viem) |
| **Breakout submission** | Manual link to frapps.xyz | ZAO `/fractals/submit` (BreakoutSubmit component) |
| **Leaderboard** | Discord bot `/leaderboard` + frapps.xyz | ZAO `/fractals/leaderboard` (live, authoritative) |
| **Session history** | Bot webhooks → Supabase → ZAO API | ZAO `/fractals/sessions` (authoritative) |
| **Respect earnings** | On-chain balances | ZAO `/api/respect/leaderboard` (authoritative) |
| **On-chain settlement** | OREC (Optimism), ORDAO infrastructure | OREC (Optimism), ORDAO infrastructure (unchanged) |

---

## On-Chain Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Broken submission (tx reverts) | Add try/catch + human-readable error message + link to support; retry with higher gas; never auto-spam retries |
| Double-submission (same group, twice) | Check on-chain: `OREC.proposals[hash]` exists before allowing re-submit; UI shows "Already submitted, vote ends {date}" |
| Signer compromise (if using bot hot wallet) | Use environment variable for `BOT_PRIVATE_KEY`; rotate quarterly; keep balance low (<10 USDC); option to use cold signer with manual approval instead |
| Member submits invalid addresses | Zod validation: check all are 42-char 0x-prefixed, deduplicate, reject if not 6 addresses; on-chain reverts if not ERC1155 holders |
| OREC contract bug (new/unknown) | Only submit after Tadas/Optimism governance reviews the deployment; monitor for external exploits; have a cancel-submission procedure in case contract is paused |

---

## Sources & References

1. **Doc 703** - ZAO Fractal Current State (May 2026) — infrastructure matrix, operational issues [FULL]
2. **Doc 942** - ZAO Fractal Whitepaper Outline v2 — chapter map, Respect no-decay verification, decisions for drafting [FULL]
3. **Doc 981** - ZAO Fractal x Discord Bot Synthesis — live bot architecture, verified numbers, gap analysis [FULL]
4. **Doc 114** - ZAO Fractal Live Infrastructure (March 2026) — OREC status, bot v2.1, Supabase schema [FULL]
5. **Doc 188** - ZAO Fractal Bot Process — bot spec (outdated for v2.1, marked for re-validation) [PARTIAL]
6. **Doc 977** - Fix Fractals Documentation — corrected numbers, stale figures audit [FULL]
7. **ORDAO Repository** (sim31/ordao) — architecture, orclient library, OREC whitepaper docs [FULL]
8. **ZAOOS Codebase** — `/src/app/(auth)/fractals/`, `/src/app/api/fractals/*`, `/src/lib/respect/voteWeight.ts` [FULL]
9. **fractalbotapril2026 Repository** — bot structure, blockchain.py formula, webhook integration [FULL]
10. **Fractal Whitepaper (718)** — theory, Nash equilibrium, Fibonacci incentives [FULL]

---

## Key Decisions Awaiting Zaal

| Decision | What It Affects | Recommend | Options |
|---|---|---|---|
| Restore ornode or replace? | Bucket 2 (read layer) | Replace with Supabase-native store (less dependent on frapps.xyz) | Restore (if Tadas can, cost <$500, 2 weeks), Replace (self-hosted Supabase, 4 weeks, owned) |
| Submission UX: manual or automatic? | Bucket 3 (write layer) | Manual + bot notification (gives facilitator control, lower automation risk) | Manual (default), Automatic (on session end), Hybrid (configurable per session) |
| Voting mode: elimination or consensus? | Bucket 4 (voting system) | Keep elimination (simplicity, proven), research consensus mode for Phase 2 | Elimination (current), Consensus (new, requires bot changes), Hybrid (toggle per session) |
| Onboarding tone: manifesto or academic? | Bucket 5 (documentation) | Manifesto (build-in-public voice, Zaal's style, matches 718 Ch 1-3) | Manifesto (inspiring), Academic (rigorous), Mixed (manifesto for vision, precision for mechanics) |
| OG-to-ZOR conversion rate? | Bucket 6 (reconciliation) | Linear (OG balance × ratio of total supplies) | Linear, Logarithmic (top holders less), Custom (Zaal's call) |

---

## Next Actions (First 30 Days)

| Action | Owner | Type | By When | Criteria |
|---|---|---|---|---|
| Audit ornode status + decide restore/replace | @Zaal + @Claude | Decision | 2026-07-20 | Decision documented in task; Zaal's call logged |
| Brainstorm submission UX (manual/auto/hybrid, who submits, draft window?) | @Zaal + @Claude | Brainstorm | 2026-07-20 | Design doc created (1068a subfile or new 10xx); sketches approved |
| Audit Respect formula parity (app vs bot, 10 wallets) | @Claude | Verification | 2026-07-27 | Test suite green; any drift documented + bot PR filed if needed |
| Fractal 101 video script draft | @Claude | Writing | 2026-07-27 | 5-7 min script, 3000 words, factually accurate, approved by Zaal |
| Fix Civil wallet (identify issue, apply fix, verify) | @Zaal + @Claude | Bug fix | 2026-07-27 | Wallet Respect correct on-chain + in DB; verified by Zaal |
| Heatmap component (design + first build) | @Claude | Feature | 2026-08-10 | Component renders, fetches real data, scrollable, responsive |
| Ornode fallback (health check + on-chain reads) | @Claude | Feature | 2026-08-10 | Voting UI works if ornode down; health check returns false in <2s if unreachable |
| BreakoutSubmit component + /api/fractals/submit | @Claude | Feature | 2026-08-31 | Component validates input, calls API, shows tx state, returns valid tx hash |
| OG-to-ZOR reconciliation doc | @Claude | Research | 2026-09-15 | Mapping published, conversion formula explained, all legacy holders informed |

---

## Success Metrics (by end of 2026-12-31)

- **Read layer:** `/fractals` dashboard is the authoritative Fractal UI; ornode is optional (graceful fallback); zero "ornode down" outages affect ZAO members
- **Write layer:** Members submit breakout results via ZAO UI, not frapps.xyz; 100% of submissions tracked in ZAO, zero friction from domain changes
- **Respect parity:** App-computed and bot-computed Respect agree within <1% for all members; quarterly audit confirms
- **Onboarding:** New members (like Tanja) can explain Fractals to peers; FAQ + guide in-app; zero "how do I participate?" support tickets
- **Data integrity:** Civil wallet issue is resolved; OG-to-ZOR ledger is reconciled and published; migration formula is auditable
- **Governance velocity:** Submission feedback loop is <10 minutes (was 24h via manual links); no txn failures due to UX friction

---

## Epilogue: Why This Matters

Zaal's intent tonight was simple: "frapps isn't cutting it." This doc operationalizes what that means:

1. **ZAO's governance should live in ZAO**, not delegated to Tadas's ORDAO demo.
2. **New members should understand Fractals in 5 minutes**, not hunt for docs across frapps/Discord/GitHub.
3. **The fractal is the ritual; the tech is invisible.** Members submit results, Respect accrues, on-chain settlement is automatic. No friction, no external domains, no "click here to leave Discord."

This build spec breaks the work into six autonomous buckets, each with clear code paths, dependencies, and shipping criteria. It's the bridge from "we need dashboards" to "here's how to own the Fractal end-to-end by year-end."

---

## Metadata

| Attribute | Value |
|---|---|
| Doc Number | 1068 |
| Status | Research Complete, Ready for Planning |
| Date Created | 2026-07-13 |
| Date Last Updated | 2026-07-13 |
| Audience | Zaal + engineering (Iman, future builders) |
| Scope | 6 months → 12 months (July-Dec 2026 + into Q1 2027) |
| Cost estimate | 200-300 engineering hours + design time |
| Risk | Medium (OREC contract security is external; orclient availability uncertain) |
| Confidence | HIGH on architecture, MEDIUM on exact timelines (blockers on Tadas/ORDAO infra response) |
