---
topic: events/zabal-games
type: audit
status: verified
created: 2026-07-17
board-tasks: 91d72e68 (verify empire exists), 42058d27 (port minigame to ZABAL Gamez)
related-docs: 1258, 1255, 1097
---

# 1264 -- ZABAL Games x Empire Builder: Integration Audit (July 2026)

> **Bottom line:** The ZABAL GAMEZ tokenless empire (`zabalgamez01e9af`) exists and has been live since June 2026. The two-way integration (ZAO 2048 scores TO Empire Builder + empire leaderboard FROM Empire Builder) is deployed at zabalgamez.com. Board task 91d72e68 is CONFIRMED -- no creation needed. The open gap is August Finals: the Empire Builder leaderboard tracks June/July participation; the Finals judging mechanism is WaveWarZ-Base battles + QV ballot, which is separate and pending Zaal+Iman decisions.

---

## Empire Status

| Field | Value |
|-------|-------|
| Empire ID | `zabalgamez01e9af` |
| Type | Tokenless (Farcaster channel / cast / interaction based) |
| Live URL | `empirebuilder.world/empire/zabalgamez01e9af` |
| First confirmed | 2026-06-04 (audit-decisions-2026-06-04.md in zabalgames repo) |
| Env var default | `EMPIRE_ID` defaults to `zabalgamez01e9af` in code -- no Vercel config required for basic reads |
| Auth required | API key optional (reads are open GET; `EMPIRE_API_KEY` env sends `x-api-key` header if set) |

**Why tokenless:** ZABAL Games does not have its own ERC-20 token. Empire Builder supports a "tokenless" empire type (Farcaster channel, cast, or interaction-based) as an alternative to an ERC-20-denominated leaderboard. This is the correct choice for ZABAL Games Season 1 -- no token launch required.

---

## Two-Way Integration Architecture

The integration runs in both directions.

### Direction 1: ZABAL Games -> Empire Builder (our data FOR them)

**Endpoint:** `GET /api/leaderboard`

- Exposes ZAO 2048 game high scores in Empire Builder's expected shape: `[{ address, score }]`
- Data source: Upstash Redis KV, key `zabal:game:all:zao2048` (written by `/api/game`)
- Filters to players with a verified Base address only (ERC-20 empire leaderboard requirement)
- Also serves a `?format=full` view for the internal `/leaderboard` page

**Purpose:** Registers ZABAL Games as an Empire Builder "minigame source." Community members who play ZAO 2048 on zabalgamez.com earn points in the empire.

### Direction 2: Empire Builder -> ZABAL Games (empire data FOR us)

**Endpoint:** `GET /api/empire-leaderboard`

- Proxy that fetches the live empire leaderboard from `empirebuilder.world` and normalizes to a stable contract
- Response shape: `{ ok, configured, empireId, source, board, count, entries:[{ rank, address, fid, username, displayName, pfpUrl, score }] }`
- If `EMPIRE_ID` is not set: returns `{ ok:true, configured:false }` (graceful no-op)
- Optional params: `tokenAddress` (empire override), `board` (select a specific board by key or name), `limit` (1-250, default 50)
- Resolves usernames to FIDs and profile data via Neynar/HAATZ for avatar display

**Purpose:** Powers the `/empire-leaderboard` page showing ZABAL Games participants ranked by Empire Builder activity.

---

## Participation Activity Endpoints (Feed INTO the Empire)

These endpoints track ZABAL Games activity that Empire Builder can use for points/ranking:

| Endpoint | What it tracks |
|----------|----------------|
| `/api/track` | Profile tracking, activity signals |
| `/api/activity` | General activity events |
| `/api/join` | Signup / join events |
| `/api/present` | Presence at workshops / events |
| `/api/game` | ZAO 2048 game scores (source for `/api/leaderboard`) |

---

## August Finals: What Empire Builder Does NOT Cover

The August Finals use a different mechanism (doc 1255):

1. **WaveWarZ-Base battles** -- builder projects compete head-to-head as if they were songs; community buys shares; volume determines winner. Requires WaveWarZ-Base contract deployment (status unknown, not in zabalgames repo).
2. **QV ballot** -- parallel quadratic voting layer via PR #551 (CI-green, awaiting Zaal merge).
3. **Mentor finals-picks** -- `/api/finals-picks` is gated by `ZABAL_JUDGE_FIDS` env var (currently unset = safe-closed; no picks can be submitted until Zaal sets this).

**Empire Builder leaderboard is for June/July engagement tracking only.** It is not the August Finals judging mechanism. Do not conflate the two.

---

## ZAO 2048 Minigame: Porting Status

Board task 42058d27 mentions "port minigame to ZABAL Gamez." The ZAO 2048 game is already live:
- `/game` page exists in zabalgamez.com
- `/api/game` edge function writes scores to KV
- `/api/leaderboard` exposes scores FOR Empire Builder
- `/leaderboard` page (format=full) shows the ranked players

**What may be needed:** The "port minigame" task may refer to additional Empire Builder-specific registration (linking zabalgamez.com as the canonical minigame source in Empire Builder's dashboard). This is a Zaal-side configuration step at empirebuilder.world admin panel. The code side is done.

---

## Vercel Env Var Checklist

| Var | Required? | Status |
|-----|-----------|--------|
| `EMPIRE_ID` | Optional (defaults to `zabalgamez01e9af` in code) | [to confirm: set in Vercel or using code default] |
| `EMPIRE_API_KEY` | Optional (reads work without it) | Not needed for current read-only use |
| `ZABAL_JUDGE_FIDS` | Required to open finals-picks POST | Not set (safe-closed; set when finalist judges are confirmed) |
| `BONFIRE_ID` | For build events + bonfire-ask | [to confirm: set in Vercel] |
| `GITHUB_TOKEN` | For commit-watcher build polling | [to confirm: set in Vercel] |

---

## Open Items

| Item | Owner | Deadline |
|------|-------|----------|
| Confirm empire leaderboard is populated with real participants | Zaal | Before Aug 1 |
| Register zabalgamez.com as minigame source in Empire Builder admin (if not done Jun) | Zaal | Before Aug 1 |
| Set `ZABAL_JUDGE_FIDS` in Vercel once mentors/judges confirmed | Zaal | Before Aug Finals announcement |
| WaveWarZ-Base contract addresses for Finals | WaveWarZ team | Before Aug Finals |
| Lock finalist roster in `data/finals.json` (currently `status: pending`, `finalists: []`) | Zaal + Iman | Before Aug 1 |
| Merge PR #551 (QV ballot) | Zaal | Before Aug Finals |

---

## Summary

The ZABAL GAMEZ tokenless empire exists and has been live since June 2026 (ID: `zabalgamez01e9af`). Board task 91d72e68 is confirmed done -- no creation needed, only verification. The two-way Empire Builder integration (minigame scores out + empire leaderboard in) is deployed and functional. The August Finals require a separate setup: WaveWarZ-Base battles, QV ballot (PR #551), and mentor finals-picks (gated on `ZABAL_JUDGE_FIDS`). The empire leaderboard and the Finals are independent systems -- the former tracks June/July participation engagement, the latter determines the actual winner of ZABAL Games Season 1.
