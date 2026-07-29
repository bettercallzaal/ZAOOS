---
topic: security
type: audit
status: research-complete
last-validated: 2026-07-27
related-docs: 2079
original-query: "Sweep the ZAO repos for 'green while broken' silent-failure patterns after tonight found three (admin bypass, dead cron, never-run tests). Write a durable guard rule. (overnight system-improvement loop)"
tier: STANDARD
---

# 2093 - Silent-failure sweep (honestly graded)

> **Goal:** After three confirmed "green while broken" failures shipped tonight, sweep ZAOOS for more of the pattern and grade each honestly - most instances are intentional; one is worth a real decision.

## Why this exists

Tonight surfaced three real silent failures (see `.claude/rules/silent-failure-guard.md` for the incidents): an admin bypass that 200'd, a cron green for 7 weeks while 503-ing, and a test suite that never ran. This doc is the sweep for more of the same. **Every finding below was manually verified against the source** - the automated sweep over-graded several as critical; they are corrected here.

## Findings (graded after verification)

| # | Location | Claim | Verified verdict |
|---|----------|-------|------------------|
| 1 | `src/app/api/crm/capture/route.ts` (224/234/245/262) | Returns `{ok:true}` on DB insert/update failure | **REAL - but intentional.** The code has explicit `// soft-fail: don't expose internal errors` comments and returns `{ok:true}` (even 200 in the catch) when a write fails. It IS silent data-loss *visibility* loss - a failed CRM capture looks successful to the client. Not an accident; a design tradeoff to revisit (see decision below). |
| 2 | `src/app/api/stream/webhook/route.ts` (49-52/61-64) | RPC failures, webhook still 200s | **PLAUSIBLE - review.** Same soft-fail shape on metrics RPCs; lower stakes (metrics drift, not user data). Confirm whether a failed participant-count update should fail the webhook. |
| 3 | `.github/workflows/ci.yml` (55, 100) | `npm i @rollup/... \|\| true`, `@tailwindcss/oxide... \|\| true` | **DEFENSIBLE - low priority.** These are optional platform-specific native binaries; `\|\| true` is the standard pattern so a non-matching platform does not fail install. Leave unless it hides a real missing dep. |
| 4 | `scripts/git-secret-scan.sh` (~21) | `git diff ... \|\| true` could pass the scan trivially if git diff fails | **NUANCED - low risk.** The `\|\| true` primarily handles grep's expected no-match; the script uses `set -uo pipefail`. The theoretical "git diff itself fails -> empty -> passes" path is real but unlikely. Worth a pipefail-aware tightening, not urgent. |
| 5 | `.github/workflows/docs-automerge.yml`, `doc-collision-guard.yml` | `grep ... \|\| true` in doc guards | **DEFENSIBLE.** `\|\| true` on a grep whose no-match is the normal case. Not a masked failure. |
| 6 | `.github/workflows/estate-health.yml` (31-37) | `/tmp` file writes not verified before downstream use | **PLAUSIBLE - low.** Assert the output files exist + non-empty before the next step; cheap hardening. |

## The one decision for Zaal

**crm/capture soft-fail (finding 1).** A member fills the CRM form, the DB write fails, and the client sees success - the lead is silently gone. Options: (a) keep soft-fail for UX but log at error level + emit a metric/alert so it is not invisible (recommended - matches guard rule 6), or (b) return a distinct non-200 the client can retry on. Either is a small change; the current state is the only genuinely worth-fixing item in the sweep.

## What actually shipped from this

The durable output is the new **`.claude/rules/silent-failure-guard.md`** - grounded in tonight's three *confirmed* incidents, not the over-graded sweep. The sweep's honest lesson: the pattern exists but is mostly intentional here; the value is preventing the next *accidental* one.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide crm/capture soft-fail: log+alert (a) vs distinct status (b) | zaal | Decision | 2026-08-05 |
| Adopt `.claude/rules/silent-failure-guard.md` (this PR) | zaal | Merge | 2026-07-28 |

## Sources

- Manual verification of each file:line above (this repo, 2026-07-27) - [FULL]
- `.claude/rules/silent-failure-guard.md` (companion rule, same PR)
