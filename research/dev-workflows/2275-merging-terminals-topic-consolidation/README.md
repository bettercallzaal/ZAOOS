---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-14
superseded-by:
related-docs: 2271, 2273, 2246, 928
original-query: "merging terminals - how should parallel agent sessions be consolidated rather than accumulated? When two or more terminals are working the same topic, or a topic has drifted across several, what is the right way to MERGE them - fold their state into one - versus just killing the extras and losing what they knew?"
tier: STANDARD
---

# 2275 - You cannot merge terminals. You merge topics.

> **Goal:** Answer whether parallel lanes on one topic should be folded or killed, and name the two things this machine is missing to do either safely.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **A terminal has no mergeable state. Stop trying to merge terminals.** | Its state is a context window, which is already lossy and already compacted. What merges is the artifact. `zao-topic` is therefore the right primitive and the question mostly answers itself once the topic file is current. |
| 2 | **`zao-topic`'s `live_sessions()` must union `tmux ls` with `claude agents --json`.** | Verified: 13 native agents, 11 tmux sessions, **only 7 in both**. Six agents are invisible to any tmux-based tool - including two idle **19.9 days**. One function fixes it. |
| 3 | **The union is required in BOTH directions, not just one.** | The two trust-gated lanes (`grill`, `zpoidh`) appear in tmux and are **absent** from `claude agents --json`, because no agent ever started. Native alone would report the machine as clean. |
| 4 | **`sessionId` is the merge key of last resort.** | Every agent record carries one, and it maps to `~/.claude/projects/<slug>/<sessionId>.jsonl`. When a lane died without writing back, the transcript is the only surviving record - and it is on disk. |
| 5 | **Kill freely once writeback has happened; never before.** | `zao-topic close` already verifies writeback before killing. That is the correct design and it is sitting unmerged in PR #36. |
| 6 | **Use `--fork-session` to branch a topic, rather than opening a fresh lane.** | Verified present in v2.1.232. It resumes with a NEW session id, which is how you split work without abandoning what the first lane knew. |

## The measurement, taken today

Not the abstract question. This machine, 2026-08-14.

### Two views, neither complete

```
claude agents --json   13 agents
tmux ls                11 sessions
in both                 7
```

| In tmux, no agent | Agent, not in tmux |
|---|---|
| `grill` (trust-gate, 9d) | `sparkz` (idle **19.9d**) |
| `zpoidh` (trust-gate, 9d) | `finance` (idle **19.9d**) |
| `cowork` | `macstuff` (idle 9.0d) |
| `zaostock` | `cowork-today` |
| | `zaostock-e9` |
| | `zoe` |

**The sprawl is worse than the tmux list shows, and the worst offenders are the invisible ones.** `sparkz` and `finance` have been idle for nearly twenty days and appear in no lane report, because `zao-lanes` enumerates tmux.

At the same time, native alone would miss `grill` and `zpoidh` entirely - they never cleared the folder-trust prompt, so Claude Code never registered an agent. A pane with no agent and an agent with no pane are both real, and both are sprawl.

### The name drift is already visible in the data

| tmux | native agent | almost certainly |
|---|---|---|
| `cowork` | `cowork-today` | the same topic |
| `zaostock` | `zaostock-e9` | the same topic |

This is exactly the case the question asks about - a topic drifted across several terminals - and `zao-topic` already solves the naming half. Its `resolve_lane()` normalizes (`re.sub(r"[^a-z0-9]", "")`) and then fuzzy-matches at `FUZZY_FLOOR = 0.82`, returning `ambiguous` as a **stop rather than a fallback**. That refusal is the right call and it is the part most implementations get wrong.

It just cannot see six of the thirteen candidates, because `live_sessions()` is:

```python
rc, out = sh(["tmux", "ls", "-F", "#{session_name}"])
```

### Five lanes, one repo

`cowork-today`, `zaoresearch`, `alwayson`, `zoetmux` and `zoe` all have `cwd = /Users/zaalpanthaki/Documents/ZAO OS V1`. That is five agents on one repo, and it is the concrete form of the question.

### What each lane is worth, in bytes

Transcript size is a crude proxy for accumulated context, but it is the only one available for a dead lane:

| lane | transcript | lane | transcript |
|---|---:|---|---:|
| `zoe` | **515.2 MB** | `wavewarz` | 14.9 MB |
| `finance` | 131.5 MB | `ignite-radio` | 9.7 MB |
| `sparkz` | 56.3 MB | `zaostock-e9` | 9.3 MB |
| `macstuff` | 20.7 MB | `zaoresearch` | 8.3 MB |
| `cowork-today` | 14.6 MB | `zabalgames` | 1.6 MB |

`zoe` at 515 MB is the one where "just kill it" would actually lose something.

## The merge ladder

The question frames it as merge-versus-kill. In practice it is a ladder, and which rung you are on is decided by whether writeback already happened.

| Rung | State | Move |
|---|---|---|
| 0 | Topic file is current | **Kill freely.** There is nothing to merge - the durable thing is already durable |
| 1 | Lane alive, topic file stale | `zao-topic close` - writeback, verify, then kill. Already built |
| 2 | Lane dead or trust-gated, never wrote back | Mine the transcript by `sessionId`. Lossy and manual, but the record exists |
| 3 | Two lanes both hold real state | Fold both into ONE topic file, verify, kill both, reopen one |

**Rung 3 is the actual "merge", and the fold rule matters more than the mechanism.** `zao-topic`'s template already gets this right:

> ## Current state
> What is true RIGHT NOW. Rewrite this on every close; do not append. A stale "current state" is worse than none, because it reads as fact.

Merging two lanes' state by concatenation produces a document containing two contradictory presents. The merge is a **rewrite**, and the newer observation wins on any conflict - which is only decidable because topic files are undated and updated in place, while `~/.zao/handoffs/` files are dated snapshots that accumulate beside each other.

Peter's rule for the same problem, from `references/state.md`: *"a run is resumed from the graph, never re-planned on top of itself."* Same principle, different substrate - fold the durable record, do not layer a new plan over a live one.

## What other people actually do

### The official answer is two separate features

Anthropic ships both halves, and they are for different problems (`code.claude.com/docs/en/agent-teams`, read raw, describing v2.1.178):

- **Agent teams** - one session is the team lead, coordinating work and synthesizing results; teammates each hold their own context window and talk to each other directly. Experimental, off by default behind `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
- **Cross-session messaging** - for separate sessions passing messages without a team. That is `SendMessage`, which this lane used yesterday for the Ignite handoff.

Two things in that doc bear directly on this question:

1. *"Agent teams have known limitations around session resumption, task coordination, and shutdown behavior."* The official feature has the same unsolved edge we do. Resumption is the hard part everywhere.
2. *"Agent teams add coordination overhead and use significantly more tokens than a single session... For sequential tasks, same-file edits, or work with many dependencies, a single session or subagents are more effective."*

That second line is the argument against treating eleven lanes as a team. Most of our lanes are sequential work on one repo, which the vendor explicitly says should be one session.

### The community converged on a picker, not a merge

`craftzdog/tmux-claude-session-manager` (357 stars, 46 forks, MIT, pushed 2026-07-26) states the problem in our exact terms:

> If you launch Claude per-directory (one nested session per project), you quickly end up with a dozen of them and no way to tell which are finished without opening each one.

Its answer is a central picker with live status, a preview, smart jump, and **quick kill** - and crucially:

> Status needs no configuration. Claude Code publishes each agent's own state and the picker reads it - there are no hooks to install.

**Nobody in this space merges.** They surface, then kill. The interesting part is that the highest-starred tool reached the same conclusion as decision 2 above: read the native state rather than scraping panes.

### The cost of not merging, quantified by someone else

The `claunch` writeup (dev.to, read raw) puts a number on what a killed lane costs:

> Each context rebuild takes 10-15 minutes, and switching between projects multiple times a day adds up to a significant amount of time lost to repetitive explanations.

Its survey of existing options is useful as a negative result - git worktrees ("complex setup, massive disk usage"), Claude Squad ("lacks simplicity, additional dependencies"), and `--continue` ("useless for multi-project workflows"). All three are session-level tools, and all three fail for the same reason: they preserve a session rather than a subject.

## The native primitives, verified here

Claude Code v2.1.232 on this machine already ships more than we are using:

| Primitive | Verified | Use |
|---|---|---|
| `claude agents --json` | 13 records: `pid, cwd, kind, startedAt, sessionId, name, status` | The authoritative lane list. Beats pane-scraping |
| `--resume` | present in `--help` | Reopen a specific session by id |
| `--fork-session` | present: *"When resuming, create a new session ID"* | **Split** a topic without abandoning the parent |
| `--from-pr` | present: *"Resume a session linked to a PR"* | Reattach work to its artifact |
| `-c / --continue` | present | Most recent conversation only |

`--fork-session` is the one worth adopting deliberately. The accumulation pattern on this machine is *open a new lane when the subject shifts*. Forking resumes with a new session id, so the split is explicit and the parent stays intact - accumulation with a lineage instead of accumulation with amnesia.

## The honest limit of all of this

**A merge recovers artifacts, never understanding.** A 515 MB transcript is not knowledge; it is a log of how knowledge was produced, most of it superseded by its own later turns. Rung 2 (mining a dead lane's transcript) is a salvage operation and should be treated as one - it is what you do when the discipline failed, not a substitute for the discipline.

Which means the real answer to "merge or kill" is upstream of both: **write back continuously, so that killing is always free.** Everything else is recovery.

## Findings

1. **Neither the tmux view nor the native view is complete**, and the gaps run in both directions. 13 native, 11 tmux, 7 shared.
2. **The oldest sprawl is invisible** to the tool built to find sprawl - `sparkz` and `finance` at 19.9 days.
3. **Name drift is already present and already detectable** - `cowork`/`cowork-today`, `zaostock`/`zaostock-e9` - by a resolver that exists but reads the wrong source.
4. **`zao-topic` is written and unmerged** (PR #36, 403 lines, branch `ws/zao-topic`). This is the second instance this week of a finished tool sitting uninstalled, after the reddit v4 in doc 2273. Same failure, different file.
5. **The industry does not merge sessions.** The most-adopted tool surfaces and kills; the official feature is for parallel work, not consolidation, and admits resumption is unsolved.
6. **Merging is a rewrite, not a concatenation.** Two "current state" sections produce a document with two contradictory presents.

## Also See

- [Doc 2271](../../agents/2271-peter-skill-graph-loop-adoption/) - Peter's resume-from-the-graph model, the same principle on a different substrate
- [Doc 2273](../2273-reddit-oauth-recovered-from-stash/) - the other finished-but-uninstalled tool found this week
- [Doc 2246](../../agents/2246-claude-code-cross-session-messaging/) - the cross-session messaging half of the official answer
- [Doc 928](../../agents/928-agent-loop-best-practices/) - rule 9 (one instance per resource), rule 16 (watch loops by output, not process)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Union `claude agents --json` into `zao-topic`'s `live_sessions()` and `zao-lanes`. Shipped when both report `sparkz` and `finance` as idle 19d, and still report `grill`/`zpoidh` as trust-gated. | @Zaal | PR | 2026-08-17 |
| Merge `zaal-dotfiles` PR #36 so `zao-topic` exists on disk. It cannot help while it is only a branch. | @Zaal | PR | 2026-08-16 |
| Add a `zao-topic salvage <sessionId>` rung-2 path that extracts a dead lane's decisions from its transcript into a topic file | @Zaal | PR | 2026-08-22 |
| Fold `cowork`/`cowork-today` and `zaostock`/`zaostock-e9` into one topic file each, then kill the extras - the two live merge candidates | @Zaal | Manual | 2026-08-17 |
| Decide on the five ZAOOS lanes: which are genuinely distinct subjects and which are one session that drifted | @Zaal | Decision | 2026-08-17 |

## Sources

- `claude agents --json` on this machine, v2.1.232 - **[FULL]** 13 records, all fields enumerated, cross-referenced against `tmux ls` and against transcript sizes on disk.
- `claude --help` - **[FULL]** `--resume`, `--fork-session`, `--from-pr`, `-c/--continue` confirmed present in this version.
- [code.claude.com/docs/en/agent-teams](https://code.claude.com/docs/en/agent-teams) - **[FULL]** fetched raw with curl and HTML-stripped, 629 KB. Quotes above are from the page text, not a summary.
- [github.com/craftzdog/tmux-claude-session-manager](https://github.com/craftzdog/tmux-claude-session-manager) - **[FULL]** README read via `gh api`. 357 stars, 46 forks, MIT, pushed 2026-07-26.
- [dev.to claunch writeup](https://dev.to/kaz123/how-i-solved-claude-codes-context-loss-problem-with-a-lightweight-session-manager-265d) - **[FULL]** fetched raw, article body extracted. Quotes are page text.
- `~/bin/zao-lanes` and `bin/zao-topic` from `origin/ws/zao-topic` - **[FULL]** read from disk / from the branch. 403 lines for zao-topic.
- `/tmp/peter-src/skills/peter/references/state.md` - **[FULL]** read in full.
- Reddit community threads - **[FAILED]** no thread fetched. `zao-fetch-reddit.sh --selftest` today: creds ABSENT, oauth 403, public `.json` returns `text/html`, redlib 0/3. WebSearch will not return reddit.com results to this user agent. The browse route was available but not spent, because the four sources above already cover community practice with raw text.

  > **Corrected 2026-08-14, same day:** "the browse route was available" is no longer true. Within roughly 48 hours of the three threads it fetched on 2026-08-12, the headless-Chromium path closed too - a thread's `.json` now returns **403** in-session, as do sub listings, search, and user pages, and the sub's HTML page returns **200 carrying a block-page body**. Every reddit path from this machine is walled. Measured and tabulated in [doc 2282](../../business/2282-reddit-as-oss-outreach-channel/). Do not plan work around the browse route; the durable fix is the OAuth credential ([doc 2273](../2273-reddit-oauth-recovered-from-stash/)).

## Credit

`zao-topic` and `zao-lanes` are Zaal's. The picker-and-kill pattern and the "no hooks to install" observation are **craftzdog**'s (MIT). The context-rebuild cost framing is **kaz123**'s. Peter is **robertkeus**'s (MIT). Agent teams and the native session flags are Anthropic's.
