---
topic: agents
type: audit
status: research-complete
last-validated: 2026-09-24
superseded-by:
related-docs: "2475, 2540, 2423, 2436, 2246, 1176"
original-query: "we are about to reach out context window and can we /zao-research on ways to best conserve context and memory between working sesisobne bettween differnt agents aswell"
tier: STANDARD
---

# 2550 - Carrying State Across Compactions and Across Agents: What Held, Measured

> **Goal:** Two questions. (A) How does a single agent carry state across its own compactions and restarts? (B) How do separate agents share state without re-deriving it? The primary source is this estate's own last twenty hours (2026-09-23 12:37Z to 2026-09-24 08:44Z), measured from disk. External sources are secondary. Where the two disagree, the estate's numbers win and the doc says so.

## Key Decisions

| # | Decision | Evidence (measured here unless marked) |
|---|---|---|
| 1 | **STOP graduating lessons into always-loaded prose and calling them fixed. A lesson is fixed when a mechanism refuses the failure at the surface where it happens.** | The two graduated laws are both `LAW NOT HOLDING` (`zao-mistake due`, 2026-09-24). `surface-cannot-report-state` has **16 of 24** entries logged after it graduated into `claude/autopilot.md`. `unmeasured-prediction-in-a-record` has **4 of 11** after it graduated into `claude/CLAUDE.md`, which every session on this Mac loads. |
| 2 | **A mechanism protects exactly one surface. List the surfaces a shape occurs on, and guard each one.** | `fabricated-identifier` has 3 entries since `sendmessage-sha-check` landed (2026-09-15, `5408c53`). The one on the guarded surface, a SendMessage (2026-09-24), was **refused**. The other two, a CI poll on a padded SHA (2026-09-20) and `zao-merge --head` with a padded SHA (2026-09-21), happened on surfaces the guard does not see, and were stopped only by luck. |
| 3 | **After a compaction, treat the summary as an INDEX of what to re-read, never as evidence. Re-run or re-read before stating any specific.** | Minutes after this lane's own compaction, it sent a peer two sentences the summary did not contain and nothing had measured ("Windows-side tooling writes BOM-prefixed files", "your non-over-firing test holds"). The peer committed one into a code comment. It was retracted and logged as `peer-claim-recorded-as-measurement` (vault `b8863b09`). The same shape is reported outside the estate (HN 47096210, below). |
| 4 | **Re-query live state at resume, mechanically. USE a `SessionStart` hook on the `compact` source to print pointers fetched fresh from the tracker, `gh` and git, not from the summary.** | Claude Code fires `SessionStart` again after a compaction (hooks docs, below), and `zao-lane-context.sh` already runs there. The seat's pre-compact handoff carried **two wrong facts** forward verbatim: a 950,400-invocation baseline, and "6-7pm EST" for an EDT date. Both were caught later by re-verification, not by the handoff. |
| 5 | **Carry pointers, not prose. A card id, PR number, head SHA or path is state a reader can re-fetch. A paragraph is a claim frozen at write time.** | The seat's pre-compact entry is **653 words / 4,375 characters in one paragraph**. The file holding it, `handoffs/status/zj.md`, is **471,680 bytes** (about 118k tokens at 4 chars/token), larger than any agent can load whole. `BLACKBOARD.md` is 162,099 bytes. Anthropic's harness post (below) landed on a JSON feature list plus git for the same reason. |
| 6 | **One path per concept, rewritten in place. A memory surface that forks on write stops being memory.** | By 05:30 on 2026-09-24 Zaal had **five** clipboard pages, each claiming to be his todo list, and the newest was not the most complete. zaal-dotfiles #360 (`zao-tclip`) replaces them with one path. `.handoffs/` bundles are gitignored, so they are invisible to every other machine: the same disease, one level down. |
| 7 | **Between agents, messages are transport and the record is a card, a vault file or a PR body. Send the pointer plus the delta, and let the reader fetch the rest.** | 80 messages, about 127,000 characters, passed between two lanes in 20 hours (this lane's transcript, below). How much of that restated state a pointer would have carried is **UNKNOWN**: it needs a per-message judgement no script here makes. |
| 8 | **Peer verification caught every defect that shipped nowhere, and it does not scale. Turn each recurring catch into a test or guard, so the check outlives the reviewer.** | About 10 defects were caught by the other agent re-running a measurement (table in Findings C). Every one that recurred became a test in the PR that fixed it. Pairwise checking grows as n squared in the number of agents; a test left behind costs nothing to re-run. |

## Findings

### A. One agent, across its own compactions

**What the compaction summary carried, and what it did not.** This lane was compacted once, mid-afternoon on 2026-09-23. The summary Claude Code produced carried these, and each was used without re-deriving:
- the task list
- the standing constraints (never check out a branch in `~/zaal-dotfiles`, commit the vault by pathspec, `zao-merge` only)
- the scratchpad paths holding in-flight review blobs
- the pending review verdict

It did **not** carry exact tool output. Every specific the lane needed afterwards was re-run: the BOM result was re-executed against the extracted blob before being restated.

The one failure was **filling a gap**: two sentences in the first post-compaction message had no source in the summary or on disk. That is decision 3. The summary also named the full transcript path (`~/.claude/projects/.../66d007cc-....jsonl`), and the lane never opened it. When a specific was missing, it re-ran the command or, once, invented the gap.

**The seat's pre-compact handoff, read against what followed.** `handoffs/status/zj.md` ends its 2026-09-23 day with a `PRE-COMPACT` entry stamped `HANDOFF-READY 2026-09-23 19:59`, which `auto-compact.sh` parses.
- **What carried:** its rulings, card numbers and PR numbers were acted on afterwards.
- **What carried wrongly:** it also carried the "950,400 invocations of a 1,000,000 limit" baseline and "Friday 6-7pm EST". Both were later corrected by a second agent re-measuring. A handoff preserves errors exactly as faithfully as facts.
- **Not measured:** which parts of that entry the seat used versus re-derived. Only the seat's own transcript can answer that, and it was not read. That is a prediction left open, not a finding.

**Size is the constraint the estate keeps hitting.**

| Surface | Bytes (2026-09-24) | Loadable whole? |
|---|---|---|
| `~/.claude/CLAUDE.md` (always loaded) | 10,905 | yes |
| `zao-vault/BLACKBOARD.md` | 162,099 | no, read by section |
| `zao-vault/MISTAKES.md` | 173,580 | no, read through `zao-mistake due` |
| `zao-vault/handoffs/status/zj.md` | 471,680 | no, read by tail |

A surface nobody can read whole is read by tail or by grep, so its structure decides what survives. `MISTAKES.md` works because `zao-mistake due` reads it structurally; `zj.md` has no such reader.

**Claude Code's own mechanics (docs, fetched 2026-09-24):**
- Project-root `CLAUDE.md` is re-read from disk after `/compact`, and conversation-only instructions are lost.
- `PreCompact` can block compaction (exit 2).
- `SessionStart` fires again "after /clear or a compaction".

So the platform already provides the two hook points decision 4 needs.

### B. Separate agents, sharing state

**Where durable facts landed.** Across the two lanes' 80 messages, every fact that mattered was also written to a card note (`zao-tracker note`/`ruling`), a vault file, or a PR body. Messages then pointed at those places. The measured pointer counts:

| Direction | Messages | Characters | Median length | Card refs | PR refs | SHA-like tokens | File paths |
|---|---|---|---|---|---|---|---|
| Seat to this lane (deduped) | 23 | 62,926 | 2,751 | 62 | 61 | 40 | 12 |
| This lane to seat | 57 | 64,236 | 1,024 | 84 | 104 | 106 | 22 |

Method: parsed this lane's transcript for `<cross-session-message>` blocks and `SendMessage` calls, regex counts. Card refs are 4-digit `9xxx` or "card N"; PR refs are `#NNN`; SHA-like tokens are 7-40 lowercase hex. It overcounts slightly, because some hex-shaped tokens are not SHAs.

What the table does not say: whether a message **restated** something a pointer already carried. The seat's messages routinely restate a PR's own evidence while confirming they re-ran it. That is verification, not waste, and no regex separates the two. **Restated-vs-pointed is UNKNOWN.**

**The guards that carried state correctly between agents**, observed in this window:
- the SHA guard refused two of the seat's messages (a typed placeholder commit, and a bare tree hash)
- the tracker's money guard refused doc 2509 r6
- `zao-merge`'s claims check made the seat cite context paths before merging
- `zao-merge` refused ZAOstock #294 for deleting 141 unvouched lines
- `zao-doc-actions` returned UNKNOWN instead of duplicating card 9655

**Denominator caveat:** `sendmessage-sha-check` logs only its own errors to `~/.zao/sha-check.log` (2 lines), never its refusals. So its "near-perfect record" is also unmeasured. A guard's misses are invisible for the same reason a rule's successes are.

### C. The law-versus-mechanism test

Doc 2475 recorded **~100%** for structurally enforced steps (PR format, 30 of 30) and **3-40%** for honour-system ones (`zao-doc-next` 3.6%, tracker rows 6.9%, HR10 25%). This window tests that claim three ways:

| Test | Result | Verdict on the claim |
|---|---|---|
| Rules written into always-loaded context | 2 of 2 graduated laws not holding; 20 of 35 entries logged after graduation | **holds** - prose did not change behaviour |
| A guard on its own surface | SHA guard: 1 of 1 SendMessage fabrication refused | **holds, n=1** |
| The same shape on an unguarded surface | 2 of 2 escaped the guard (CI poll, `zao-merge --head`) | **refines the claim**: ~100% is per surface, not per shape |

**The asymmetry to state plainly.** Law failures are counted, because a human notices and logs them. Guard failures are not, because nothing logs a refusal or a miss. The comparison is therefore biased against rules. The direction still holds: 20 logged failures of loaded rules, against 0 observed failures of a guard on its own surface. The magnitude does not hold until guards log their refusals.

**Peer verification in this window**: each defect was caught by the other agent re-running, not reading.

| Defect | Found by | Became |
|---|---|---|
| BOM-only file passed the preflight empty-scan guard | this lane | tests in zaal-dotfiles #351 |
| Four more invisible-character inputs passed | this lane | category-based check plus tests (#351) |
| `--file` bypassed the shared-doc-number guard | seat | tests in #352 |
| A four-letter name was invisible to the lookalike matcher (2509 r4 vs card 9655) | seat | tests in #354 |
| 1073 verdict counts off by one, twice | seat | counted by `awk` in the PR body |
| Migration 028's merge date stated as its ruling date | seat | PR #295 body and card 1117 corrected |
| A peer claim committed as measurement | this lane (retraction) | MISTAKES `b8863b09` |
| #3540 reversed a standing ruling without citing it | this lane | Zaal ratified it 2026-09-24; card 9772 closed with the supersession |
| ZAOstock #297: four claims stronger than their sources | this lane | fixed in #297 |
| A vacuous red control in #358 | this lane, by mutation | test comment in #358 |

Nothing wrong shipped from these. The cost was roughly one extra turn per catch per agent, and with two agents that is affordable. With N agents each checking the others it is N(N-1), which is why decision 8 moves the check into a test the first time it is found.

### D. External sources against the estate

| Source | What it says | Agrees with the estate? |
|---|---|---|
| Anthropic, *Effective context engineering* | Names three techniques for long horizons: "compaction, structured note-taking, and multi-agent architectures"; defines context rot | Yes on note-taking. It does not measure compliance, so it says nothing on decision 1. |
| Anthropic, *Effective harnesses for long-running agents* | A `claude-progress.txt` plus git history. A JSON feature list because "the model is less likely to inappropriately change or overwrite JSON files compared to Markdown files" | **Yes on decision 5**: structured state over prose, verified by a test run at session start |
| Cognition, *Don't Build Multi-Agents* | "Share context, and share full agent traces, not just individual messages"; "Actions carry implicit decisions" | **Partly contradicts decision 7.** Here, full traces cannot be shared (471 KB status files), so the estate shares pointers to a single record instead. Cognition's alternative, a single-threaded agent, is not available to a fleet of lanes. |
| MemGPT (arXiv 2310.08560) | "virtual context management" across memory tiers | The estate's tiers already exist: context, then vault and tracker, then git. What was missing was re-fetching at resume (decision 4). |
| Claude Code memory docs | Root `CLAUDE.md` survives `/compact`; conversation-only instructions do not | Survival is not compliance: the file is re-injected, and the graduated laws in it still did not hold |
| HN 47096210, "compaction discards data that's still on disk" | A commenter: the summary said "user provided DOM markup" but the content was gone; "Claude started guessing" | **Same shape as this lane's post-compaction invention** (decision 3) |
| HN 45347532, HumanLayer's *Getting AI to work in complex codebases* (517 points, 418 comments) | Research, then plan, then implement, with intentional compaction between phases; the commenters are split on whether it is overkill | Neutral: a workflow discipline, not a mechanism |

### What cannot be mechanised, and why

- **Deciding which sentence is load-bearing.** No guard knew that "the bot owns it" (Zaal, 2026-09-16) and #3540 contradicted each other. A reader held both in mind. The only mechanical piece is to make supersession explicit when it happens (card 9772's note), so the next reader does not need to hold both.
- **Interpreting a ruling.** "Zaal + X" owners were refused rather than resolved, because the plus sign is the only record of a second person. A tool can refuse; it cannot decide.
- **Whether a message restates state or verifies it.** See B.

## Also See

- [Doc 2475](../../dev-workflows/2475-research-system-internal-audit/) - the ~100% vs 3-40% measurement this doc tests
- [Doc 2540](../2540-lane-flow-estate-audit/) - the lane-flow audit (1 flipped done-list item of 66)
- [Doc 2423](../2423-vault-as-transport-inter-terminal-context/) - vault as transport between terminals
- [Doc 2436](../2436-bounded-memory-prefix-file/) - a budgeted prefix file for memory
- [Doc 2246](../2246-claude-code-cross-session-messaging/) - SendMessage adoption
- [Doc 1176](../1176-loop-memory-compact-protocol-audit/) - the earlier loop-memory compact audit
- `.claude/rules/handoff-discipline.md` - "a message is transport, never the record"
- Tracker pre-check (2026-09-24): `zao-tracker search compaction` returned one done card, `src=loop-memory` (the doc 1176 audit); `context window` returned nothing.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Add a `SessionStart` `compact`-source step to `zao-lane-context.sh` that prints the lane's open PRs with head SHAs (`gh`), the cards it last noted (`zao-tracker`), and the resume rule "the summary is an index; re-run before restating". Shipped when a compacted lane's first screen shows live heads that differ from the summary's where the summary is stale. | @Zaal (built by the dotfiles2 lane) | PR, zaal-dotfiles | 2026-09-26 |
| Make `sendmessage-sha-check` append every DENY (timestamp, sender, token, no message body) to `~/.zao/sha-check.log`, so the guard's record has a denominator. Shipped when the log grows by one line per refusal in the test suite. | @Zaal (built by the dotfiles2 lane) | PR, zaal-dotfiles | 2026-09-26 |
| Extend identifier verification to the two surfaces `fabricated-identifier` escaped through: `zao-merge --head` (refuse a SHA the API cannot resolve) and SHA-keyed CI polling. Shipped when both refuse a padded 40-character SHA in tests. | @Zaal (built by the dotfiles2 lane) | PR, zaal-dotfiles | 2026-09-28 |
| Decide the PreToolUse refusal of `\b`/`\w`/`\d` in `grep -E` / `git grep -E` patterns (the `surface-cannot-report-state` instance of 2026-09-24). Shipped when the ruling is in `decisions/` and, if yes, the hook is merged. | @Zaal | Decision | 2026-09-25 |
| Merge zaal-dotfiles #360 (`zao-tclip`, one todo path rewritten in place). Shipped when `~/bin/zao-tclip` resolves and today's list is a single page. | @Zaal | PR review | 2026-09-25 |

## Sources

Estate (primary, all read 2026-09-24):
- `zao-mistake due` output - [FULL, command run]: 123 entries, 107 shaped, two laws not holding
- `zao-vault/MISTAKES.md` - [FULL, parsed by script]: `fabricated-identifier` entries 2026-09-20/21/24 and their consequences
- `zao-vault/handoffs/status/zj.md` - [FULL for the PRE-COMPACT entry, line 4637; file size by `wc -c`]
- This lane's transcript `~/.claude/projects/-Users-zaalpanthaki/66d007cc-e941-40a7-95e6-161973a30036.jsonl` - [FULL, parsed by script for message counts]
- `bin/sendmessage-sha-check` at zaal-dotfiles origin/main; added `5408c53` 2026-09-15 - [FULL, read]
- zaal-dotfiles #360 body - [FULL, `gh pr view`]
- ZAOOS doc 2475, line 25 and table rows 110-121 - [FULL, `git show`]

External (fetched with `curl` plus an HTML strip, so quotes are from the raw page text, not a model summary):
- [Anthropic - Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) - [FULL, 22,842 chars]
- [Anthropic - Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) - [FULL, 14,919 chars]
- [Cognition - Don't Build Multi-Agents (Walden Yan, 2025-06-12)](https://cognition.ai/blog/dont-build-multi-agents) - [FULL, 11,380 chars]
- [Claude Code docs - How Claude remembers your project](https://code.claude.com/docs/en/memory) - [FULL, 44,538 chars]
- [Claude Code docs - Hooks reference (PreCompact, SessionStart)](https://code.claude.com/docs/en/hooks) - [FULL, 214,708 chars]
- [MemGPT: Towards LLMs as Operating Systems (arXiv 2310.08560)](https://arxiv.org/abs/2310.08560) - [PARTIAL - abstract page only, not the full paper; the one claim used is in the abstract]
- [HN 47096210 - Claude Code's compaction discards data that's still on disk](https://news.ycombinator.com/item?id=47096210) - [FULL, 16 comments via the Algolia items API]
- [HN 45347532 - Getting AI to work in complex codebases](https://news.ycombinator.com/item?id=45347532) - [FULL, 398 comments via the Algolia items API, filtered by keyword for quotes]
- Reddit r/ClaudeAI search "compaction handoff" - [FAILED - `curl` returned 403; `zao-fetch-reddit.sh` has no OAuth credentials (exit 2); `gstack browse` returned the HTML search page, not JSON. The community requirement is met by the two HN threads.]
