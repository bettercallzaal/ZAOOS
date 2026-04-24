---
topic: agents
type: guide
status: research-complete
last-validated: 2026-04-24
related-docs: 479, 487, 491, 492, 493
tier: STANDARD
---

# 497 - Quad / QuadWork Workflow Deep Dive

> **Goal:** Know WHEN the 4-agent team wins, WHEN a single Claude session is faster, and HOW to run the first real ZAO batches without blowing up.

## Key Decisions

| Decision | Answer |
|---|---|
| Use QuadWork for tasks under 2 hours? | SKIP. Single Claude Code session is faster; batch overhead not worth it. |
| Batch size sweet spot | 5-8 issues. Beyond 8 context fragments and PR quality drops. Run 3x nightly instead of 1x mega. |
| All 4 agents same model? | NO. Lock to Head=Codex, Dev=Claude, RE1=Codex, RE2=Claude. Same-model reviewers miss 2 bugs/PR per Walden Yan. |
| Auto-merge from day 1? | NO. Human-merge weeks 1-2. Spot-check weeks 3-8. Auto-merge only on explicit allowlist (docs_only, test_only) after week 9. |
| Worktree isolation via Claude Code built-in? | RISKY. Issues 39886/37549/33045 show silent fail when combined with team_name. Keep ws/ branch naming + skip team_name param. |
| First real ZAO batch? | Docs + tests only. Touch nothing in contracts/, auth/, community.config.ts, supabase schema. |

## WHEN to Use Quad vs Skip

| Scenario | Use Quad | Reason |
|---|---|---|
| 5-10 related docs/tests, low risk, no auth | YES | Parallelism saves hours, 2-review gate catches edges |
| Single issue, under 2 hours | NO | Single session faster, context setup overhead wastes time |
| 20+ issues, tangled deps | MAYBE | Run as 3 sequential batches of 5-8, never one mega-batch |
| Contracts/auth/community.config | SKIP | No allowlist can protect unknown surface. Use /ship + human review |
| Test coverage push (src/lib/music, src/lib/farcaster) | YES | Each file one ticket, independent, low blast radius |
| Research doc stub fills | YES | Pure additive, easy revert, perfect for overnight queue |
| 10-bot fleet per-brand repos | YES (phase 2) | Install first on zao-chat + zao-brain 2 weeks, earn trust, then fan out |
| Real-time collab / sync review | SKIP | Quad is async overnight. Use /review or /ultrareview for sync |

## 3 Concrete ZAO Batch Patterns

**Pattern 1 - Test coverage sprint.** 5 tickets like "Write Vitest for src/lib/music/playlist-sorter.ts". Head queues, Dev writes, RE1 (Codex) checks coverage, RE2 (Claude) verifies mocks. Output: 5 PRs, ~20% coverage bump, zero production code touched. Risk: very low.

**Pattern 2 - Doc stub fills.** 10 research/*/README.md stubs with concrete spec per ticket (e.g. "3-column table: Name / Responsibility / Example Flow"). Dev drafts, RE1 fact-checks links, RE2 edits for ZAO voice. Output: 10 merged docs, research hub fills out. Risk: low (versioned, easy rollback).

**Pattern 3 - Safe-zone refactor (after trust earned).** After 4-6 green batches, graduate to "migrate src/components/notifications/* from old stream.io v3 to v4". 8 tickets, one per component. Human spot-checks first 2 PRs before continuing. Risk: medium.

## Pitfalls Observed in the Wild

1. **Worktree silent fail** (issues 39886/37549/33045) - `isolation: "worktree"` + `team_name` param = agent edits land in main repo, no error. Fix: drop `team_name` OR don't use built-in isolation; rely on ws/ branch naming per doc 459.
2. **Auto-merge bypass** - `gh pr merge --auto` with default GITHUB_TOKEN write perms skips required reviewers. Fix: keep `auto_continue_loop_guard=false` + `auto_merge=false` for 3 months minimum.
3. **Port collision** - two projects binding same MCP port (default 8200). Fix: stagger (chat 8200/8201, brain 8210/8211, dashboard 8400 shared). Already documented in doc 491.
4. **Reviewer collusion** - all 4 agents on same model catch zero real bugs. Fix: cross-frontier locked, per doc 487.
5. **Context explosion** - batch creeps to 20, PRs 11-20 hallucinate imports. Fix: hard cap 8, use OVERNIGHT-QUEUE.md to schedule 3 sequential nights instead.
6. **Pin drift** - AgentChattr wizard clones v0.4.0 main, QuadWork passes `--config` flag v0.4.0 argparse rejects. Fix: selective `git checkout 3e71d42 -- run.py config_loader.py`, preserve QuadWork patches to app.py/registry.py. Documented in doc 492.
7. **Stash config wipe** - `git stash push -u` wipes project-specific config.toml (session_token, 4-agent identities). Fix: `git show stash@{0}:config.toml > config.toml` recovery, or pre-copy before any stash.

## Underlying Research (Why This Works)

- **Walden Yan / Cognition** - Multi-agent uses 15x tokens vs. chat BUT gains 58% detection on logic/edge/security bugs when reviewer has zero shared context with coder. Cross-frontier is load-bearing; same-family (Sonnet -> Opus) has training gaps.
- **Anthropic research team** - 90% speed on 5+ hour research tasks with 3-5 subagents + lead orchestrator.
- **AgentCoder/MapCoder** - Academic multi-agent concurrency safe at 5-8, degrades beyond.
- **Branch protection on private repos** - needs GitHub Pro ($4/mo). Doc 493 tracks this.

## ZAO Workflow Fit

**Where Quad slots in:**
- zao-chat + zao-brain (post 3-repo split) - overnight doc/test batches
- bot/ per-brand repos (10-bot fleet) - each repo gets own Quad after 2-week soak on zao-chat
- research/ doc backlog - stubs fill nightly
- src/lib/music, src/lib/farcaster tests - coverage sprints

**Where Quad does NOT slot in:**
- community.config.ts changes (ask first rule)
- supabase migrations (schema auth)
- contracts/ (solidity, blast radius)
- src/lib/auth/* (session handling)
- src/lib/agents/* trading params (autonomous money)
- /ship skill flow (human final gate)

## Also See

- [Doc 479 - Walden multi-agent patterns](../479-walden-multi-agent-patterns-cognition/) - theoretical basis
- [Doc 487 - QuadWork four-agent dev team](../487-quadwork-four-agent-dev-team/) - initial install research
- [Doc 491 - Install 3-repo split](../491-quadwork-install-three-repo-split/) - port staggering, allowlist templates
- [Doc 492 - AgentChattr pin mismatch fix](../492-quadwork-agentchattr-pin-mismatch-fix/) - pin drift recovery
- [Doc 493 - Parallel terminals red deploys action plan](../../dev-workflows/493-parallel-terminals-red-deploys-action-plan/) - CI gate layer

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Verify AgentChattr pin 3e71d42 still recommended, check for newer stable | Claude | Research follow-up | Before next batch |
| Add .quadwork-allowlist.example template to zao-os repo | Zaal | PR | Before 3-repo split |
| First real batch: 5 test tickets on src/lib/music/* utilities, human-merge-only | Zaal + Quad | Overnight run | Within 7 days |
| Monitor disk + GitHub rate-limit, alert if >100MB per project or <50 rate-remaining | Zaal | VPS cron / Telegram ping | After first batch |
| Document Phase 1 (human merge) / Phase 2 (spot check) / Phase 3 (auto on allowlist) in CLAUDE.md | Zaal | Edit CLAUDE.md | After first batch green |

## Sources

- https://github.com/realproject7/quadwork
- https://quadwork.xyz
- https://www.anthropic.com/engineering/multi-agent-research-system
- https://cognition.ai/blog/multi-agents
- https://cognition.ai/blog/dont-build-multi-agents
- https://github.com/bcurts/agentchattr
- https://github.com/anthropics/claude-code/issues/39886
- https://github.com/anthropics/claude-code/issues/37549
- https://www.infoq.com/news/2025/08/container-use/
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://arxiv.org/abs/2312.13010
