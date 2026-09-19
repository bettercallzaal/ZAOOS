---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-09-17
superseded-by:
related-docs: "461, 2105, 2292, 2367, 2462"
original-query: "STANDARD - Why written lessons do not hold for coding agents, and what mechanisms do: the surface-cannot-report-state failure shape (10 instances in our estate, graduated to a law in claude/autopilot.md this morning, recurred twice since). Focus: enforcement mechanisms at the point of failure (hooks, gates, wrappers, typed instruments) versus prose rules; evidence from agent-harness practice; what to build so an instrument cannot answer a question it does not measure."
tier: STANDARD
---

# 2499 — A law that graduated this morning broke twice by evening: enforce at the instrument, not in prose

> **Goal:** Say why writing a failure down as a rule does not stop it, using a shape that
> graduated to a law and recurred the same day, and specify the one mechanism that would have
> caught both recurrences.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **BUILD the trigger field before the hook** (tracker card 9819). A `trigger:` / `pattern:` line per MISTAKES.md entry, matched against the tool call the agent is about to make. | Zaal already approved the hook. Without a machine-matchable field the hook is a no-op: 12 of 29 entries carry no shape at all and none carries a pattern. |
| 2 | **ENFORCE at the instrument, not at the lookup.** Ship `zao-measure`-style wrappers that refuse to answer a question they do not measure: a comparison names its reference file and prints that file's size and key-count; an "exists nowhere" check refuses a two-dot range. | Both recurrences today were a correct command answering a question nobody asked it. A MISTAKES.md lookup before the call would not have fired, because neither call was destructive. |
| 3 | **KEEP graduation, DROP the belief that graduation is enforcement.** A law in `claude/autopilot.md` is a prompt; it competes for attention with everything else in context. | Measured here: shape graduated 2026-09-17, recurred twice the same day, tool now prints `LAW NOT HOLDING`. |
| 4 | **COPY the ANMA result, not its product:** simple, boundary-shaped checks beat complex semantic ones. | Its own benchmark: cheap model ignored architecture rules **13 of 19 runs** with prose, **0 of 20** with contracts plus hooks plus CI. |
| 5 | **DO NOT build a state machine for this** (Statewright, 491 stars). It constrains which step runs next; our failure is inside one step that ran correctly. | Wrong layer for this shape. Re-evaluate for the work-loop, not for measurement. |

## The failure, measured

The shape is `surface-cannot-report-state`: an instrument is run that cannot report the state being
asked about, and its answer is reported as that state.

| Fact | Value |
|---|---|
| Instances in `MISTAKES.md` | **10** (of 29 entries; 17 shaped, 12 UNCOUNTED) |
| Graduated to a law in `claude/autopilot.md` | 2026-09-17, morning |
| Recurrences after graduation, same day | **2** (`zao-mistake due` prints `LAW NOT HOLDING`) |
| Agents caught by it in ~30 hours | 4 (three lanes and the seat, twice) |

**Recurrence 1 (mine, 19:0x).** Asked "do these 18 secrets exist anywhere else?", compared against
`~/zao-bot-live/.env` — a **94-byte** file — instead of `~/zao-bot-live/bot/.env` (**2197 bytes**).
Reported 12 of 18 names as unique. Truth, re-measured on the host: **18 of 18 present, 18 identical
values, 0 unique**. Consequence: Zaal was one paste from writing a 19th copy of live secrets to
preserve nothing.

**Recurrence 2 (mine, same message).** Asked "does anything exist only in this checkout?", ran
`git rev-list origin/main..HEAD` = 0 and reported "no unpushed commits". That range answers whether
**main** is ahead. `git rev-list --branches --not --remotes` returns **15**, and a per-SHA lookup
against the GitHub API 404s for **6** of them — a hotfix, 26 vitest cases, three documents, existing
on that box and nowhere else. Consequence: archiving on that basis destroys them.

**Both commands were correct. Both answered a question I did not ask.** That is why a rule saying
"verify your instrument" does not bite: at the moment of the call, the command looks like the right
command, and nothing in the loop disagrees.

## Findings

| # | Finding | Evidence |
|---|---|---|
| 1 | **"Instructions are not guarantees" is the industry's phrasing of our own result.** A security engineer put the same guidance in CLAUDE.md, AGENTS.md, memory files, MCP descriptions and tool docs; the agent still grepped the whole repo and used deprecated APIs. His conclusion: prompts and rules solve different problems. | HN 48558502 (Show HN, policy gate before tool calls) |
| 2 | **The only hard number found says gates work and prose does not.** ANMA benchmarked Haiku 4.5 on architecture rules: **13 of 19 runs violated** with prose rules, **0 of 20** with YAML contracts + hooks + CI. | HN 48623765; repo `anma-labs/anma`, Apache-2.0, 2 stars, last push 2026-06-13 |
| 3 | **Keep the checks dumb.** ANMA's author, asked how contracts stay strict without becoming brittle: module-boundary checks such as "accounts is not allowed to import billing", not semantic code checks. | HN 48623765 comment thread |
| 4 | **The harness, not the model, is where reliability is bought.** Statewright's author (20+ years, ex-NVIDIA/AMD) built visual state machines so smaller models stay inside a smaller solution space: "the models are good enough, the harness operating them is what's holding things back". 491 stars, 236 commits by one author, **no licence file (all rights reserved)**. | HN 48108778 (126 pts, 59 comments); `gh api`, LICENSE absent |
| 5 | **Our own library said this in May and it did not transfer.** `dev-workflows/461` chose mechanism over memory for pushes ("Memory is loaded but not consulted at push time"); `dev-workflows/2105` made it a rule ("USE hooks, not prompt instructions, for anything load-bearing. A hook executes at the system level regardless of what the model attends to"). Both are correct and neither stopped today's two. | Local docs, read 2026-09-17 |
| 6 | **The gap is coverage, not conviction.** Our hooks guard *destructive or outbound* actions (`.husky/pre-commit`, `bin/zao-no-picker-guard`, the SendMessage SHA check that blocked a message in this same session). Nothing guards a **read** that will be reported as a fact, and every instance of this shape is a read. | `scripts/agents/zao-wall.py`, `.husky/pre-commit`, settings hook list |
| 7 | **Claude Code's hook contract is strong enough to do it.** `PreToolUse` reads the call on stdin and returns `permissionDecision: "deny"` with a reason, or exits 2 to block; the deny reason is shown to the model. That is the same mechanism the picker guard uses. | docs.claude.com/en/docs/claude-code/hooks, fetched raw 2026-09-17 |
| 8 | **A lookup-shaped hook would not have caught either recurrence.** Card 9819 proposes checking MISTAKES.md before *destructive* actions. Today's two were `grep` and `git rev-list`. The check has to sit on the instrument, not on the danger. | Card 9819; this doc's two recurrences |

## What to build, concretely

**A. Trigger fields (card 9819, unblocks the approved hook).** Each MISTAKES.md entry gains
`trigger:` — a regex over the command about to run. The two from today:

    trigger: git rev-list [^|]*\.\.(HEAD|origin/)   # two-dot range answering "exists anywhere?"
    trigger: (grep|comm|diff)[^|]*\.env             # comparing against an env file

**B. A reference-file assertion in the wrapper.** Before any "is X in Y" comparison, the wrapper
prints Y's size and key-count and requires them to be plausible. A 94-byte file claiming to be an
estate env fails that assertion, and the 2197-byte file passes it. This is the check that would
have stopped recurrence 1 at the moment it happened, with no rule to remember.

**C. One banned-range check.** `git rev-list A..B` may not be used to answer "does this commit exist
anywhere else"; the hook answers with the two commands that do (`--branches --not --remotes`, then a
per-SHA remote lookup). This is a five-line matcher and it is the whole of recurrence 2.

**D. Report the law's health where it is read.** `zao-mistake due` already prints `LAW NOT HOLDING`
with a recurrence count. Put that line in `zao-selftest` so a law that is being broken is a red
check rather than a number nobody runs.

## Also See

- [dev-workflows/461](../461-push-to-merged-pr-failure-fix/) — mechanism over memory, for pushes
- [dev-workflows/2105](../2105-fact-vs-assertion-grounding-discipline/) — hooks over prompts for anything load-bearing
- [security/2292](../../security/2292-agent-guardrail-tools-landscape/) — guardrail tooling landscape
- [agents/2367](../../agents/2367-false-green-truth-lifecycle/) — false green, and why a rule beat a monitor there
- [dev-workflows/2462](../2462-claudecode-subreddit-two-month-scan/) — the graduation rule this doc tests

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `trigger:` to `zao-mistake add` (required for new entries, optional for the 12 UNCOUNTED) and backfill the 10 `surface-cannot-report-state` entries; shipped when `zao-mistake due` prints a trigger count | @Zaal (dotfiles lane) | dotfiles PR | 2026-09-20 |
| Ship the PreToolUse matcher for the two triggers in section A and C; shipped when a `git rev-list main..HEAD` in a lane is denied with the two correct commands in the reason | @Zaal (dotfiles lane) | dotfiles PR | 2026-09-22 |
| Wire the hook into settings.json (permission surface, Zaal's hand) ; shipped when a red control in a scratch repo is denied | @Zaal | settings.json paste | 2026-09-22 |
| Add the reference-file assertion (section B) to the comparison path of `zao-measure`; shipped when comparing against a 94-byte file fails loudly | @Zaal (dotfiles lane) | dotfiles PR | 2026-09-24 |
| Add `zao-mistake due` to `zao-selftest` so `LAW NOT HOLDING` is a red check; shipped when selftest reports it | @Zaal (dotfiles lane) | dotfiles PR | 2026-09-24 |
| Re-measure this shape's recurrence count 14 days after the hook lands; shipped when this doc's `last-validated` is updated with the number | @Zaal | Re-research | 2026-10-06 |

## Sources

- [HN 48558502 — Show HN: A policy gate that runs before your AI coding agent's tool calls](https://news.ycombinator.com/item?id=48558502) — **[FULL, method: hn.algolia.com API]** verified 2026-09-17
- [HN 48623765 — Show HN: ANMA, boundary contracts for cheaper AI coding agents](https://news.ycombinator.com/item?id=48623765) — **[FULL, method: hn.algolia.com API, post + comment tree]** verified 2026-09-17
- [HN 48108778 — Show HN: Statewright](https://news.ycombinator.com/item?id=48108778) — **[FULL, method: hn.algolia.com API, post + 5 comments]** verified 2026-09-17
- [github.com/anma-labs/anma](https://github.com/anma-labs/anma) — **[FULL, method: gh api + LICENSE file read]** Apache-2.0, 2 stars, pushed 2026-06-13
- [github.com/statewright/statewright](https://github.com/statewright/statewright) — **[FULL, method: gh api + zao-research-snapshot]** 491 stars, 21 forks, no LICENSE file = all rights reserved, pushed 2026-09-16
- [Claude Code hooks reference](https://docs.claude.com/en/docs/claude-code/hooks) — **[FULL, method: curl + HTML strip, 212,575 chars]** `PreToolUse`, `permissionDecision: deny`, exit code 2 semantics verified 2026-09-17
- r/ClaudeAI and r/ClaudeCode on this topic — **[FAILED, method: `zao-fetch-reddit.sh --selftest` 2026-09-17: token endpoint 401 (no creds), OAuth API 403, public `.json` returns text/html, 0 of 3 redlib instances answered]** Not substituted with search snippets. The Chrome route in the skill was not attempted this run.
- Local, read directly: `MISTAKES.md` (29 entries), `~/bin/zao-mistake`, `bin/zao-no-picker-guard`, `.husky/pre-commit`, `scripts/agents/zao-wall.py`, tracker card 9819 — **[FULL]**
