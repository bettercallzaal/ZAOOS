---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: "461, 2105, 2292, 2367, 2462"
original-query: "STANDARD - Why written lessons do not hold for coding agents, and what mechanisms do: the surface-cannot-report-state failure shape (10 instances in our estate, graduated to a law in claude/autopilot.md this morning, recurred twice since). Focus: enforcement mechanisms at the point of failure (hooks, gates, wrappers, typed instruments) versus prose rules; evidence from agent-harness practice; what to build so an instrument cannot answer a question it does not measure."
tier: STANDARD
---

# 2499 — A law that graduated this morning broke twice by evening: enforce at the instrument, not in prose

> **Goal:** Say why writing a failure down as a rule does not stop it, using a shape that
> graduated to a law and recurred the same day, and specify the one mechanism that would have
> caught both recurrences.

> **UPDATED 2026-09-25 (re-research, 8 days after last validation).** The central numbers in
> this doc were stale by roughly 5x. `surface-cannot-report-state` is not "10 instances,
> recurred twice" - it is **28 instances, 20 recurrences since graduation**, measured today by
> `zao-mistake due` reading `~/zao-vault/MISTAKES.md` directly. A SECOND shape,
> `unmeasured-prediction-in-a-record`, has since graduated into a law (2026-09-20, into
> `claude/CLAUDE.md`) and is **also** marked `LAW NOT HOLDING` (5 recurrences since its own
> graduation). The PreToolUse hook this doc called for is built, tested (44/44) and merged
> (dotfiles PR #306, 2026-09-19) - but still not wired into `settings.json`, which every
> deadline in the original Next Actions table assumed would happen by 2026-09-22. See
> Findings 1-2 for the lead facts and Next Actions for what is actually still open.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **STILL BUILD the trigger field** (`zao-mistake add --trigger`, card 9819's other half). It does not exist as of 2026-09-25: `zao-mistake add --help` has no `--trigger` flag, and `grep -c '^trigger:' MISTAKES.md` is 0. | The consuming hook (`bin/zao-mistake-hook`) was merged 2026-09-19 and already reads an optional `trigger:` line - "the hook just becomes more useful, with no code change, the day `zao-mistake add --trigger` ships it" (its own design note). Eight days on, nothing writes that field. |
| 2 | **WIRE `settings.json` now.** The code is built, tested, merged. The only gap is one paste into a file only Zaal edits, and that paste has not happened. | Re-confirmed 2026-09-25: `~/.claude/settings.json` (symlinked to `zaal-dotfiles/claude/settings.json`) has 13 registered `PreToolUse` entries and none references `zao-mistake`. A 2026-09-23 grill decision explicitly kept this a standing checkpoint - "he specifically did NOT take the option to retire the note" - even after noting three other dotfiles PRs (#234, #337, #340) had self-wired their own hooks without waiting for his hand. |
| 3 | **TRACK the second graduated law, not just the first.** `unmeasured-prediction-in-a-record` graduated 2026-09-20 into `claude/CLAUDE.md` and already shows 5 recurrences since. | This doc's thesis - graduation is not enforcement - is no longer a one-shape claim. Two shapes, graduated eight days apart, both print `LAW NOT HOLDING` from the same tool. That is a pattern, not an incident. |
| 4 | **UPGRADE `LAW NOT HOLDING` from a manual lookup to a red `zao-selftest` check.** `zao-mistake due` already computes it; `zao-selftest` (re-read today, 40 registered checks) has none named `mistake` or `law`. | This is the cheapest remaining piece of the original plan - a few lines wiring an existing command into an existing check runner - and its 2026-09-24 deadline has already passed. |
| 5 | **KEEP the ANMA and Statewright comparisons**, re-confirmed unchanged in substance: ANMA still 2 stars/Apache-2.0, static since June; Statewright still ships with no LICENSE file, now 492 stars/22 forks after a push made **today** (2026-09-25). | The evidentiary comparison (contracts+hooks+CI beat prose; a harness constrains step order, not in-step measurement) has not moved. Re-evaluate the state-machine layer only if the work-loop, not the measurement layer, becomes the object of study. |

## The failure, measured (re-measured 2026-09-25)

The shape is `surface-cannot-report-state`: an instrument is run that cannot report the state
being asked about, and its answer is reported as that state.

| Fact | Value on 2026-09-17 (original) | Value on 2026-09-25 (today) |
|---|---|---|
| Total entries in `MISTAKES.md` | 29 | **141** |
| Shaped (carry a `shape:` line) | 17 | **125** |
| UNCOUNTED (no shape line) | 12 | **16** (11% of total, vs 41% at original count) |
| Instances of `surface-cannot-report-state` | 10 | **28** |
| Graduated to a law | 2026-09-17, `claude/autopilot.md` | unchanged - same event |
| Recurrences after graduation | 2, same day | **20**, per `zao-mistake due`'s own count (8 struck as pre-graduation evidence, 20 since) |
| Second graduated law | none yet | **`unmeasured-prediction-in-a-record`**, graduated 2026-09-20 into `claude/CLAUDE.md`; 12 entries, 7 struck, **5 since** - also `LAW NOT HOLDING` |
| Agents caught by the original shape in ~30 hours | 4 | not re-measured (would require a fresh transcript sweep; out of scope for this pass) |

Command that produced today's counts, run directly against the live file:

    zao-mistake due
    141 entries, 125 shaped, 16 UNCOUNTED (no shape line, so no shape is assumed)
       28  surface-cannot-report-state  GRADUATED 2026-09-17 -> claude/autopilot.md  (8 struck, 20 since)  LAW NOT HOLDING
       12  unmeasured-prediction-in-a-record  GRADUATED 2026-09-20 -> claude/CLAUDE.md  (7 struck, 5 since)  LAW NOT HOLDING

**Both original recurrences (VPS `.env` size mismatch, two-dot `git rev-list` misread) are
still in the file, unchanged in substance.** What changed is everything around them: the
estate produced 18 more instances of the same shape in eight days, and a second, unrelated-in-
surface-but-identical-in-mechanism shape (predicting or asserting a state instead of
measuring it) graduated and is repeating too.

## Findings

| # | Finding | Evidence |
|---|---|---|
| 1 | **The doc's own headline numbers were stale by roughly 5x, in the direction of understating the problem.** 141 entries, not 29; 28 of the target shape, not 10; 20 recurrences since graduation, not 2. | `grep -cE "^## " MISTAKES.md` = 141; `zao-mistake due` run 2026-09-25, quoted above |
| 2 | **A second law has graduated from the same failure family and is also not holding.** `unmeasured-prediction-in-a-record` graduated 2026-09-20 into `claude/CLAUDE.md` - visible today as the live global CLAUDE.md's "Before you write down what you did not see" section - with 12 entries, 7 struck, 5 recurrences since. Two graduated laws, eight days apart, both `LAW NOT HOLDING` from the same tool. | `zao-mistake due` output; the live `~/.claude/CLAUDE.md` section itself, dated 2026-09-19/approved |
| 3 | **The trigger field (card 9819's other half) still does not exist.** `zao-mistake add --help` has no `--trigger` argument. `grep -c '^trigger:' MISTAKES.md` = 0. The consuming hook already reads an optional `trigger:` line and needs no code change once the field ships. | `~/bin/zao-mistake` argparse dump, 2026-09-25; `~/zao-vault/notes/mistake-check-hook-design-2026-09-19.md` |
| 4 | **The PreToolUse hook is built, tested and merged - but deliberately not wired.** `bin/zao-mistake-hook` and its test suite merged as dotfiles PR #306 at commit `efdb007f` on 2026-09-19 (44/44 assertions green, advisory-only output via `additionalContext`, never `permissionDecision`). It is absent from all 13 `PreToolUse` entries in the live `settings.json`. A 2026-09-23 grill decision explicitly kept "Zaal's hand" as the wiring checkpoint, even after noting three other dotfiles PRs had self-wired. | Direct read of `zaal-dotfiles/claude/settings.json` (the file `~/.claude/settings.json` symlinks to); `~/zao-vault/handoffs/status/zj.md` 2026-09-19 entries; `~/zao-vault/decisions/grill-2026-09-23-seat-midmorning.md` |
| 5 | **The reference-file assertion shipped, but as a different tool than specified, and it does not do the exact comparison asked for.** The original doc asked for it "in the comparison path of `zao-measure`"; `zao-measure`'s source has no reference-file/size/key-count comparison logic. What shipped instead, 2026-09-20, is `zao-assert` - `exists` (prints size), `none` (refuses an empty/all-missing path set), `count` (refuses a zero denominator, prints `UNKNOWN`) - now quoted directly in the live global CLAUDE.md. It generalizes the *vacuous-claim* problem rather than building the specific two-file size/key-count check this doc named. | `~/bin/zao-measure` source (no match for "reference"/"size"/"key-count" comparison logic); `~/bin/zao-assert --help`, built 2026-09-20 per file mtime |
| 6 | **`zao-mistake due` still is not in `zao-selftest`.** `zao-selftest` was itself edited as recently as this morning (2026-09-25, unrelated fixes) and registers 40 named checks; none references `mistake` or `zao-mistake` in any form. | `grep -in "mistake" ~/bin/zao-selftest` → no output; `main()`'s check-registration list read in full |
| 7 | **Card 9819 is still open in the tracker, five days past its own due date.** `zao-tracker search "9819"` returns one row: status `todo`, due `2026-09-20`. | `~/bin/zao-tracker search "9819" --limit 5`, run 2026-09-25 |
| 8 | **ANMA and Statewright, re-measured, do not change the comparison.** `anma-labs/anma`: 2 stars, 0 forks, Apache-2.0, last push unchanged at 2026-06-13. `statewright/statewright`: 492 stars (+1), 22 forks (+1), pushed **2026-09-25** (today - the repo is active, not stale), LICENSE still absent (404) = still all rights reserved. | `gh api repos/anma-labs/anma` and `gh api repos/statewright/statewright/contents/LICENSE` (404), both run 2026-09-25 |
| 9 | **HN sources re-verified, frozen as expected.** 48108778: 126 points / 59 comments (nested-tree count matches Algolia's own `num_comments` search field exactly). 48623765: 3 points, 2 nested comments; the "13 of 19 violated / 0 of 20" figures and the module-boundary quote ("accounts is not allowed to import billing") both re-read verbatim from the raw story/comment JSON. 48558502: 1 point, 0 comments - a low-engagement Show HN whose citation rests on its own story text, not on discussion, and that has not changed. | `hn.algolia.com/api/v1/items/<id>`, all three, run 2026-09-25 |
| 10 | **"Instructions are not guarantees" and "keep checks dumb" still stand, unchanged**; this pass found no contradicting evidence. | Same HN sources, re-read, not just re-counted |

## What to build, concretely (unchanged from original, still not built)

**A. Trigger fields (card 9819, unblocks the already-merged hook).** Each MISTAKES.md entry
gains `trigger:` - a regex over the command about to run. Still not shipped as of 2026-09-25.

    trigger: git rev-list [^|]*\.\.(HEAD|origin/)   # two-dot range answering "exists anywhere?"
    trigger: (grep|comm|diff)[^|]*\.env             # comparing against an env file

**B. A reference-file assertion in the wrapper.** Still not built as the doc specified it
(section, above, Finding 5). `zao-assert` covers the *set-is-empty* and *file-is-missing*
vacuous cases; it does not print a reference file's own size/key-count before an "is X in Y"
comparison the way this doc asked for.

**C. One banned-range check.** `git rev-list A..B` may not be used to answer "does this commit
exist anywhere else." Built into `bin/zao-mistake-hook`'s ancestry trigger (merged, gated on a
live `git rev-parse --is-shallow-repository` check so it stays silent on non-shallow clones) -
this piece IS shipped, in code, and only awaits the `settings.json` paste to take effect.

**D. Report the law's health where it is read.** `zao-mistake due` already prints
`LAW NOT HOLDING` with a recurrence count for BOTH graduated shapes now. Still not present in
`zao-selftest`'s output as of 2026-09-25.

## Also See

- [dev-workflows/461](../461-push-to-merged-pr-failure-fix/) — mechanism over memory, for pushes
- [dev-workflows/2105](../2105-fact-vs-assertion-grounding-discipline/) — hooks over prompts for anything load-bearing
- [security/2292](../../security/2292-agent-guardrail-tools-landscape/) — guardrail tooling landscape
- [agents/2367](../../agents/2367-false-green-truth-lifecycle/) — false green, and why a rule beat a monitor there
- [dev-workflows/2462](../2462-claudecode-subreddit-two-month-scan/) — the graduation rule this doc tests
- Tracker card 9819 (status `todo`, due 2026-09-20, past due) — the settings.json wiring this doc still waits on
- `~/zao-vault/notes/mistake-check-hook-design-2026-09-19.md` — the built hook's own design note and coverage table (8 of 13 caught, by mechanism)
- `~/zao-vault/decisions/grill-2026-09-23-seat-midmorning.md` — Zaal's ruling that keeps settings.json wiring as his own checkpoint

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `--trigger` to `zao-mistake add`, required for new entries, optional for the 16 UNCOUNTED; backfill the 28 live `surface-cannot-report-state` entries; shipped when `grep -c '^trigger:' MISTAKES.md` is greater than 0 | @Zaal (dotfiles lane) | dotfiles PR | 2026-10-02 |
| Paste the built, tested, merged `PreToolUse` stanza (dotfiles PR #306, commit `efdb007f`) into `settings.json`; shipped when `grep zao-mistake ~/.claude/settings.json` returns a match and a scratch-repo `git rev-list origin/main..HEAD` fires the advisory | @Zaal (his hand, per the 2026-09-23 ruling) | settings.json paste | 2026-09-27 |
| Build the reference-file size/key-count assertion as originally specified (a comparison path, not just an existence check); shipped when comparing against a 94-byte file fails loudly from the tool itself, not from advisory prose | @Zaal (dotfiles lane) | dotfiles PR | 2026-10-02 |
| Wire `zao-mistake due`'s output into `zao-selftest` as a named check; shipped when `zao-selftest`'s check list includes one referencing `mistake` and it prints `LAW NOT HOLDING` as a red row when either shape is due | @Zaal (dotfiles lane) | dotfiles PR | 2026-10-01 |
| Close or re-date tracker card 9819 to match reality (it is 5 days past its 2026-09-20 due date and the code half is done); shipped when `zao-tracker search "9819"` shows a due date at or after today | @Zaal | tracker edit | 2026-09-26 |
| Re-measure both shapes' recurrence counts and update this doc's `last-validated`; shipped when the doc states the then-current `zao-mistake due` numbers for both `surface-cannot-report-state` and `unmeasured-prediction-in-a-record` | @Zaal | Re-research | 2026-10-06 |

## Sources

- [HN 48558502 — Show HN: A policy gate that runs before your AI coding agent's tool calls](https://news.ycombinator.com/item?id=48558502) — **[FULL, method: hn.algolia.com API]** re-verified 2026-09-25: 1 point, 0 comments, frozen since original 2026-09-17 read
- [HN 48623765 — Show HN: ANMA, boundary contracts for cheaper AI coding agents](https://news.ycombinator.com/item?id=48623765) — **[FULL, method: hn.algolia.com API, post + comment tree]** re-verified 2026-09-25: 3 points, 2 nested comments; "13 of 19 violated / 0 of 20" and the module-boundary quote re-read verbatim, unchanged
- [HN 48108778 — Show HN: Statewright](https://news.ycombinator.com/item?id=48108778) — **[FULL, method: hn.algolia.com API, post + nested comment count cross-checked against Algolia's `num_comments` search field]** re-verified 2026-09-25: 126 points, 59 comments, exact match to original citation
- [github.com/anma-labs/anma](https://github.com/anma-labs/anma) — **[FULL, method: gh api + LICENSE file read]** re-verified 2026-09-25: Apache-2.0, 2 stars, 0 forks, pushed 2026-06-13 - unchanged
- [github.com/statewright/statewright](https://github.com/statewright/statewright) — **[FULL, method: gh api + LICENSE-path 404 check]** re-verified 2026-09-25: 492 stars (was 491), 22 forks (was 21), pushed **2026-09-25** (today), no LICENSE file = all rights reserved, unchanged
- [Claude Code hooks reference](https://docs.claude.com/en/docs/claude-code/hooks) — **[FULL, carried forward]** not re-fetched this pass; independently re-confirmed against Claude Code 2.1.278 by a separate local artifact (`~/zao-vault/notes/mistake-check-hook-design-2026-09-19.md`) on 2026-09-19, and nothing found this pass contradicts `PreToolUse` / `permissionDecision` / exit-code semantics
- r/ClaudeAI and r/ClaudeCode on this topic — **[NOT RE-ATTEMPTED 2026-09-25]** this doc cites no live Reddit thread and the fetch-quality gate treats this as optional when there is nothing to re-fetch; original 2026-09-17 attempt remains **[FAILED, method: `zao-fetch-reddit.sh --selftest`: token endpoint 401, OAuth API 403, public `.json` returned text/html, 0 of 3 redlib instances answered]**
- Local, read/run directly 2026-09-25: `~/zao-vault/MISTAKES.md` (141 entries, up from 29), `~/bin/zao-mistake` (source + `due` output), `~/bin/zao-mistake-hook` (exists, built 2026-09-19, not wired), `~/bin/zao-assert` (built 2026-09-20, help text), `~/bin/zao-measure` (source, no reference-file comparison), `~/bin/zao-selftest` (source, 40 registered checks, none named `mistake`), `~/.claude/settings.json` / `zaal-dotfiles/claude/settings.json` (symlink confirmed, 13 `PreToolUse` entries, none is `zao-mistake`), `~/bin/zao-tracker search "9819"`, `~/zao-vault/decisions/grill-2026-09-23-seat-midmorning.md`, `~/zao-vault/handoffs/status/zj.md` (PR #306 merge detail) — **[FULL]**
