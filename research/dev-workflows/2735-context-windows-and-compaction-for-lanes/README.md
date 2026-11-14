---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-11-10
superseded-by:
related-docs: "dev-workflows/2585-precompact-context-skills, agents/2721-best-seat-loop-away-mode, agents/2550-session-memory-across-compactions-and-agents"
original-query: "Zaal, seat pane, Tue 10 Nov 2026, verbatim: 'right now what does this all mean can u explain more can we /zao-research more about context windows and compacting and more' (asked about the seat's advice to run /autocompact 300k)"
tier: STANDARD
---

# 2735 - Context windows and compaction for the lane fleet: what the window is, why the seat thrashed, and the size each lane should compact at

> **Goal:** Explain in plain words what a context window and a compaction are, say why the seat compacted five times in one night for almost no gain, and decide what window each kind of lane should run at.

Written by the seat lane (orchestrator2). Local numbers were read on 10 Nov 2026 from lane transcripts, the session environment and both user settings files (read only, nothing changed). Claude Code on this Mac reported version 2.1.322 the same morning. Doc `dev-workflows/2585-precompact-context-skills` already covers what survives a compaction and the cost of the skill listing; this doc does not repeat that work and covers the window itself.

## Key Decisions

| # | Decision | Evidence | Owner |
|---|---|---|---|
| 1 | **USE `/autocompact 300k` in the seat pane.** The seat reloads about 140,000 tokens after every compaction, so 300k leaves about 160,000 tokens of working room and stops the session growing toward 900,000. | Part 3 measurements; model-config.md: "run `/autocompact` with a value, like `/autocompact 500k`" | Zaal, his command |
| 2 | **USE one fleet default, `"autoCompactWindow": 300000`, in the tracked user settings, as a PR.** Without it a lane on this model family compacts "at about 967K tokens by default"; seat-merge reached 881,836 tokens. | model-config.md, Default auto-compact thresholds; Part 3 | permissions lane opens the PR, Zaal merges |
| 3 | **KEEP `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=90`, and stop treating it as the control.** It "can't raise the threshold"; it only makes compaction happen earlier inside whatever window is set. With a 300k window it would trigger near 270,000. That last figure is arithmetic from the docs, not a test on this Mac. | env-vars.md row for the variable | no action |
| 4 | **RESTART a lane that compacts near 160,000 tokens on a 1M model.** That is the signature of a process holding a 200K window. `claude --continue` fixed the seat: 254,073 tokens on one turn afterwards with no compaction. | Part 3; the same symptom is reported upstream (Part 4) | any lane, on seeing it |
| 5 | **SKIP `DISABLE_AUTO_COMPACT`.** With compaction off, a session that fills its window stops with the context-limit error instead of compacting (model-config.md, Turn off 1M context). An unattended lane must not be able to stop that way. | model-config.md | no action |
| 6 | **KEEP the fresh-session habit from doc 2585 and the session-boundaries rule.** A bounded window limits the cost of a long session; it does not replace ending one. "Use `/clear` to start fresh when switching to unrelated work." | costs.md | every lane |

## Part 1. In plain words

A session can hold a fixed amount of text at once. That is its context window, counted in tokens (a token is roughly three quarters of a word). Everything counts against it: the rules and CLAUDE.md files, the memory index, the names of tools and skills, and every message, command and command output since the session began.

Before anything is typed, a session already carries its fixed load. The docs list it: "CLAUDE.md, auto memory, MCP tool names, and skill descriptions all load into context" (context-window.md). On this Mac the instruction files alone are 126,801 bytes.

When the window fills, Claude Code compacts: it "summarizes the conversation history to fit the context window" and carries on from the summary. The fixed load is reloaded from disk, the summary replaces the conversation, and detail that the summary left out is gone from the session (it is still in the transcript file).

Two numbers decide how a lane behaves:

- **The floor:** what the session holds right after a compaction. Fixed load plus the summary plus up to five re-read files.
- **The trigger:** how full the session gets before it compacts. This is the auto-compact window.

The room a lane has to work in is the trigger minus the floor. If they are close, the lane compacts again almost at once. If the trigger is very high, the lane carries a huge conversation and pays for all of it on every turn.

## Part 2. What the docs say (read 10 Nov 2026)

| Question | Answer, quoted | Page |
|---|---|---|
| How big is the window on this model family | "Fable models, Sonnet 5 and later, Haiku 5.5, and Opus 4.7 and later run with the 1M window by default, with no `[1m]` suffix needed." | model-config.md |
| When does it compact with nothing set | "Models running with a native 1M window compact before the window fills, at about 967K tokens by default." | model-config.md |
| How to set the trigger for one model | "run `/autocompact` with a value, like `/autocompact 500k`. Claude Code saves it to your user settings under the current model" | model-config.md |
| How to set it for every model | "set `autoCompactWindow` in a settings file, such as `"autoCompactWindow": 200000`" | model-config.md |
| Allowed range | "The command and the flag accept a window size from 100K to 1M tokens" and "Claude Code caps it at the model's context window." | model-config.md |
| What the percentage override does | "Set the percentage (1-100) of the auto-compact window at which auto-compaction triggers ... the variable can't raise the threshold, so values above the default percentage are ignored." | env-vars.md |
| How a 1M model gets held to 200K | `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` "holds models that run with the 1M window by default to a 200K window", and a model ID Claude Code does not recognize makes it assume "a context window of 200k tokens" | env-vars.md, model-config.md |
| What comes back after a compaction | Project CLAUDE.md, unscoped rules and auto memory are "Re-injected from disk"; invoked skill bodies are "capped at 5,000 tokens per skill and 25,000 tokens total; oldest dropped first"; "up to five of the files Claude has read or edited" are re-read | context-window.md |
| What a big context costs | "Token costs scale with context size: the more context Claude processes, the more tokens you use." | costs.md |
| What it does to quality | A model has an "attention budget" and "Every new token introduced depletes this budget by some amount" | Anthropic, context engineering |

## Part 3. What was measured on this Mac (10 Nov 2026)

| Measure | Reading | Surface |
|---|---|---|
| Seat auto compactions, 9 Nov 22:48 to 10 Nov 07:37 Eastern | 5, all `trigger: auto` | `compact_boundary` rows, seat transcript `f4863de1` |
| Context on the last turn before each | 160,126 to 163,169 tokens | assistant `usage` (input + cache read + cache creation) |
| Context on the first turn after each (the floor) | 134,036 to 145,252 tokens | same |
| Room bought per compaction | about 20,000 tokens | difference |
| Time per compaction | 73 to 83 s | `durationMs` |
| Same conversation after `claude --continue` | 254,073 tokens on one turn, no compaction | last `usage` row, read 08:40 Eastern |
| Largest context in each helper's newest transcript | seat-merge 881,836; messenger 481,439; paragraph 278,978; seat-misc 265,823 | same field |
| Settings in force | `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=90`; no `autoCompactWindow`, no `CLAUDE_CODE_AUTO_COMPACT_WINDOW`, no `CLAUDE_CODE_DISABLE_1M_CONTEXT` | session env; `claude/settings.json` in zaal-dotfiles (line 8) and the Orca profile copy of it |
| Repo hook that runs before a compaction | `scripts/hooks/precompact-handoff-guard.sh` | `.claude/settings.json` in ZAOOS, PreCompact |

Reading. The seat's trigger was near 163,000 while its floor was 134,000 to 145,000, so it had about 20,000 tokens of room and compacted three times inside 11 minutes. That trigger is what a 200K window produces. After the restart the same conversation ran past 250,000, which is the 1M behaviour the docs describe.

Not established: why the earlier process held the smaller window. None of the documented causes was set in the environment or settings read above. The process had been running since 9 Nov, the day the seat moved to a newer model; a process that started before the switch is a guess and was not measured. Not measured: the helpers' own floors (only their largest contexts), and the split of the seat's fixed load between rules, tools and skills (`/context` in the pane gives it).

## Part 4. What other people report

| Source | What it says | Bearing here |
|---|---|---|
| anthropics/claude-code issue 36014, opened 2026-03-19, closed 2026-05-28 as inactive | "Autocompact triggers at 17% on 1M context model (effectiveWindow likely capped at 200k)". The reporter logged `context_window_size: 1000000` while a session compacted at about 171k. A later comment reports the same on a newer build: "fired auto-compact at ~197K tokens". | Same signature as the seat: a 1M model compacting near the 200K boundary. It was closed for inactivity, not marked fixed. |
| anthropics/claude-code issue 34332, opened 2026-03-14, open | "autocompact triggers at ~76K tokens" on a 1M model, "92% of context window wasted" | Premature compaction has been reported more than once, at different sizes. |
| anthropics/claude-code issue 3351, closed | "Configurable autocompact context %", 17 reactions, the most-reacted result for the search | The setting people asked for exists now as the auto-compact window. |
| Hacker News item 46851021, 2026-02-02, 2 points | "I let Claude Code context accumulate and burned $2,000+ in tokens" and noticed no quality drop | The opposite failure: a large context does not announce itself; the bill does. One anecdote, low engagement. |

These are user reports, not vendor statements. They show the two failure shapes are known; they do not prove the cause on this Mac.

## Part 5. The options compared

| Window | Room above a 140k floor | Cost per turn at the top | Compactions | Verdict |
|---|---|---|---|---|
| Default, about 967k | about 827,000 | highest; every turn can carry most of a million tokens | rare, and each summary must compress far more | SKIP for lanes that run for days; seat-merge at 881,836 is this |
| 500k | about 360,000 | high | few | acceptable for a lane doing one long build |
| **300k** | about 160,000 | moderate | occasional | **USE as the fleet default and for the seat** |
| 200k | about 60,000 | low | frequent on a heavy lane | only for a lane with a small floor; too tight for the seat |
| 163k (what the seat had) | about 20,000 | low | constant | the failure this doc is about |

Room figures use the seat's measured floor. A helper with a smaller floor gets more room from the same window; its floor has not been measured.

## Also See

- [Doc 2585](../2585-precompact-context-skills/) - what survives a compaction on this Mac, and the skill listing's cost
- [Doc 2721](../../agents/2721-best-seat-loop-away-mode/) - the away loop; its 10 Nov 2026 addendum (ZAOOS PR 4287, open at the time of writing) holds the six steps for Zaal
- [Doc 2550](../../agents/2550-session-memory-across-compactions-and-agents/) - session memory across compactions and agents

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Type `/autocompact 300k` in the seat pane | Zaal | his command | his next sitting |
| Open a zaal-dotfiles PR adding `"autoCompactWindow": 300000` to `claude/settings.json` | permissions lane | PR, his merge | after Zaal says yes to decision 2 |
| Measure each helper's floor (first turn after a compaction) once the window is set, and adjust | seat | measurement, added to this doc | 17 Nov 2026 |
| Show the compaction count and context tokens in the status line, so a lane compacting near 160k is seen the same hour | dotfiles lane | PR | backlog |
| If any lane compacts near 160k again, capture `/context` output and the Claude Code version before restarting it | the lane that sees it | note in its status file | on occurrence |

## Sources

All fetched 10 Nov 2026. Method: `curl` with a browser user agent, HTTP 200, read as raw text; anthropic.com pages had HTML stripped, docs pages serve markdown, GitHub and Hacker News came from their JSON APIs.

1. [Claude Code docs: model configuration](https://code.claude.com/docs/en/model-config.md) [PARTIAL - read the Extended context and Context window and auto-compaction sections; the rest of the page (model aliases, effort, fallback) is off the question]
2. [Claude Code docs: explore the context window](https://code.claude.com/docs/en/context-window.md) [FULL]
3. [Claude Code docs: environment variables](https://code.claude.com/docs/en/env-vars.md) [PARTIAL - the five compaction and window rows; the page lists several hundred variables]
4. [Claude Code docs: costs](https://code.claude.com/docs/en/costs.md) [PARTIAL - the reduce-token-usage and agent-team sections]
5. [Anthropic: Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) [PARTIAL - attention budget, compaction, note-taking and sub-agent sections]
6. [anthropics/claude-code issue 36014](https://github.com/anthropics/claude-code/issues/36014) [PARTIAL - the first 1,500 characters of the body and all 7 comments at 420 characters each]
7. [anthropics/claude-code issue 34332](https://github.com/anthropics/claude-code/issues/34332) [PARTIAL - the first 700 characters of the body; its 7 comments not read]
8. [GitHub issue search, anthropics/claude-code, "autocompact" in title, by reactions](https://github.com/anthropics/claude-code/issues?q=is%3Aissue+autocompact+in%3Atitle+sort%3Areactions-desc) [FULL for the 8 result rows: number, state, date, reactions, title]
9. [Hacker News item 46851021](https://news.ycombinator.com/item?id=46851021) [PARTIAL - the first 600 characters of the post text; it has no comments]
10. Hacker News Algolia search, stories "claude code auto compact" since 2025-01-01 and comments "claude code context window compaction" since 2025-07-01 [FULL for the 8 rows each returned]
11. Local, read-only, 10 Nov 2026: newest transcripts of five lanes; session env; both user settings files; `.claude/settings.json` in ZAOOS [FULL for the fields named in Part 3]

The PARTIAL marks are sections left unread on purpose because they are off the question, or text cut by the reader script at a fixed length; no page failed to load. Not searched: Reddit, X, and vendor material from other agent tools.
