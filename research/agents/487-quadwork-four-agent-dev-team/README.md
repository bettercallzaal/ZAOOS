# 487 — QuadWork — 4-Agent Coding Team (Head + Dev + 2 Reviewers)

> **Status:** Research complete
> **Date:** 2026-04-23
> **Goal:** Evaluate realproject7/quadwork (Farcaster's Hunt Town builder) as a reference implementation for running Claude Code + Codex CLI as a 4-agent PR workflow with 2-of-2 reviewer approval.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| Run QuadWork on our own repos? | USE for **overnight batches on low-risk tickets** (docs, tests, small refactors). SKIP for anything touching `src/app/api/`, `src/lib/auth/`, `src/lib/agents/`, or smart contracts. |
| Which agents in which roles? | USE their recommendation: **Head = Codex, Dev = Claude Code, Reviewer1 = Codex, Reviewer2 = Claude Code**. Cross-frontier disagreement catches more bugs (matches Walden's doc 479 finding). |
| Branch protection on `main`? | USE — QuadWork enforces it. We should enforce it on `main` anyway; this is the forcing function. |
| Disk cost? | Budget **77 MB × N projects** for the AgentChattr clone per project. With 10 projects = 770 MB. Acceptable on Zaal's dev machine. |
| Telegram + Discord bridges? | USE Telegram bridge for overnight monitoring; map to our existing ZOE Telegram stack. Skip Discord unless the ZAO Discord (fractal process) wants a feed. |
| Alternative if we want zero-new-infra? | USE Cognition-style Devin Review pattern (doc 479) — less tooling, same clean-context reviewer win. |

## Comparison of Options

| Stack | Agents | Reviewer gate | Schedule trigger | Runs local | License |
|---|---|---|---|---|---|
| **QuadWork** | 4 (Head/Dev/RE1/RE2) | 2-of-2 required | Every 15 min | Yes, Express :8400 | MIT |
| Cognition Devin Review | 2 (Coder + Reviewer) | 1 reviewer, clean context | Cloud | No | Proprietary |
| Aider + manual review | 1 | Human only | N/A | Yes | Apache-2.0 |
| AgentChattr standalone | N (configurable) | None | Manual | Yes | MIT |
| Our existing `/ship` + `/review` | 1 + 1 | Human | Manual | Yes | In-house |

## Where QuadWork Fits in ZAO OS

Matches our portal bot fleet architecture — each project gets its own AgentChattr clone, isolated worktrees, per-project OVERNIGHT-QUEUE.md. Three realistic use cases:

1. **ZAO OS docs backlog** — point QuadWork at `docs/` tickets, let it run overnight, wake up to merged docs PRs.
2. **Test coverage push** — "write Vitest coverage for `src/lib/music/*` utility files." Each file = one ticket. Both reviewers verify the test is meaningful before merging.
3. **Per-brand portal bot repos** — once we have the 10-brand bot fleet (`project_tomorrow_first_tasks.md`) each brand bot repo gets a QuadWork instance on Zaal's laptop overnight.

**Do not** give it access to `community.config.ts`, `.env`, or contracts. Whitelist the paths it can touch per project.

## The Loop In Detail

```
You: "@head start a batch for feature X"
→ Head creates 5 issues on GitHub + writes OVERNIGHT-QUEUE.md
→ You click Start Trigger
→ Every 15 min pulse:
    • Head assigns next queued issue to Dev
    • Dev opens PR
    • RE1 + RE2 independently review
    • Dev iterates until both approve
    • Head merges, picks next ticket
→ Queue empty → halt
```

Branch protection + 2-of-2 reviewers + sender lockdown (UI POSTs can't impersonate agents) = the safety triangle.

## Concrete Integration Points

- `~/.quadwork/` — where per-project config lives on Zaal's machine (out-of-repo).
- Git worktrees — `{repo}-head`, `{repo}-dev`, `{repo}-re1`, `{repo}-re2`. Matches our `ws/` worktree rule in `feedback_workspace_worktrees.md`.
- Zaal's `.husky/pre-commit` — already enforces secret hygiene; QuadWork inherits it automatically when committing from a worktree.
- `scripts/*.sh` — NONE from this repo are safe to let QuadWork modify. Add `.quadwork-allowlist` in each target repo listing touchable paths.
- `research/agents/202-multi-agent-orchestration-openclaw-paperclip/` — QuadWork is the local-first counterpart to OpenClaw/Paperclip cloud orchestration.

## Specific Numbers

- **4** agents per project (Head, Dev, Reviewer1, Reviewer2).
- **2-of-2** reviewer approvals required before merge.
- **15 minutes** scheduled trigger cadence.
- **Port 8400** local Express server.
- **77 MB** AgentChattr clone per project (385 MB for 5, 770 MB for 10).
- **Node 20+** required.
- **macOS + Linux** supported.

## Risks

- Rogue Dev agent trying to push straight to main → blocked by branch protection, but verify it's enabled per repo.
- Reviewer1 + Reviewer2 colluding — low risk with cross-frontier (Codex + Claude) but zero risk if you rotate model assignments.
- Disk fill — per-project clone + worktrees × all bot fleet = watch free space.
- Network exposure — Express on 127.0.0.1:8400 is local-only; never forward.
- Shared Hunt Town ecosystem — realproject7 lives in the Hunt Town / Farcaster builder scene; if we engage we're working with a Farcaster-native peer, which matches our positioning.

## What to Skip

- SKIP using QuadWork for anything touching payments, auth, RLS, or smart contracts.
- SKIP `auto_continue_loop_guard` until we've watched 3 complete batches run.
- SKIP Discord bridge in v1 — cognitive overhead.

## Sources

- [github.com/realproject7/quadwork](https://github.com/realproject7/quadwork)
- [QuadWork website](https://quadwork.xyz/)
- [QuadWork demo video](https://www.youtube.com/watch?v=Q0814uXjYoQ)
- [AgentChattr (bcurts)](https://github.com/bcurts/agentchattr) — the local chat server + MCP tooling QuadWork depends on.
- [Codex CLI](https://github.com/openai/codex)
- [Claude Code](https://github.com/anthropics/claude-code)
