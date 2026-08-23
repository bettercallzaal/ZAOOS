---
topic: dev-workflows
type: reference
status: living-doc
last-validated: 2026-08-22
related-docs: "441, 601, 759, 2036, 2239, 2365"
original-query: "why does this keep happening do we have a list of mistakes somewhere in our vault"
tier: STANDARD
---

# 2373 - ZAO Mistakes Log (living doc — add to this, never delete)

> **Goal:** Zaal asked directly (2026-08-22 14:35): "why does this keep happening
> do we have a list of mistakes somewhere in our vault." The answer was: no such file
> existed. This is that file.
>
> A mistake earns an entry when it: (1) caused real production impact or wasted
> real work, (2) happened MORE THAN ONCE, or (3) prompted a `.claude/rules/*.md`
> file. Entries newest-first. One rule per mistake. Link the resulting rule/fix.

## How to add an entry

```
### YYYY-MM-DD — <one-sentence what happened>
**Category:** <one word: Absence-Claim | Silent-Failure | State-Claim | Spend | Deletion | Scope-Creep | Security | Communication | Process>
**Impact:** <what it cost: time, $, user harm, trust>
**Root cause:** <the actual failure mode, not the surface symptom>
**Rule / fix:** <link or path>
```

---

## Log (newest first)

### 2026-08-22 — Doc-number collision slipped through the guard (Finding 7 of doc 2365)
**Category:** Process
**Impact:** Doc 2365 had to be renumbered from 2364 → 2365 after a collision; 3 old collisions (1659, 2273, 2282) left on main for months.
**Root cause:** ZOE's autonomous research loop (zol-research on Pi) does not call `zao-doc-next` before claiming a doc number. The reservation tool serialises human + tool writers but not the autonomous loop. A compare-and-swap only works if every writer participates.
**Rule / fix:** Board task to make ZOE loop call zao-doc-next (doc 2365, Next Action #5). Collisions 1659/2273/2282 fixed in PR #3251.

### 2026-08-22 — MEMORY.md compaction trimmed prose but missed the byte budget entirely
**Category:** Process
**Impact:** 3% byte reduction instead of needed ~20%; Zaal's distrust confirmed ("i dont trust that you are doing it well with your cuts"). File at 79% byte budget.
**Root cause:** Compacting by prose-trimming is "summarize everything" — the documented losing strategy. The binding limit is bytes (25KB), not lines (200). Optimised the non-scarce budget. See doc 2365.
**Rule / fix:** Decision: prune entries duplicated by `.claude/rules/` (the docs' own guidance). Prose-trimming banned as a compaction strategy.

### 2026-08-22 — Memory file mtimes used as age proxy; all are fake (doc 2365, Finding 4)
**Category:** State-Claim
**Impact:** Any pruning pass built on mtime would delete by meaningless signal; 190 files affected.
**Root cause:** Bulk sync commit `e1b7de5` reset all 416 memory files to 2026-08-12. `stat` returns the checkout date, not the date the memory was written. Canonical source: `git log --diff-filter=A`.
**Rule / fix:** `state-claims.md` to be updated with `git log --diff-filter=A` as canonical memory-age command (board task 9553).

### 2026-08-20 — Meeting recaps not updated after promises; frozen-in-time problem
**Category:** Process / Communication
**Impact:** 4+ meeting docs across unrelated threads read as "active" weeks after the call; nobody could tell what had been done vs. promised.
**Root cause:** A recap is written at the moment of promising — when the most is owed and nothing has been done. Nobody went back. A promise and a kept promise look identical in a static doc.
**Rule / fix:** `.claude/rules/recap-followthrough.md` (established 2026-08-20). Recap must note actual outcome, not just the promise.

### 2026-08-08 — Eight wrong state-claims about the codebase in a single session
**Category:** State-Claim
**Impact:** Wasted session work; eroded Zaal's trust ("there's a lot of times u say correction").
**Root cause:** Every wrong claim came from a proxy cheaper to reach than the truth (package range instead of lock file; tsc output with empty node_modules; canary file instead of call-site grep). The rule to verify existed (`confirm-before-claiming-absence.md`) but the *why* was not encoded — agents reached for the fast proxy anyway.
**Rule / fix:** `.claude/rules/state-claims.md` (established 2026-08-08). Name the source, or do not make the claim.

### 2026-08-07 — Four noisy-signal false-positives in one session; real issue hidden in noise
**Category:** Silent-Failure (mirror)
**Impact:** 35 false-positive route labels, a flag that could never reach zero, 183 phantom typecheck errors; real bugs hidden inside permanent noise.
**Root cause:** A check that always fires is a check nobody reads. Same failure as silent-failure but in reverse: reports failure so often that the real failure hides in the noise.
**Rule / fix:** `.claude/rules/noisy-signal-guard.md` (established 2026-08-07).

### 2026-08-05 — Recommended building ZOE board-reading capability while team-tracker.ts already existed
**Category:** Absence-Claim
**Impact:** Proposed building something already built; wasted planning time; Zaal: "we cannot ever afford to have these mistakes in production."
**Root cause:** "The gap is X" asserted from partial read (didn't grep for existing call sites). The second same-day miss: recommended "failure memory" as ZOE's biggest gap while recall.ts + reflexion.ts + error-remediation.ts already existed.
**Rule / fix:** `.claude/rules/confirm-before-claiming-absence.md` (established 2026-08-05). ZOE Capability Map (doc 2239) as the pre-flight lookup.

### 2026-08-01 — rm -rf rules were macOS-only and therefore inert on Windows box
**Category:** Security / Deletion
**Impact:** Windows desktop's rm -rf deny rules silently bypassed; deletion protection had a hole on every non-mac surface.
**Root cause:** Rules hardcoded `/Users/zaalpanthaki/...` paths — macOS-only. Never tested on Windows. The wrong fix: add Windows paths. The right fix: never run rm -rf at all.
**Rule / fix:** `.claude/rules/no-rm-rf.md` (established 2026-08-01). Deletion is Zaal's; agents surface paths, never delete.

### 2026-07-27 — Admin bypass lived in prod: cookie value "admin" granted full admin on cocconcertz.com
**Category:** Security / Silent-Failure
**Impact:** One curl header = delete events, message all users, change roles. Lived in prod undetected.
**Root cause:** Server returned 200 normally; no alarm, no log alert. Silent success masking broken state.
**Rule / fix:** `.claude/rules/silent-failure-guard.md` (established 2026-07-27). Also: cron green for 7 weeks while job 503'd; test suite passing while never running.

### 2026-07-27 — Cron job reported green for 7 weeks while 503-ing on every run
**Category:** Silent-Failure
**Impact:** Auto-close job never ran for 7 weeks; nobody noticed because CI showed green.
**Root cause:** `curl | tee` — bash reports `tee`'s exit 0, not curl's failure. Silent success.
**Rule / fix:** `.claude/rules/silent-failure-guard.md`. Pipe exit codes must be checked; `set -o pipefail` or explicit checks.

### 2026-07-27 — Test suite passed CI for weeks while never running a single test
**Category:** Silent-Failure
**Impact:** 149 real tests invisible to CI; any regression would have shipped undetected.
**Root cause:** `vitest.config.ts` failed with ERR_REQUIRE_ESM under Node 20; job passed anyway because the runner reported 0 tests with exit 0.
**Rule / fix:** `.claude/rules/silent-failure-guard.md`. Zero-test-run must be a failure, not a pass.

### 2026-07-23 — Doc 2036 action item (compact MEMORY.md) overdue 3 weeks, nobody noticed
**Category:** Process / recap-followthrough
**Impact:** MEMORY.md grew from ~20KB to 19.6KB (basically unchanged) with a 2026-07-30 action due date that nobody re-opened.
**Root cause:** Action item with a date in a doc nobody re-opened. Same shape as the recap-followthrough failure.
**Rule / fix:** doc 2365 supersedes doc 2036's row. Recap-followthrough rule applies retroactively.

---

## Patterns (recurring failure shapes)

| Shape | Count | Description |
|-------|-------|-------------|
| **Silent-Failure** | 4 | System reports success/green while doing nothing or something wrong |
| **Absence-Claim** | 2 | "X is missing" asserted from partial read; X already existed |
| **State-Claim** | 2 | Wrong claim about repo/system state from a proxy instead of the truth |
| **Process** | 4 | Commitment made, doc written, nobody checked back |

The most dangerous pattern is **Silent-Failure**: admin bypass, broken cron, broken tests, and broken guards all looked fine on every dashboard. The most frequent pattern is **State-Claim + Absence-Claim** — asserting facts about the codebase from the first thing that's cheap to reach.

## Sources

- `.claude/rules/*.md` files (all read directly, 2026-08-22). [FULL]
- doc 2365 (agent memory management, 2026-08-22). [FULL]
- doc 2036 (context hygiene, 2026-07-23). [FULL - referenced]
- doc 2239 (ZOE capability map, living doc). [FULL - referenced]
- Zaal direct quote, 2026-08-22 14:35: "why does this keep happening do we have a list of mistakes somewhere in our vault"
