---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-05-20
related-docs: 685, 793
original-query: "is there a Cowork Dispatch equivalent for Claude Code, focused on making it easy to parallelize agents? (reconstructed from r/ClaudeCode inbox item)"
tier: QUICK
---

# 684 - Claude Code Agent Dispatch + Parallelization

> **Goal:** Answer the r/ClaudeCode question "is there a Cowork Dispatch for Claude Code?" and map it to what ZAO already runs (QuadWork).

## Key Decisions (DO THIS)

| # | Decision | Why |
|---|----------|-----|
| 1 | KEEP using QuadWork as ZAO's agent dispatcher - do not adopt a new tool | QuadWork (local 4-agent Head/Dev/RE1/RE2 dashboard, http://127.0.0.1:8400) already solves the parallelization the Reddit thread is asking for |
| 2 | STEAL the adversarial-review phase from `dangeresque` if QuadWork lacks it | dangeresque bakes automatic adversarial review + human merge control into each pass - that is a concrete upgrade pattern |
| 3 | USE `cmux` only if QuadWork's dashboard view is insufficient | cmux ("tmux for Claude Code", 537 stars) is terminal-multiplexer visibility; QuadWork already gives a web dashboard |
| 4 | The native primitive is enough for ad-hoc work | Claude Code's Spawn-agent + git worktrees handles one-off parallel tasks without any external tool |

## Source: Inbox Item (r/ClaudeCode)

Forwarded by Zaal to ZOE's inbox. Thread "Claude Code agent dispatcher!" (r/ClaudeCode, 4 upvotes, 4 comments): asks for "the equivalent of Cowork Dispatch but for Claude Code, with a focus on making it easy to parallelize agents."

## Findings

| Tool / Pattern | What it does | Maturity | Fit for ZAO |
|----------------|--------------|----------|-------------|
| **QuadWork** (ZAO's own) | Local 4-agent dev team dashboard, auto-dispatching, agents run on Claude Max auth | In use | Already the answer - keep |
| **dangeresque** (slikk66) | Claude/Codex headless task-worker dispatch; isolated git worktrees, multi-phase passes, automatic adversarial review, human merge control; host-native | Active OSS | Steal the adversarial-review + phased-pass pattern |
| **cmux** (craigsc, 537 stars) | "tmux for Claude Code" - terminal multiplexing for many parallel sessions | Active OSS | Optional - QuadWork dashboard covers visibility |
| **Native Spawn-agent + git worktrees** | Orchestrator reads a task list, spins scoped subagents, each in its own worktree | Built into Claude Code | Use for ad-hoc parallel tasks |

The Reddit thread's own top answers converge on the same three things: dangeresque, cmux/tmux for visibility, and "Spawn agent already does this." ZAO is ahead of the question - QuadWork is the productized version.

## Staleness Notes

- Reddit thread + star counts: captured 2026-05-20. cmux at 537 stars; star counts drift.
- dangeresque is a thin wrapper under active development; verify the feature set on the repo before adopting any pattern.

## Sources

- [r/ClaudeCode - "Claude Code agent dispatcher!"](https://www.reddit.com/r/ClaudeCode/comments/1tiopk3/claude_code_agent_dispatcher/)
- [slikk66/dangeresque (GitHub)](https://github.com/slikk66/dangeresque)
- [craigsc/cmux (GitHub)](https://github.com/craigsc/cmux)

## Also See

- [Doc 685](../685-code-on-incus-agent-sandbox/) - code-on-incus: the sandboxing layer that pairs with a dispatcher

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Compare QuadWork's review step to dangeresque's adversarial-review pass | @Zaal | Decision | Next QuadWork iteration |
| File the inbox message under `research` + `processed` | @Claude | Bot task | This session |
| If QuadWork lacks phased multi-pass, scope it as a QuadWork feature | @Zaal | Todo | After comparison |
