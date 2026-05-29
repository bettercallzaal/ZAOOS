---
topic: agents
type: guide
status: research-complete
last-validated: 2026-05-28
related-docs: "759, 766"
original-query: "Bootstrap the 100-best-practices list per locked Q11=B build now in parallel with the gap sprint"
tier: STANDARD
---

# 100 - AI Agent Best Practices for ZAO

> **Goal:** A working library of opinionated, defensible best practices for AI agents in the ZAO stack. Designed for ZOE to query at runtime + for humans to read sequentially. Per locked Q11=B and the methodology in doc 759 v2 Part B + doc 766.

## Status

10 of 100 items shipped (the CORE tier foundation). 90 remaining: 50 sharp-edges + 30 situational + 10 more core. See `_meta.yaml` for the category map + sourcing strategy.

## Structure

Per locked methodology:

- **CORE (001-020)**: foundational, defensible against counterexamples, MUST-DO
- **SHARP (021-070)**: sharp edges that bite when ignored, SHOULD-DO
- **SITUATIONAL (071-100)**: contextual, DEPENDS

Each item lives in its own file `<id>-<kebab-slug>.md` with the binding frontmatter shape in `_meta.yaml`.

## Items shipped (10)

| ID | Title | Category | Tier | Severity |
|----|-------|----------|------|----------|
| [001](001-trust-boundary-on-every-agent-handoff.md) | TREAT every sub-agent output as untrusted data | safety-and-trust | core | critical |
| [002](002-prefer-the-most-constrained-pattern.md) | USE the most-constrained pattern that solves the problem | agent-architecture | core | high |
| [003](003-never-fabricate-specifics-in-context-blocks.md) | NEVER invent specifics in a sub-agent's prompt context block | prompt-engineering | core | critical |
| [004](004-lock-allowedtools-by-default.md) | LOCK allowedTools to the minimum the agent needs | agent-architecture | core | high |
| [005](005-split-cost-cap-per-agent-system.md) | SPLIT the daily cost cap per agent-system | deployment-ops | core | high |
| [006](006-use-db-constraint-for-first-write-wins.md) | USE a UNIQUE constraint on the DB for first-write-wins | multi-agent-coordination | core | high |
| [007](007-verify-branch-name-before-every-commit.md) | RUN git branch --show-current BEFORE every commit | deployment-ops | core | high |
| [008](008-check-disk-before-deep-dispatch.md) | RUN df -h before any DISPATCH of 5+ parallel sub-agents | deployment-ops | core | medium |
| [009](009-voice-note-clarification-on-low-confidence-patches.md) | REQUEST voice note before low-confidence self-improvement patch | prompt-engineering | core | medium |
| [010](010-never-bypass-git-hooks.md) | NEVER bypass git hooks with --no-verify | deployment-ops | core | critical |

## How ZOE queries this list at runtime

Per locked Q11 design + doc 759 v2 Part B:

```bash
# Get all critical items
find research/agents/100-ai-agent-best-practices -name "*.md" -not -name "_*" -not -name "README.md" | \
  xargs grep -l "severity: critical" | xargs head -3

# Get all items applies_to multi-agent scenarios
grep -l "applies_to:.*multi-agent" research/agents/100-ai-agent-best-practices/*.md

# Get all not-yet-deprecated items in a category
grep -l "category: deployment-ops" research/agents/100-ai-agent-best-practices/*.md
```

Once Gap 3 ships (PR #721), `research-critic` can score any new agent design against the relevant items by category + severity.

## Next batch (items 011-020 - finishing CORE)

Planned topics:
- 011 - Default to fewer parallel branches over more (Anthropic recommendation)
- 012 - Don't pre-decompose - let the orchestrator decide
- 013 - Watchers detect hallucinated-progress; critics score quality
- 014 - Hybrid telemetry: structured raw + curated lessons
- 015 - Recursive sub-agent dispatch needs explicit depth limit
- 016 - Memory blocks are append-or-replace, never blind-merge
- 017 - 4-block memory model (Letta) over single rolling context
- 018 - Sub-agents need their own short-lived memory, not parent's
- 019 - Bonfire / KG for cross-agent learning, not raw chat log
- 020 - Distinct trust boundaries per role: user / system / agent / sub-agent

## Maintenance

- Re-validate every 90 days (per `_meta.yaml` cadence)
- Items get `deprecated_since` stamp when superseded, not deleted
- New items always append to next-free ID, never re-use a number
- Source bias: 60% Anthropic canon / 25% ZAO measured incidents / 15% community battle-tested

## Also See

- Doc 759 - the source decision (Q11=B build now in parallel)
- Doc 759 v2 Part B - the methodology PRD
- Doc 766 - the friction-source audit that surfaces several core items
- Memory: project_zoe_orchestrator_locked, feedback_no_sub_agent_context_fabrication, feedback_branch_discipline

## Sources

- [FULL] Anthropic "Building Effective Agents" (Schluntz + Zhang 2024)
- [FULL] ZAO doc 759 (agent best practices + ZOE orchestrator gap)
- [FULL] ZAO doc 766 (midway-work audit + friction sources)
- [FULL] `bot/src/hermes/critic.ts` (Hermes critic pattern - source for items 001, 005)
- [FULL] `bot/src/zoe/concierge.ts` + `decompose.ts` (ZOE GATEWAY pattern - source for items 002, 004)
- [FULL] `bot/src/zoe/reflexion.ts` (voice-note clarification pattern - source for item 009)
- [FULL] `.claude/settings.json` config-protection hook (source for item 010)
- [FULL] Memory files: feedback_branch_discipline (007), feedback_no_sub_agent_context_fabrication (001 + 003)
