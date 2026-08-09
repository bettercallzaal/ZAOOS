---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-08-09
superseded-by:
related-docs: "154, 2150, 2246, 2254"
original-query: "Do deep research on Claude in built tools and how we should be using some of them"
tier: STANDARD
---

# 2255 - Claude Code built-in tools: what we hand-rolled that already existed

> **Goal:** Audit ZAO's Claude Code setup against the built-in tools actually
> available, and name the specific places we built our own version of something
> the harness ships. Grounded in the live tool list, the repo's real config, and
> the failures from this session - not from a feature list.

## The one finding

**Our tooling is heavy and our harness usage is light.** ZAO runs 135 skills, 6
custom agents, and 5 hook types - a setup most teams never reach. But several of
the most-used patterns in this repo are hand-rolled versions of a built-in:
polling loops where `Monitor` exists, `git worktree add` shell wrappers where
`EnterWorktree` exists, and a Task-tool ledger that a rule *requires* and nobody
runs.

The pattern is not ignorance. It is that **the rules were written before the
tools shipped, and nothing re-reads the rules when the harness gains a feature.**

## What is actually configured (measured 2026-08-09)

| Surface | State |
|---|---|
| Hooks | `PreToolUse`, `PostToolUse`, `SessionStart`, `Stop`, `Notification` |
| Custom agents | 6 - `code-reviewer`, `zao-build-orchestrator`, `zao-builder`, `zao-evaluator`, `zao-formatter` |
| Skills | 79 user-scope + 56 project-scope |
| `statusLine` | set at USER level (`zao-cc-statusline.sh`), unset at project level |
| `outputStyle` | unset |
| `permissions` / `env` | set |

Method: parsed `.claude/settings.json` and `.claude/settings.local.json`
directly, and listed `.claude/agents/` and both skills directories.

## The gaps, in leverage order

### 1. `Monitor` - we poll where we could be woken

The overnight loop on 2026-08-09 woke every 20-30 minutes to check whether a
revoked credential had been restored. Nine ticks, each one a full session
turn, to answer a yes/no question that a watcher answers for free.

`Monitor` is a built-in that watches a condition and wakes the session when it
fires. Every "check back later" pattern in our loops - CI finishing, a PR
comment landing, a bot coming back up - is currently written as a timed poll.

The loop skill itself says this: with a Monitor armed, `ScheduleWakeup` should
be a 1200-1800s *fallback heartbeat*, not the primary signal. We use it as the
primary signal because no Monitor is ever armed.

### 2. `EnterWorktree` / `ExitWorktree` - rule 25 hand-rolls a built-in

`agent-loops.md` rule 25 mandates that all building happens in a worktree off
`origin/main`, and spells out the shell: `git worktree add -b <branch> /tmp/wt-x
origin/main`, symlink `node_modules` in, commit and push from there, then
`git worktree remove`.

`EnterWorktree` and `ExitWorktree` are built-in tools that do this. The `Agent`
tool also takes `isolation: "worktree"` directly, which is the documented way to
run file-writing subagents concurrently - the exact problem rule 20 solves by
telling us to run them sequentially instead.

Rule 25 is not wrong, it is just older than the tool. It should name the tool
and keep the shell form as the fallback.

### 3. The Task tools - a rule we wrote and do not follow

`thread-discipline.md` is explicit: every open thread goes into the Task tools
the moment it opens, so a fast pivot cannot silently drop one. It calls this the
"live ledger" and says the ledger, not the chat scrollback, is the source of
truth for what is still open.

In the session that produced this doc, the task-tool reminder fired **eight
times** and was skipped every time - including while two threads were genuinely
open at once. The stale list still holds items from 2026-08-07.

This is worth naming plainly because it is the failure mode the rule was written
to prevent, happening to the rule itself. Either the ledger gets used or the rule
gets cut; a rule that is reliably ignored trains everyone to ignore rules.

### 4. `statusLine` - already configured, and now extended (CORRECTED)

**This section originally said "unset. Nothing is configured." That was wrong,
and it is worth leaving the correction visible rather than quietly editing it.**

The claim came from parsing `.claude/settings.json` - the PROJECT settings - and
concluding absence. `~/.claude/settings.json`, the USER settings, has had a
status line the whole time: `zao-cc-statusline.sh`, `refreshInterval: 2`. It
prints a `[WORKING]` / `[WAITING FOR YOU]` badge driven by hooks, then chains
into the caveman plugin's badge.

This is exactly the failure `confirm-before-claiming-absence.md` was written to
stop: an absence claim from a partial read. Settings are layered - user,
project, and local - and reading one layer proves nothing about the others. The
rule says an absence claim must carry the scope it searched. This one did not,
so it was wrong within the hour, after the doc had already merged.

**What actually shipped**, on 2026-08-09, extending that script rather than
replacing it (`code-restraint.md` rung 2 - reuse outranks rewrite):

| Script | Role |
|---|---|
| `zao-status-refresh` | background, ~2s, writes `~/.zao/status.json` |
| `zao-statusline` | render only, ~26ms, no network at all |
| `zao-cc-statusline.sh` | existing wrapper, now chains the fleet segment after the badges |

The split is forced by the harness contract, not by taste: Claude Code re-runs
the status line on every prompt and tool use, debounces at 300ms, and **cancels
an in-flight script** when the next update fires. A status line that called
`gh api` or `ssh` would be killed mid-flight and render nothing at all. So every
network call happens in the background refresher, and the render path only reads
a local cache.

Two properties worth keeping in any future version:

- **Staleness is displayed, not hidden.** Past 15 minutes the fleet numbers get
  a `?` marker. A cached number rendered as if it were live is a lie the reader
  cannot detect (`noisy-signal-guard.md`).
- **It degrades to the badges.** Empty stdin, non-JSON stdin, a missing cache,
  and a missing fleet script were each tested; all still render `[WAITING FOR
  YOU]`. A status line that can break the prompt is worse than no status line.

### 5. `Artifact` - complements the clipboard skill, does not replace it

`/clipboard` writes a local HTML page, keeps a 50-item history, and opens it in
the browser. `Artifact` publishes a private hosted page on claude.ai with a
stable URL that can be updated in place.

These solve different problems. Clipboard is local, offline, and private by
construction - correct for SQL, keys-adjacent content, and anything that should
never leave the machine. Artifact is correct for a founder-facing report that
Brandon or a partner needs to open on their own device.

The DreamNet Communication Standard reports are the obvious Artifact case: they
are written to be read by someone who is not at this terminal.

## The `SendMessage` boundary (honest limits)

The Reddit thread that prompted this ("Claude Code: your sessions can now
message each other", r/ClaudeAI, 2026) is thin - body removed, score 1 - but its
top comment asks the right question: what does this add over `SendMessage`?

**Verified:** `SendMessage` addresses agents spawned from the current session,
continuing them with their context intact.

**Not verified:** whether it reaches a *separate, independently-launched
terminal session* on the same machine. We did not test it.

That distinction matters because `agent-loops.md` rule 36 currently says
"Claude-to-Claude on one machine: use the native `SendMessage`". If the native
tool only spans agents within one session, that guidance is too broad, and
`lane-send` plus the relay hub is not redundant infrastructure - it is the only
thing covering cross-terminal delivery.

**Action:** test it before rule 36 is relied on further. Until then, treat the
two as complementary.

## Sources

- Live tool list available to the session, 2026-08-09 - the authoritative and
  current inventory [FULL]
- `code.claude.com/docs/en/settings` - fetched, redirected from
  `docs.claude.com`; config-focused, does not carry a complete tool reference
  [PARTIAL]
- `.claude/settings.json`, `.claude/agents/`, `~/.claude/skills/`,
  `.claude/skills/` - parsed directly [FULL]
- r/ClaudeAI "Claude code : your sessions can now message each other" - fetched
  via `zao-fetch-reddit.sh`; post body `[removed]`, 1 comment thread readable
  [PARTIAL]
- `.claude/rules/agent-loops.md` (rules 20, 25, 36), `thread-discipline.md` -
  read in full [FULL]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| ~~Ship a `statusLine`~~ - DONE 2026-08-09, extends the existing user-level one; fleet segment live | @Zaal | Done | 2026-08-09 |
| Test whether `SendMessage` crosses independent terminal sessions; correct rule 36 either way | @Zaal | PR | 2026-08-16 |
| Update `agent-loops.md` rule 25 to name `EnterWorktree`, keeping the shell form as fallback | @Zaal | PR | 2026-08-16 |
| Arm a `Monitor` in the next autonomous loop instead of a timed poll; report whether it fired | @Zaal | PR | 2026-08-16 |
| Decide: enforce the `thread-discipline.md` ledger, or cut the rule | @Zaal | Decision | 2026-08-16 |

## Also See

- [Doc 154](../154-skills-commands-master-reference/) - the skills and commands reference
- [Doc 2150](../2150-claudeskills-subreddit-advice/) - annotating plans with which feature fits each step
- [Doc 2254](../2254-agent-work-writes-itself-to-the-board/) - the same shape: work that leaves no trace
- `.claude/rules/agent-loops.md` - rules 20, 25, 36 all touched by this audit
- `.claude/rules/thread-discipline.md` - the ledger rule this doc reports as unfollowed
