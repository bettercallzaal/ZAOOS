---
topic: agents
type: audit
status: research-complete
last-validated: 2026-10-01
superseded-by:
related-docs: "2423, 2456, 2581, 2118, 2036"
original-query: "/zao-research agent context improves"
tier: STANDARD
---

# 2582 - How agent context improves: what moved the needle between terminals on 2026-09-30 and 10-01, tested against outside practice

> **Goal:** Name what measurably improved the context one agent session has about another in the ZAO estate over the last two days, rank those moves against what Anthropic, Cognition and LangChain say improves agent context, and say which of the outside techniques ZAO already runs, which it should adopt after 4 Oct, and which it should skip.

Written by the context lane (brief `handoffs/context.md` in zao-vault), the lane whose only job is the context layer between terminals. Every ZAO number below was measured by that lane on 2026-10-01 and is logged, with its command, in `zao-vault/handoffs/status/context.md`.

## Key Decisions

| # | Decision | Evidence | Confidence | Owner, by when |
|---|---|---|---|---|
| 1 | **Context between terminals improved most where a MEASUREMENT replaced a MEMORY, not where more context was shared.** The hourly census (lint, untracked count, clone ahead/behind, scripts-behind-origin) caught every defect of the day; every wrong claim of the day came from a session reading a surface it had not measured. | 13 census ticks on 2026-10-01, 11:35 to 21:03; 5 false claims by 4 lanes, all from the stale shared clone (ahead 4 to 15, behind 16 to 113 across the day) | A | Keep the census; seat, running |
| 2 | **Provenance on every cross-session message is the single biggest improvement to agent context ZAO shipped this week, and no outside source has an equivalent.** `agent-msg.py --basis measured|relayed|inference|mixed` (zao-vault PR #39, #40, 2026-09-30) refuses a relayed approval; Orca's inbox, Microsoft's A2A guidance and the Alook/Starkslab handoff posts carry typed messages with no basis field. | agent-msg.py lint: 47 envelopes, 8 measured, 1 mixed, 5 relayed, 33 pre-basis; doc 2581 KD4 | A | Shipped; keep |
| 3 | **ADOPT Anthropic's three primitives in the order the cookbook ranks them by lossiness: tool-result clearing (lossless if re-callable), then memory notes (lossless on what is saved), then compaction (lossy by design).** ZAO runs the last two (`/precompact`, status files, done-lists) and the first not at all. | Claude Cookbook, measured: baseline peak 335,279 tokens over 5 turns on a 1M window; the same run on a 200K window stops mid-task at 168,242 tokens; triggers in the notebook are clearing at 20,000 and compaction at 50,000 tokens | B | Dotfiles, after 4 Oct: tool-result clearing in the seat's loop, card it |
| 4 | **Cognition's two principles are what the census enforces by hand: share full traces, and never let two actors act on conflicting implicit decisions.** The shared `~/zao-vault` clone violated both all day: 4 lanes committed into it, 3 re-landed by hand, 2 hourly tools re-diverge it every hour. | Cognition, "Don't Build Multi-Agents", 2025-06-12 (FULL); census ahead list, 13 ticks | A | Card 10208 (Dotfiles, Sunday): tools write through a worktree, never the clone |
| 5 | **The Anthropic multi-agent system's 15x token cost is the price of the orchestrator never holding the messy work, and ZAO pays it in the right place.** The seat routes and never builds; lanes hold the work; the context lane holds the comms layer. That is doc 2456 KD2 confirmed by the outside number. | Anthropic, multi-agent research system: agents use about 4x the tokens of chat, multi-agent systems about 15x; token usage explains 80 percent of performance variance | B | No change |
| 6 | **SKIP shared-state wikis, memory banks and "handoff ledgers" as the next investment.** Every post found this week that proposes one (Alook, Starkslab, Aident, lean-ctx) proposes a surface with no provenance and no check that can fail. ZAO already has the vault and already measured that it eats briefs (doc 2423). | 8 results of the second search; HN 44432596 top comment: "memory-bank pattern ... wasting a significant number of tokens" | A | No build |
| 7 | **A detector that cannot go red is the recurring defect in context tooling, and it is ZAO's, not the field's.** Three instances in one day by this lane: a frontmatter check that passes bare files (card 10206), a grill check that counted struck items as open, a git stat count truncated by an ellipsis. | `handoffs/status/context.md`, 2026-10-01, three corrections written as annotations | A | Every new census line ships with the value it would read if the feared thing had happened |

## What improved, measured (ZAO, 2026-09-30 to 10-01)

| Move | Before | After | Surface |
|---|---|---|---|
| Basis field on envelopes | 33 envelopes with no provenance | every envelope since 09-30 10:04 carries `basis:`, `verify:` never blank | `python3 scripts/agent-msg.py lint` |
| Ack subcommand | no writer for `read_by` (added in d157ea8c, 10:31) | 2 acked at 11:35, 21 acked by 12:35 | same |
| Sender commits its own envelope | 1 of 44 untracked at 11:3x (the seat's) | 0 untracked at every tick after | `git status --porcelain -- inbox/agents` in both trees |
| Census carries the clone's state | lanes read tools from a clone 16 to 113 commits behind and reported defects that did not exist on origin (4 lanes) | "~/zao-vault scripts are N commits behind origin" printed every tick | `git -C ~/zao-vault status -sb` |
| Orca worktree comments | 9 of 35 rows carried one | 15 of 35, every active lane | `orca worktree ps --json`, `orca worktree show` |
| Name map, worktree directory vs status-file lane | none; exact-name join hit 5 of 15 live lanes | 12-row table in `handoffs/status/context.md` | lane-route.sh vs ps |
| Non-recipient acks | invisible inside the ack count | listed separately: 9 (8 seat-for-vault, 1 Dotfiles-for-zj) | lint plus a `to:` vs `read_by.by` diff |

Two things did not improve and are named so nobody counts them: the four antigravity envelopes (29 Sep to 1 Oct) have no reader because that agent has no inbox, which doc 2423 predicted; and `orca worktree ps --json` drops the comment on 2 of 35 rows (zaoonparagraph, iman-desk, both main worktrees under `~/Documents/repos`) while `orca worktree show` returns it, so ps is not the source of truth for comment that doc 2581 KD1 assumes.

## Outside practice, read in full

| Source | What it says improves context | Numbers | ZAO today |
|---|---|---|---|
| Anthropic, *Effective context engineering for AI agents* | "the smallest possible set of high-signal tokens"; just-in-time retrieval by identifier; progressive disclosure; compaction, structured note-taking, multi-agent architectures | context rot named as the failure; no token figures in the post | notes and compaction run (`/precompact`, status files); just-in-time is how every lane reads the vault |
| Claude Cookbook, *memory, compaction, and tool clearing* (2026-03-20) | three primitives, ranked by lossiness: clearing lossless if re-callable, memory lossless on what is saved, compaction lossy by summariser | corpus ~320K tokens; baseline peak 335,279 over 5 turns; 200K window stops at 168,242 mid-task; triggers 20,000 clearing, 50,000 compaction | clearing absent; `/precompact` is compaction with a human-written summary |
| LangChain, *Context Engineering for Agents* (2025-07-02) | write, select, compress, isolate; scratchpads; sub-agent isolation | taxonomy, no numbers | all four present: status files write, lane-route selects, precompact compresses, worktrees isolate |
| Cognition, *Don't Build Multi-Agents* (2025-06-12) | share full traces not messages; actions carry implicit decisions, conflicting ones carry bad results; default to single-threaded; a compressor model for history | principles, no numbers | the seat is single-threaded on routing; the shared clone is the conflicting-decision surface |
| Anthropic, *How we built our multi-agent research system* | lead agent saves its plan to memory before 200K truncation; subagent count scales with task; parallel tool calls | 4x tokens vs chat, 15x for multi-agent; 80 percent of variance from token usage; up to 90 percent faster | matches doc 2456 KD2 |
| HN 44432596 (117 points, 35 comments, 2025-07-04) | dissent: "handwaving the effects of hallucination"; memory-bank pattern wastes tokens; "search is far from solved" | 8 top-level comments read | the dissent is the census's premise: read the surface, not the memory of it |

## Findings

1. **The improvement that mattered was procedural, not architectural.** Nothing new was built on 10-01. A lane ran one command every 20 to 60 minutes and reported counts with the command. The seat ruled on three shapes that the counts exposed (non-recipient acks, hourly tool commits, stale-clone reads), and four lanes changed how they write (detached worktree, push HEAD:main, read the push output). Anthropic's post calls this "treating context as a finite resource"; the census is the meter.

2. **Stale context is a bigger defect than missing context, and it looks like diligence.** The vault lane grepped a clone that predated the `ack` subcommand, found zero, ran a control that proved a different proposition, and reported "no writer exists" with evidence. iman-desk and zao-fractal-bot hit the same wall from the same clone. All three were confident, all three cited commands, all three were wrong about origin. The fix was one line in every census: how far behind origin the surface they read is. No outside source names this failure; the closest is Cognition's "actions carry implicit decisions", where the implicit decision was "the clone is current".

3. **Provenance beats volume.** Cognition says share full traces. ZAO's measured result is that a one-line envelope with `basis: measured` and a `verify:` command crossed a terminal boundary and got acted on correctly 21 times today, while 33 pre-basis envelopes sat unread for up to eight days. The field's handoff posts (Alook, Starkslab, Aident) all propose richer documents; none proposes a basis field.

4. **The three primitives map cleanly, and the gap is clearing.** Status files are memory, `/precompact` is compaction, and nothing in the estate clears old tool results from a long-running seat loop. The cookbook's measured baseline (335,279 tokens by turn 5 on a 1M window) is the shape of a seat tick that reads 13 status files; clearing the oldest reads once past a threshold is the lossless move, and it is a Dotfiles change after 4 Oct.

5. **Detectors that cannot go red are where this lane's own context went wrong.** Three times in one day a check printed a clean or an alarming number that was an artefact of the check (a frontmatter checker that skips bare files by design, a strike convention it did not know, a git stat view that truncates paths). Each was caught by writing the sentence that carried the number, which is doc 2456's "writing the sentence is the check" and CLAUDE.md's "feed the filter something it must find". No outside source covers this; it is ZAO's rule and it earned itself three times today.

6. **Where ZAO is ahead of the field:** basis and relay-depth on messages (no equivalent found in 16 results across two searches), a routing tool that exits 2 on an empty lane set instead of printing a clean table (`lane-route.sh`), and a mistakes file that reports when a graduated shape recurs (17 recurrences of the typed-time shape, this lane's own included). **Where it is behind:** tool-result clearing, and a lane-state source that one command can read (ps vs show disagree; two name conventions; two strike conventions).

## Also See

- [agents/2423 - the vault is memory, not a message bus](../2423-vault-as-transport-inter-terminal-context/)
- [agents/2456 - orchestrator practice, measured against our own run](../2456-orchestrator-practice/)
- [dev-workflows/2581 - Orca, how others use it](../../dev-workflows/2581-orca-how-others-use-it/)
- [dev-workflows/2118 - long-session context management](../../dev-workflows/2118-long-session-context-management/)
- [dev-workflows/2036 - context hygiene and cost discipline](../../dev-workflows/2036-context-hygiene-cost-discipline/)
- `.claude/rules/handoff-discipline.md`, `.claude/rules/worktree-handoff.md`, `.claude/rules/session-boundaries.md` in this repo
- Tracker cards 10201 (status-append writes to the clone), 10206 (frontmatter check skips bare files), 10208 (hourly tool commits strand the clone)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Tool-result clearing in the seat loop: drop status-file reads older than N ticks once context passes 50 percent, with a red control that proves a cleared read is gone; shipped when the seat's tick log shows a step-down | Dotfiles lane (zj) | Dotfiles PR | 2026-10-06 |
| Census line "surface read is N commits behind origin" added to `agent-msg.py lint` output so every lane sees it, not only the context lane; shipped when lint prints it | Dotfiles lane (zj) | zao-vault PR | 2026-10-06 |
| Read `orca worktree show` for comment where `ps --json` returns empty, in whatever adopts doc 2581 KD1; shipped when the name map in `handoffs/status/context.md` is generated, not typed | context lane | zao-vault PR | 2026-10-08 |
| One strike convention in `## for the grill` sections: tildes only; the 15 `*(struck ...)*` lines in `handoffs/status/zj.md` converted; shipped when the grill detector needs one rule | Dotfiles lane (zj) | zao-vault PR | 2026-10-08 |
| Re-validate this doc against the 10208 fix: if tools stop committing into the clone, the "ahead N" census line should read 0 for a full day | context lane | re-research | 2026-10-12 |

## Sources

All fetched 2026-10-01. Method stated per source; a quote in this doc comes only from a FULL raw-text fetch.

- [Effective context engineering for AI agents - Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) [FULL, curl plus HTML strip, 21,446 chars]
- [Context engineering: memory, compaction, and tool clearing - Claude Cookbook](https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools) [FULL, curl plus HTML strip, 113,189 chars including notebook code; numbers quoted from the notebook's printed output]
- [Context Engineering for Agents - LangChain](https://www.langchain.com/blog/context-engineering-for-agents) [FULL, curl plus HTML strip, 17,252 chars]
- [Don't Build Multi-Agents - Cognition, Walden Yan, 2025-06-12](https://cognition.ai/blog/dont-build-multi-agents) [FULL, curl plus HTML strip, 11,067 chars]
- [How we built our multi-agent research system - Anthropic](https://www.anthropic.com/engineering/built-multi-agent-research-system) [FULL, curl plus HTML strip, 26,311 chars]
- [HN 44432596: Context Engineering for Agents (rlancemartin), 117 points, 35 comments](https://news.ycombinator.com/item?id=44432596) [FULL, hn.algolia.com items API, 8 top-level comments read]
- [anthropics/claude-cookbooks](https://github.com/anthropics/claude-cookbooks) [snapshot via zao-research-snapshot: 53,126 stars, 6,389 forks, 346 open issues, 87 contributors, MIT by LICENSE file, last activity 2026-09-28]
- [How to Keep Context Across Multiple Coding Agent Sessions - Alook, 2026-07-28](https://alook.ai/blog/keep-context-across-coding-agent-sessions) [PARTIAL, exa highlights only; used for KD6 as an example of the handoff-document genre, no claim rests on its body]
- [Passing Context Between Agents in Multi-Agent A2A Systems - Microsoft ISE, 2026-06-26](https://devblogs.microsoft.com/ise/a2a-context-passing-multi-agent-systems/) [PARTIAL, exa highlights only; cited as a typed-message design with no basis field, read from the highlight]
- ZAO: `zao-vault/handoffs/status/context.md` (13 census entries, 2026-10-01), `zao-vault/scripts/agent-msg.py` at origin/main d157ea8c, `zao-vault/inbox/agents/README.md` [FULL, local]
