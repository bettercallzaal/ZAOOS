---
topic: events/zabal-games
type: AUDIT
status: verified
created: 2026-07-17
board-tasks: f0b22571 (is it live or paused?), c993bb9c + d8e31f3b (Zaal+Iman decide Aug tracks)
related-docs: 1255, 1264, 1257, 1077
---

# 1259 -- ZABAL Games Build-A-Thon: Mid-Season State Audit (July 17, 2026)

**Type:** AUDIT
**Date:** 2026-07-17
**Status:** Verified from zabalgames repo + data files
**Board tasks:** f0b22571 (is it live or paused?), c993bb9c + d8e31f3b (Zaal+Iman decide Aug tracks)

---

## Season Structure

ZABAL Gamez = The ZAO's 3-month builder incubator. Season 1 runs June-August 2026.

| Phase | Dates | Status |
|-------|-------|--------|
| June: Workshop Month | Jun 1-30, 2026 | COMPLETE -- 28 workshops logged |
| July: Open Build Month | Jul 1-31, 2026 | STALLED -- 0 recaps, 0 daily-updates |
| August: Finals Month | Aug 1-31, 2026 | PENDING -- 0 finalists locked |

Three tracks: **artist** (musical/visual), **builder** (developer), **creator** (media/distribution).
Site: 60+ pages, 32 Vercel edge functions, Farcaster Mini App. Production: zabalgamez.com.

---

## June Workshop Month: What Was Built and Shipped

June was the most active month. 28 workshop recaps logged across 6 content categories.

| Category | Sessions | Examples |
|----------|----------|---------|
| Guest workshops | 16+ | Neynar (topocount), BizarreBeasts, Bankr (Saltorious), Eden Fractal, FlowStage |
| Farcaster Batches | 1 | ZABAL Gamez on GM Farcaster alongside 4 peer projects |
| AMA | 1 | Farcaster Intern AMA |
| Creator track | 1 | Ohnahji on starting + growing a livestream |
| Tool sessions | 2 | POIDH protocol, selling merch onchain |
| Bonfire + ZOL | 2 | Joshua.eth + Plat0x Bonfire bot, YerbearSerker Empire Builder |

**June ship log (partial -- PRs #127-427 landed this month):**
- Mini App manifest: self-hosted + signed for zabalgamez.com (FID 19640)
- SDK pin + self-host-first loader: same-origin, zero CDN dependency
- Empire Builder leaderboard: live on /leaderboard + homepage preview
- Recordings system: /recordings archive + per-recording comment threads
- Workshop reminder notifications: daily cron at 12:00 UTC
- "Build from this in July" callouts added to June recap pages
- Finals stack: /finals, /winners, /leaderboard, /projects built (settles Aug)

**32 people in the ecosystem roster** (organizers, mentors, workshop leads, builders).

---

## July Open Build Month: Current State

**Scheduled:** 5 build days (Jul 1-5) were entered in `data/build-days.json`.

| Date | Project Spotlight | Guest |
|------|------------------|-------|
| 2026-07-01 | Empire Builder | diviflyy |
| 2026-07-02 | POIDH | Kenny |
| 2026-07-03 | Vini App | Chris Dolinsky |
| 2026-07-04 | Bonfire | Plat0x and Joshua |
| 2026-07-05 | (unconfirmed) | (unconfirmed) |

**What `data/daily-updates.json` shows:** 3 entries total, newest 2026-06-03. Zero July entries.
**What `data/recaps.json` shows:** 28 entries, all June 2026. Zero July entries.

**Verdict:** July open-build has zero documented activity. Either sessions are running offline (no recap capture) or the phase has paused.

---

## August Finals: What Needs to Happen

**Current state:** `data/finals.json` has `status: 'pending'`, `finalists: []`, no window dates.

**Prerequisites before August 1:**

| Item | Status | Blocker |
|------|--------|---------|
| Lock finalists (name, handle, repo, track, prize) | Not started | Zaal + Iman decide |
| Set `window.starts` + `window.settles` in finals.json | Not started | Depends on finalist lock |
| QV ballot (PR #551) | Awaiting Zaal merge | Zaal merge |
| WaveWarZ-Base prediction market contracts | Not started | Separate -- contract addresses unknown |
| Prize pool definition (USDC + $ZABAL amounts) | Not started | Zaal + Iman decide |

**How Finals work (per CLAUDE.md + doc 1255):**
- Builders compete head-to-head on WaveWarZ in August (from doc 1255)
- QV ballot (quadratic voting) for community scoring
- `/finals` page renders roster once `finalists[]` is populated
- `/winners` renders results once `settled: true` + ranks filled
- Prize tiers: `collectible: 'champion'` (1st) or `'finisher'` (participated)

**Key deadline:** August is the *final* track (no extension). If finalists are not locked by Aug 1, the Finals window closes before it can run.

---

## Data Gaps and Corrective Actions

| Gap | File | What to Do |
|-----|------|-----------|
| July build days not logged | `data/daily-updates.json` | Add entries for Jul 1-5 if sessions ran |
| July recaps missing | `data/recaps.json` | Add recap entries for any July sessions |
| Finals window not set | `data/finals.json` | Set `window.starts` + `window.settles` |
| Finalists not locked | `data/finals.json` | Populate `finalists[]` array |
| TODO.md stale | `TODO.md` | Update from 2026-06-06 to current state |

---

## Answers to Board Task f0b22571

**Question:** "Is it live on VPS or paused? Aug is the final track."

**Answer:**
1. zabalgamez.com runs on **Vercel** (not a VPS). Site is live.
2. The June workshop phase completed successfully (28 sessions, 30+ PRs).
3. July open-build has **zero documented activity** -- either the sessions are running offline (no recap capture) or the phase paused.
4. August Finals require Zaal + Iman decisions (finalists, prizes) + PR #551 merge. No actions have been taken yet.

**Decision needed (f0b22571 + c993cb9c + d8e31f3b):**
- Are the July build days still running? If yes: add recaps + daily-updates for Jul 1-17.
- If July has paused: begin Finals preparation immediately (6 weeks until August settles).
- Lock finalist roster + prize amounts before Aug 1.
- Merge PR #551 (QV ballot) -- it is CI-green.

---

## Cross-References

| Doc | Relevance |
|-----|-----------|
| doc 1255 | WaveWarZ August battle protocol -- how builders compete in Finals |
| doc 1264 | ZABAL Games x Empire Builder: Integration Audit (tokenless empire audit) |
| doc 1257 | ZAO IP Portfolio -- ZABAL Games entry with season facts |
| doc 1077 | WaveWarZ volume + charity data (Finals prize benchmarks) |
| ZAOOS PR #551 | QV ballot for Finals scoring -- CI-green, awaiting Zaal merge |

---

## Source Verification

All data verified July 17, 2026 from zabalgames repo:
- `data/daily-updates.json` -- 3 entries, newest 2026-06-03
- `data/recaps.json` -- 28 entries, all June 2026, 0 July
- `data/build-days.json` -- 5 July 1-5 sessions scheduled, 0 recaps
- `data/finals.json` -- `status: 'pending'`, `finalists: []`
- `data/people.json` -- 32 people on roster
- `CLAUDE.md` -- canonical season state
- `TODO.md` -- last updated 2026-06-06
- git log -- last merge PR #427 (recap "Build from this in July" callouts)
