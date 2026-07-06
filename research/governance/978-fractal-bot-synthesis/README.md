---
topic: governance
type: synthesis
status: research-complete
last-validated: 2026-07-06
superseded-by:
related-docs: 718, 188, 703, 114, 102, 696, 702, 705, 498, 975, 977
original-query: "Synthesize everything about the ZAO Fractal into the Discord bot - unify the whitepaper foundations, the bot-process spec, the verified on-chain state, and the actual live bot code (fractalbotapril2026) into one picture, then build a prioritized todo list"
tier: STANDARD
---

# 978 - ZAO Fractal x Discord Bot: Full Synthesis

> **Goal:** One document that a future engineer opens instead of six bot repos and twenty research docs. Covers what the Fractal is, how the weekly game is supposed to run, how `fractalbotapril2026` (the live bot, cloned 2026-07-06) actually implements it, where the two diverge, and what to build next. Every number is grounded in [Doc 975](../975-zao-respect-live-numbers/) / [Doc 977](../977-fix-fractals-documentation/) - do not reuse older modeled figures from 718c/696/705.

## 1. What the ZAO Fractal is

The ZAO Fractal is a weekly peer-governed consensus ritual, built on Dan Larimer's "Fractally" theory of fractal democracy (*More Equal Animals*, 2021): large-group voting fails from rational ignorance (one vote barely matters, so no one bothers to get informed) and token-weighted voting recreates plutocracy. The fix is small-group sortition - random weekly reshuffling into 3-6 person groups where each vote is 1/3 to 1/6 of the outcome and reputation is immediately on the line.

ZAO operationalizes this weekly in Discord: breakout groups, a timed contribution pitch per member, collaborative consensus ranking on a Fibonacci point curve, and soulbound on-chain Respect tokens that track governance weight. It has run unbroken for **~101 weeks since 2024-07-30** - the longest-running fractal in the ecosystem and the only one still active on Optimism (Eden Fractal moved EOS->Base 2025; Optimism Fractal paused Jan 2026). Theory: [718a](../718-zao-fractal-whitepaper-foundations/), distinctness: [718g](../718-zao-fractal-whitepaper-foundations/).

## 2. The weekly game loop (spec vs mechanism)

1. **Gathering** - members join the "Fractal Waiting Room" Discord voice channel, any time before the session.
2. **Randomization** - `/randomize` splits everyone present into 3-6 person groups and auto-moves them into numbered breakout voice channels (`fractal-1`, `fractal-2`, ...).
3. **Presentations** - each member gets ~4 minutes to describe what they contributed that week (code, mentorship, research, music, event facilitation). `/timer` runs the countdown with a speaker queue.
4. **Consensus ranking** - the group elects who is elected to level 6, then 5, then down to 1. In the bot's implementation this is done as *elimination voting* (see below), not free-form consensus - see the gap flagged in section 4.
5. **Fibonacci Respect distribution** - `RESPECT_POINTS = [110, 68, 42, 26, 16, 10]` for ranks 1-6 (2x Fibonacci scale). 272 points minted per group per week. The golden-ratio gap between consecutive ranks is deliberate: it absorbs disagreement about exact effort while still rewarding order.
6. **On-chain submission** - ranked wallets get submitted to OREC on Optimism (either an auto-submit tx from a bot hot wallet, or a `zao.frapps.xyz/submitBreakout?...` link the group clicks and signs). OREC opens a 72h vote window, then a 72h veto window, then executes and mints ZOR to the ranked members.

Mechanism detail (Nash-equilibrium argument for honest ranking, sybil-resistance stack, 2%/week Respect decay -> 34-week half-life): [718b](../718-zao-fractal-whitepaper-foundations/). Bot-process spec: [188](../188-zao-fractal-bot-process/).

## 3. How `fractalbotapril2026` actually implements this (live code, cloned 2026-07-06)

Stack: Python, `discord.py` 2.0+, no web3.py (raw JSON-RPC `eth_call` + `eth_account` for signing). ~9,200 lines across `main.py` + 11 cogs + 1 subpackage. **48 slash commands** (18 user-facing, 30 admin).

- **Entry point** `main.py`: loads env, sets up voice/opus, dedupes interactions via an LRU cache, clears stale guild command registrations and syncs globally once (this was a real bug in march2026 - duplicate command messages from stale guild+global registration; fixed and still guarded against in april2026), auto-links wallets by name match and Farcaster identity on startup, runs a health-check HTTP server, and does daily JSON backups (30-day retention).
- **Core game engine**: `cogs/fractal/cog.py` (`/randomize` at lines 220-361, `/zaofractal` at lines 73-206) and `cogs/fractal/group.py` (the `FractalGroup` state machine - `start_new_round()` at 172-184, vote processing at 360+, winner threshold `max(1, n//2 + n%2)` at line 204, `end_fractal()` scoring at 428-598, on-chain submission at 599-749).
- **Voting mechanism as coded**: this is **elimination voting**, not free-form consensus. The bot posts one colored button per remaining candidate; the group votes level 6 down to level 1; a candidate wins a level once they clear the majority threshold; ties broken by random draw (lines 407-411). This is functionally equivalent to the "collaborative consensus ranking" in the theory docs but is a harder, mechanical vote-per-level rather than open-ended negotiation - worth flagging in the whitepaper as "how ZAO implements consensus ranking in practice," since 718b's prose reads as more free-form than the bot actually is.
- **Respect scoring**: exactly `[110, 68, 42, 26, 16, 10]` indexed by finish order, matching the theory doc's Fibonacci table precisely.
- **Persistence**: primarily flat JSON in `data/` (`wallets.json`, `history.json`, `intros.json`, `proposals.json`, `names_to_wallets.json`, `events.json`), all written atomically (temp file + `os.replace`) via `utils/safe_json.py`. Wallet registration additionally writes to a Supabase `users` table. Completed fractal results are also POSTed via webhook (`utils/web_integration.py` -> `WEB_WEBHOOK_URL`) with event types `fractal_started`, `vote_cast`, `round_complete`, `fractal_complete`, `fractal_paused`, `fractal_resumed` - the receiving web app is what writes to the `fractal_sessions`/`fractal_scores`/`respect_members` Supabase tables (see section 5).
- **On-chain submission**: `utils/blockchain.py` builds and signs `submitBreakout(uint256 groupNum, address[] rankedAddresses)` (selector `0xa2be0d05`) against the ORDAO/OREC contract. If `BOT_PRIVATE_KEY` is set, the bot auto-submits; otherwise it posts a manual `zao.frapps.xyz/submitBreakout?...` link for a human to sign.
- **Respect is read-only in the bot**: OG (ERC-20, `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`) and ZOR (ERC-1155, `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`, token ID 0) are queried via raw `eth_call`, never written directly - only `submitBreakout` writes anything, and that mints via OREC's own execution, not the bot.
- **Other systems bundled in**: wallet/ENS registration (`cogs/wallet.py`), Respect-weighted proposal voting with 7-day auto-expiry (`cogs/proposals.py`), Hats Protocol role sync (`cogs/hats.py`), fractal history/leaderboard (`cogs/history.py`), a presentation timer with a rich reaction/queue UI (`cogs/timer.py`), and a bundled Next.js dashboard under `web/` (own `vercel.json`, historically Neon Postgres + Drizzle in earlier versions - deploy status not verified in this pass, see gap below).

### Lineage (why it looks like this)

`v1old` (Dec 2025, 3 commands, in-memory only, Discord only) -> `nov2025` (+Next.js/Vercel dashboard, Neon Postgres, 15 admin commands) -> `dec2025` (+voice speaking rounds, later merged into the timer) -> `feb2026` ("eth Boulder" event build - the real inflection point: wallet system, on-chain Respect queries, proposals, Hats, history, 48 commands, JSON persistence) -> `march2026` (Supabase-first persistence, auto-submit on-chain flow, Snapshot integration, `/randomize` room orchestration, the duplicate-command-registration bugfix) -> `april2026` (current live bot, incremental hardening on top of march2026).

Dead ends worth knowing so they aren't reinvented: modal-based group setup (caused "Unknown Interaction" errors, replaced by inline buttons), a standalone `/fractaltimer` separate from voting (merged into one flow), and a hybrid JSON+Postgres split (replaced by Supabase-as-source-of-truth, with JSON demoted to cache/fallback).

## 4. Gap analysis: docs vs live bot vs on-chain truth

Three things were compared in this pass and they do not fully agree - flagging all of it rather than picking one:

1. **Doc 188 (bot-process spec) describes `fractalbotmarch2026`, not `fractalbotapril2026`.** It states 52 commands and Supabase as the sole source of truth for game state. The live april2026 code found in this pass has 48 commands and still treats `data/*.json` as the primary store for fractal history/proposals/intros, with Supabase used for wallet registration and as the target of the web-app-side sync (section 5). **Action: doc 188 should be re-validated against april2026, or explicitly marked as describing march2026 with an april2026 addendum.**
2. **Doc 703 ("current state, May 2026") says the Vercel dashboard is offline/deleted and there is "no public leaderboard UI outside Discord."** But the live april2026 bot repo ships its own `web/` Next.js dashboard with a `vercel.json`. Timeline is plausible (a dashboard could have shipped in April and been taken down by May) but **this needs a live check**: is any Vercel project currently serving `web/` from this bot repo, or is the only surviving Respect UI the one inside the main ZAOOS app (`/respect`, `/fractals` pages, section 5)? Don't assume either way without checking Vercel directly.
3. **Two independent Respect-score formulas exist and were not verified to agree.** The main ZAOOS app's canonical formula (`src/lib/respect/voteWeight.ts`, `computeRespectWeight`) is `Math.round(Number(formatEther(OG_balance)) + Number(ZOR_balance))` - OG converted from 18-decimal wei, ZOR used as a raw integer, summed and rounded - and it explicitly refuses to write a result if either on-chain read fails (never defaults to 0). The bot's `/leaderboard` and Respect-weighted proposal voting compute their own sum via raw `eth_call` in `utils/blockchain.py` without going through `voteWeight.ts` (different language, can't literally share the function) - **it was not verified line-by-line that the bot's arithmetic matches this exactly (rounding, failure handling, decimals).** Any drift here would mean a member's Discord-displayed Respect and web-app Respect disagree. **Action: audit `utils/blockchain.py`'s balance-summing code against `computeRespectWeight` and add a fixed-wallet consistency test (compare bot output vs app output for a handful of known wallets).**
4. **The correction list in [Doc 977](../977-fix-fractals-documentation/) applies to the whitepaper/research docs, not the bot** - the bot code itself doesn't hardcode any of the stale figures (48h, 10% threshold, Gini 0.23, "90+ weeks", "~200 members"). No bot-code fix needed there; this is purely a documentation correction (already tracked in 977).

## 5. How the main ZAOOS web app computes/shows Respect (for the bot to mirror)

Canonical formula, `src/lib/respect/voteWeight.ts`:

```ts
export function computeRespectWeight(og, zor) {
  const ogValue = og.status === 'success' ? Number(formatEther(og.result)) : 0;
  const zorValue = zor.status === 'success' ? Number(zor.result) : 0;
  return {
    weight: Math.round(ogValue + zorValue),
    complete: failed.length === 0, // true only if BOTH reads succeeded
  };
}
```

- On-chain reads: OG `balanceOf(wallet)` on the ERC-20 (18 decimals, Optimism), ZOR `balanceOf(wallet, 0)` on the ERC-1155, batched via viem multicall against `mainnet.optimism.io`.
- Leaderboard total: `totalRespect = max(db_calculated, onchain_og)` where `db_calculated = fractalRespect + hostingRespect + bonusRespect + eventRespect` - this max() exists because OG was originally minted from the same historical Airtable data that also feeds the DB-calculated total, so it avoids double counting while still respecting on-chain holders.
- Data lives in Supabase: `respect_members` (cached leaderboard + on-chain balances, 10 min TTL), `fractal_sessions` / `fractal_scores` (per-session results), `respect_events` (hosting/festival/misc bonuses).
- Two admin-triggered flows populate/refresh this: `/api/respect/sync` (POST, re-pulls on-chain OG/ZOR via multicall, **skips the write entirely if a read fails** so cached values are never clobbered with zero) and `/api/admin/respect-import` (POST, imports 6 Airtable tables, rebuilds `fractal_sessions`/`fractal_scores`, recomputes totals).

**If the bot is ever changed to write its own Respect displays (leaderboard, `/mystats`) from a shared source instead of independent `eth_call`s, this is the formula and the failure-handling contract to match exactly** - particularly "never write a zero on a failed read," which the bot's current raw-`eth_call` path was not confirmed to honor.

## 6. Verified on-chain numbers (2026-07-05 pull, doc 975 - use these, not older docs)

| Metric | Value |
|---|---|
| Unique Respect holders | **156** (122 OG + 55 ZOR, 21 both) - not "~200" |
| OG Respect (ERC-20) supply | 38,484, frozen since Dec 2025 |
| OG distribution Gini | **0.73** cumulative (top 10 holders = 53% of supply) - not "0.23" |
| OREC vote + veto windows | **72h each** (`voteLen`=`vetoLen`=259,200s) - not "48h" |
| OREC proposal threshold | **1,000 Respect (~2.6% of OG supply)** - not "10%" |
| Total OREC proposals ever | 130, from only 4 wallets (94% from one relayer) |
| Weeks unbroken | **~101** since 2024-07-30 - "100+ weeks," not "90+" |
| Contracts | OG `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` (ERC-20) / ZOR `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` (ERC-1155, token ID 0) / OREC executor `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` |

Full correction table (old value -> corrected value, with file:line for every stale doc): [Doc 977](../977-fix-fractals-documentation/).

## 7. Prioritized build list

Ordered by what's needed to close the known todos plus what this synthesis surfaced. All PR-only against `fractalbotapril2026`, never push main; anything touching a wallet or an on-chain write needs Zaal's explicit go-ahead first.

1. **Waiting-room reset** (known todo #1). Nothing exists for this today - confirmed by direct code search. `/randomize` (`cogs/fractal/cog.py:220-361`) moves members out of "Fractal Waiting Room" into numbered breakout rooms but never clears/resets the waiting room afterward, so stale members linger for the next session. Add either a final move-back-to-lobby step at the end of `/randomize`, or a standalone `/admin_clear_waiting_room` command.
2. **Level-6 role tagging** (known todo #2). Also nothing exists - no "Civil," "lvl," or level-6-role code found anywhere in the repo. Implement in `end_fractal()` (`cogs/fractal/group.py`, after the final ranking is built around line 455): on a level-6 win, assign a configured Discord role to the top finisher(s). The Hats Protocol role-sync pattern in `cogs/hats.py` (periodic wearer-status check) is the closest existing precedent to follow for style/structure.
3. **Civil wallet fix + verify ordao state** (known todo #3). No "Civil" reference exists in `fractalbotapril2026` at all - this is very likely scoped to the ZAOOS app or on-chain state, not the bot repo. Next step is a targeted grep across ZAOOS (`civil`, wallet address if known) and a direct on-chain lookup of the specific wallet in question before touching any code. **Do not modify wallet data or submit any on-chain transaction without Zaal's explicit go-ahead**, per the standing rule for this build.
4. **Fractal 101 video** (known todo #4). No existing script/storyboard asset in either repo. This synthesis (sections 1-2 especially) is the raw material - a script should walk: rational ignorance -> small groups -> weekly ritual -> presentations -> consensus ranking -> Fibonacci points -> on-chain OREC settlement, using the corrected numbers from section 6, not the stale ones.
5. **Resolve the doc-vs-code drift** (surfaced by this synthesis, section 4): confirm whether `web/`'s Vercel deploy is live or dead, and re-validate doc 188 against the actual april2026 command count/persistence model rather than march2026.
6. **Audit Respect-formula parity** (surfaced by this synthesis, section 4-5): confirm the bot's `/leaderboard` and proposal-vote-weight arithmetic in `utils/blockchain.py` produces identical numbers to `computeRespectWeight()` in the ZAOOS app for the same wallets, and that a failed on-chain read never gets treated as zero.
7. **Known lower-priority code health items already flagged in the bot's own README** (not new, just worth batching if a PR is already open nearby): `_voice_disconnect_task` not cancelled when a fractal ends, a possible proposal-expiry double-process race between startup catchup and the hourly loop, and no rate limit on `/propose`.
