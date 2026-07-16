---
topic: business
type: map
status: research-complete
last-validated: 2026-07-16
related-docs: 1120, 1093, 1096, 1097, 1098, 961
original-query: map the ZABAL Gamez / POIDH art-submission pipeline across repos, find rough edges, wire toward tokenless-empire onboarding
tier: DEEP
---

# 1139 - ZABAL Gamez / POIDH Submission Pipeline: Current-State Map

> **Goal:** Map the current art-submission flow across the repos, name the seams and rough edges, and list the concrete first PRs to build "the spine." Foundation for the ZABAL submission-pipeline cleanup (priority, 2026-07-16). Companion to the doc-1120 Fable business case.

## Executive summary

The pipeline is **durable but fully manual and off-platform**. There is **no direct integration** between the repos: submissions happen on poidh.xyz (external), and scoring/leaderboarding is hand-run in `zpoidh` via Python. The Fable evaluation pipeline (doc 1120) is **scaffolding only** — no runtime code. It works because Zaal runs the scripts each round; it does not scale and cannot yet drive feedback or onboarding.

**First naming trap:** `zabalartsubmission` is NOT the submission app — it's a Farcaster **voting** miniapp. The actual submission front door is poidh.xyz; the ops live in `zpoidh`.

## Repos & stacks

| Repo | Owner | Stack | Role |
|------|-------|-------|------|
| `zabalartsubmission` | bettercallzaal | Next.js 16 / React 19 / Supabase / Neynar | Farcaster **voting** miniapp (misnamed — not submission) |
| `zpoidh` | bettercallzaal | Static HTML + Python + Vercel edge + JSON | Bounty ops: rounds, judging, leaderboard, brand kits, `pipeline/` (Fable scaffolding) |
| `poidh-v2-contracts` | picsoritdidnthappen | Anchor/Rust | On-chain bounty+claims (the poidh.xyz backend, external) |

## Submission flow (end-to-end, R3 "ZABAL Gamez Ad Bounty" example)

1. **Bounty creation** — Zaal writes `zpoidh/rounds/rN/description.md`, manually creates the bounty on poidh.xyz, casts to Farcaster `/zabal` + X.
2. **User submission (off-platform)** — creator posts the ad to X/Farcaster, then submits the URL on the poidh.xyz bounty page → on-chain claim (wallet + URI).
3. **Judging (manual, in zpoidh)** — Zaal reviews from the POIDH UI, runs `scripts/refresh-poidh-leaderboard.py` (pulls POIDH tRPC), hand-scores (Distribution / Craft / Substance / Bonus) into `rounds/rN/judging.json`, commits.
4. **Leaderboarding (manual Python)** — `refresh-poidh-leaderboard.py` aggregates claim wallets, writes `data/leaderboard.json` ({address, score}); Vercel serves it at `bettercallzaal.com/poidh-leaderboard.json`.
5. **Rewards** — POIDH settles the winning claim on-chain (97.5% winner / 2.5% treasury); Empire Builder reads `leaderboard.json` and distributes $ZABAL proportional to score.

## The seam (where value leaks)

The only bridge from "submission" → "leaderboard" is the **manual Python script** querying POIDH's tRPC. There is **no webhook**, no form in `zpoidh`, no identity capture into Bonfire/ZAO memory, and the Fable pre-scoring step is a runbook with no code. Every rough edge clusters at this seam.

## Rough edges (prioritized)

**P1 — blocks pipeline value**
1. **No submission form** — creators must find the bounty on poidh.xyz themselves (discovery friction). `zpoidh/` has no submit UI.
2. **Leaderboard refresh is manual** — `scripts/refresh-poidh-leaderboard.py` must be hand-run; no cron/webhook → stale leaderboard + delayed $ZABAL.
3. **Fable pipeline is scaffolding only** — `zpoidh/pipeline/*.md` are templates; doc 1120's "AI feedback for every submitter" never runs.

**P2 — operational friction**
4. `zabalartsubmission` misnamed (voting miniapp, not submission) — costs devs investigation time.
5. Round descriptions live as static Git markdown, copied to POIDH by hand.
6. Judging is hand-edited JSON with no rubric validation.
7. No submission dedup in `data/claims.json` (audit/inflation risk).

**P3 — quality of life**
8. Brand kit source-of-truth split (GitHub vs website).
9. Round metadata not DRY (bounty_id/deadline/prize scattered across files).
10. No POIDH→zpoidh webhook on claim creation.

## Tokenless-empire onboarding: wiring opportunities

1. **Fable → Sparkz-readiness score (HIGH).** Extend the Fable eval to score each submission for "Sparkz launch readiness" (docs 1096–1098) and return actionable feedback. Hook: `zpoidh/pipeline/run-eval.md` + a `sparkz_readiness` field in `judging.json`.
2. **Leaderboard → Bonfire identity bridge.** After the EB update, POST submitter identity + history to Bonfire so POIDH activity enters ZAO memory (doc 1093). Hook: end of `refresh-poidh-leaderboard.py`.
3. **Direct submission form** that submits to POIDH + creates a Bonfire entity + returns a readiness score in one page.
4. **Post-submission onboarding** — ZOE DM with feedback + Sparkz-beta link + build schedule, closing the submit→feedback→improve→launch loop.

## Suggested first PRs (value/effort)

| # | Title | Repo | Why first |
|---|-------|------|-----------|
| 1 | Auto-refresh leaderboard via GitHub Action cron | `zpoidh` | Kills the manual step; keeps EB $ZABAL fresh. ~1–2h, lowest risk. |
| 2 | Wire the Fable eval into R3/R4 (run-eval + judging.json field) | `zpoidh` | Proves the doc-1120 MVP; ships real feedback. ~3–4h. |
| 3 | Per-round submission form (+ `api/submit/[round]`) | `zpoidh` | Closes the discovery gap; unlocks scaling. ~4–5h. |
| 4 | Add Sparkz-readiness rubric to Fable | `zpoidh` | Connects POIDH → tokenless onboarding. ~2–3h. |
| 5 | Validate + dedupe submissions | `zpoidh` | Hardens leaderboard integrity. ~1–2h. |

**Recommendation:** start with PR #1 (auto-refresh cron) — smallest, removes the biggest operational drag — then PR #2 (Fable eval) to make the feedback loop real. Both are `zpoidh`-only, PR-safe, and don't touch gated/on-chain flows.

## Method note
Map produced 2026-07-16 by read-only clone + inspection of `zabalartsubmission` + `zpoidh` (into /tmp), cross-referenced with docs 1120/1093/1096–1098/961. No writes to those repos. The follow-on PRs live in `zpoidh`, not ZAOOS.
