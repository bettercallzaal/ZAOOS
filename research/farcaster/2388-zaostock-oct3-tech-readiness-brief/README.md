---
topic: farcaster
type: readiness-brief
status: awaiting-zaal
created: 2026-08-22
last-validated: 2026-08-22
board-task: none
related-docs: "1617-zaostock-fractal-live-governance-guide, 2380-wavewarz-miniapp-ship-assessment-aug2026, 2381-farcaster-hub-api-zol-migration-reference, 2383-neynar-operator-monitoring-brief, 2382-zao-fractal-article-ef117"
original-query: "ZAOstock Oct 3 tech readiness — all Farcaster/ZOL/WaveWarZ workstreams in one view with owners, deadlines, blockers"
tier: STANDARD
---

# 2388 - ZAOstock Oct 3 Tech Readiness Brief

> **Purpose:** Single-pane view of all open technical workstreams with a ZAOstock
> (Oct 3, 2026) deadline. Cross-references docs 2380–2387. Zaal uses this to
> assign owners and confirm the Aug 25 decision window.

---

## Event Context

**ZAOstock** — October 3, 2026. First IRL music festival with live ZAO Fractal
governance session. Remote + in-person simultaneous. Governance proposals open
for submission through September 28. EF Session 117 (~Oct 6, adjacent).

**Tech stakes:** ZOL must post without interruption. WaveWarZ miniapp needs a
decision now to ship by Oct 3. Governance article (doc 2382) needs to publish
by Sep 28 as a Snapshot discussion post.

---

## Workstream Table (As of Aug 22, 2026)

| # | Workstream | Status | Hard deadline | Owner | Blocker |
|---|-----------|--------|--------------|-------|---------|
| 1 | **ZOL hub migration** (docs 2381, 2383) | Spec'd, not deployed | Sep 29 | Dev | None — 5 lines of code |
| 2 | **WaveWarZ miniapp** (doc 2380) | Spec'd, no builder | Aug 25 (scaffold) | **ZAAL DECISION** | Who builds + scope |
| 3 | **ZAO Fractal article** (doc 2382) | Draft complete | Sep 28 (publish) | Zaal | Number verification |
| 4 | **Farcaster governance proposals** (doc 1617) | Open for submission | Sep 28 | Zaal / community | None |
| 5 | **Neynar monitoring** (doc 2383) | Monitoring active | Oct 3 continuous | Anyone | None |
| 6 | **ZOL mention polling** (doc 2387) | Spec'd | Sep 29 | Dev | None — spec is complete |

---

## Workstream 1: ZOL Hub Migration (CRITICAL PATH)

**What:** Switch ZOL's hard-coded Neynar endpoints to Snapchain/Pinata before
Neynar operator transition causes a disruption.

**Effort:** 5 lines of code across 2 files. Already fully spec'd in doc 2381.

**Changes:**
1. `zol-lib.js:17` — `const HUB = process.env.ZOL_HUB_URL || 'https://hub-api.neynar.com'`
2. Add `ZOL_HUB_URL=https://hub.pinata.cloud` to `.env`
3. `integrations.js:108` — migrate v1 → v2 search (2 lines)

**Decision needed:** NONE. This is a pure technical execution task. Any developer
with access to `zol-upgrade/` can ship this in <2 hours.

**Deadline:** Sep 29 at latest (4 days before ZAOstock). Recommended: Aug 25 (doc
2383 YELLOW trigger threshold = Sep 17; earlier is better).

---

## Workstream 2: WaveWarZ Miniapp (DECISION NEEDED — Aug 25)

**What:** Build a Farcaster miniapp for WaveWarZ battles. Doc 2380 verdict: YES,
ship before Oct 3. View-only V1 recommended (no live betting dependency).

**Two decisions Zaal must make by Aug 25:**

### Decision A: Who builds?

| Option | Pros | Cons |
|--------|------|------|
| ZAO in-house (current dev team) | No coordination overhead | Unknown availability |
| Hire contractor | Speed | Cost, onboarding |
| Zaalcaster/ZOL codebase adaptation | Familiar codebase | ZOL team bandwidth |

### Decision B: Scope

| Option | Work | Risk |
|--------|------|------|
| **View-only V1** (recommended) | ~3 days | Low — no API dependencies |
| Full V1 with betting | ~10 days | High — `/battle/bet` API dependency |

**View-only V1 features:** leaderboard, active battles, battle history, ZAOstock
battle showcase. No wallet actions.

**Timeline (if Aug 25 scaffold decision):**
- Aug 25: scaffold + auth
- Aug 29: battle view working in Warpcast
- Aug 30: first cast from within miniapp
- Sep 15: content complete + Warpcast submission
- Sep 22: buffer for review
- Oct 3: ZAOstock demo ready

---

## Workstream 3: ZAO Fractal Article (doc 2382)

**What:** Public-facing article — "117 Weeks of Showing Up." Already drafted.

**Before publishing, Zaal must verify:**
- Current session count (110 as of Aug 18; 117 expected ~Oct 6)
- Streak count (verify exact weeks in ZOR era)
- Snapshot space slug (`zaofractal.eth` — per doc 1617)
- ZOR Awards live count (288 — verify from contract)

**Distribution targets:** Farcaster (via ZOL), Medium, Snapshot discussion post
(must go up by Sep 28 for governance engagement).

**Action:** Zaal reviews doc 2382, corrects numbers, approves for publish.

---

## Workstream 4: Governance Proposals (doc 1617)

**What:** ZAOstock Oct 3 fractal session will handle governance proposals submitted
by Sep 28.

**Open proposals on the table (from doc 2347):**
- Multi-respect leaderboards (separate code, music, support tracks)
- Camera-on award automation (remove manual step)
- 4-week break test (away without losing standing)

**Action:** Community submits proposals to Snapshot space. No tech work needed.
ZOL can post announcement casts reminding community of Sep 28 deadline.

---

## Workstream 5: Neynar Monitoring (doc 2383)

**What:** Active watch on `status.neynar.com` + Neynar blog for operator transition
signals.

**Triggers:**
- GREEN (now): no action needed
- YELLOW (Sep 17 or earlier if degradation): execute ZOL migration immediately
- RED (shutdown announced): emergency 24h migration

**Who watches:** Anyone. Bookmark `status.neynar.com`. Check weekly.

---

## Workstream 6: ZOL Mention Polling (doc 2387)

**What:** New feature — ZOL responds to @mentions via Snapchain polling.
Spec is complete (doc 2387). Zero Neynar dependency.

**Effort:** 1 new file (`src/mention-poll.js`), 1 function addition (`classifyMentionIntent`).
~3 hours for a developer familiar with the codebase.

**Decisions Zaal must make (from doc 2387):**
1. Reply gate: Telegram approval (recommended) or auto
2. Intent scope: question-only (recommended for v1)
3. Poll interval: 5 min (recommended)

**Deadline:** Before ZAOstock — so ZOL can respond to @mentions during the event.
Sep 29 is the target.

---

## Critical Path Summary

The ZAOstock hard deadline is Oct 3. Working backward:

```
Oct 3  — ZAOstock: ZOL posting stable, mentions live, governance active
Sep 29 — ZOL hub migration + mention polling deployed
Sep 28 — Governance proposals submitted; Fractal article published to Snapshot
Sep 22 — WaveWarZ miniapp Warpcast submission (if built)
Sep 17 — Neynar YELLOW trigger auto-escalate (hub migration must be done)
Sep 15 — WaveWarZ content complete (if built)
Aug 30 — WaveWarZ first cast from miniapp (if built)
Aug 29 — WaveWarZ view working in Warpcast (if built)
Aug 25 — WaveWarZ builder + scope DECISION ← NEXT IMMEDIATE ACTION FOR ZAAL
Aug 25 — ZOL hub migration target (earlier the better)
Aug 22 — Today
```

---

## Zaal's Immediate Actions

| Action | By | Time needed |
|--------|-----|------------|
| 1. Decide WaveWarZ miniapp: builder + scope (Decision A + B) | Aug 25 | 30 min |
| 2. Verify fractal article numbers in doc 2382 | Any time | 15 min |
| 3. Assign a developer to ZOL hub migration (doc 2381) | Aug 25 | 5 min to assign |
| 4. Assign a developer to ZOL mention polling (doc 2387) | Aug 25 | 5 min to assign |
| 5. Publish fractal article to Snapshot as discussion post | Sep 28 | After number verify |

---

## Also See

- [Doc 1617](../../governance/1617-zaostock-fractal-live-governance-guide/) — ZAOstock governance guide + proposal timeline
- [Doc 2380](../2380-wavewarz-miniapp-ship-assessment-aug2026/) — WaveWarZ miniapp assessment (YES ship)
- [Doc 2381](../2381-farcaster-hub-api-zol-migration-reference/) — ZOL hub migration spec (5 lines)
- [Doc 2382](../../governance/2382-zao-fractal-article-ef117/) — Fractal article draft
- [Doc 2383](../2383-neynar-operator-monitoring-brief/) — Neynar monitoring + RED/YELLOW/GREEN
- [Doc 2387](../2387-zol-mention-polling-snapchain-spec/) — ZOL mention polling spec
