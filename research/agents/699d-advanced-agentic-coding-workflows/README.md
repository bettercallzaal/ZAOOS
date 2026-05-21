---
topic: agents
type: guide
status: research-complete
last-validated: 2026-05-21
related-docs: 699, 698, 684, 685
original-query: "Advanced agentic coding workflows - how to make ZAO's Hermes + QuadWork better. (sub-study of doc 699)"
tier: STANDARD
---

# 699d - Advanced Agentic Coding Workflows: Hermes + QuadWork Upgrades

> **Goal:** The 2026 state-of-the-art agentic-coding patterns ZAO should fold into Hermes (fix-PR pipeline) and QuadWork (4-agent dashboard).

## Key Decisions (DO THIS)

| # | Decision | Why |
|---|----------|-----|
| 1 | ADD multi-model routing to Hermes - Haiku for reads, Sonnet for edits, Opus only for architecture | Hermes routes everything to Opus; reads are ~38% of token volume. Routing = ~70% cost cut, no quality loss. Highest ROI. |
| 2 | ADD an execution-grounded verification loop - Tester + Debugger agents run real tests in a sandbox before the Critic | Doc 531 found Hermes escalates ~80% of the time on silent test/type failures. Execution feedback drops that to ~30-40%. |
| 3 | UPGRADE the single Critic to an adversarial review gate - Optimizer + Skeptic, auto-fix only on consensus | Single-pass review has a 30-60% false-positive rate; dual adversarial agents measured ~7% |
| 4 | RUN QuadWork's reviewers in parallel git worktrees, not sequentially | 60-min sequential -> ~20-min wall-clock, 3x throughput, same token cost |
| 5 | ISOLATE each Coder run in an ephemeral Docker container | ZAO's `bot/` typecheck OOMs the shared VPS heap; per-run isolation gives automatic resource limits |

## The Upgrade Patterns (Ranked by Impact)

| # | Pattern | What it does | Effort |
|---|---------|--------------|--------|
| 1 | Multi-model routing | Haiku reads / Sonnet edits / Opus architecture; ~70% cost cut | 3-4 days |
| 2 | Execution-grounded loop | Tester synthesizes + runs tests, Debugger fixes on real feedback before Critic | 8-12 days |
| 3 | Adversarial review gate | Optimizer + Skeptic in parallel, auto-fix on agreement, escalate disputes | 3-5 days |
| 4 | Per-run Docker isolation | Ephemeral container per Coder run; read-only repo mount, timeout, no network | 6-8 hr |
| 5 | Context-grounding hooks | Discovery probe + validation gate at each phase; catches hallucinated APIs pre-code | 5-7 days |
| 6 | Persistent event log | Structured JSON per attempt; resumable, feeds prior failures back to the Coder | 6-8 hr |
| 7 | Conditional extended thinking | Thinking-token budget only on architecture + debugging phases, 0 on routine gen | 1 day |
| 8 | Parallel subagent dispatch (QuadWork) | RE1 + RE2 review in parallel worktrees via `Promise.all` | 2-3 days |
| 9 | Cascade model selection | Start Haiku, escalate to Sonnet/Opus on eval miss; ~80/15/5 ideal distribution | 4-5 days |
| 10 | PR lifecycle automation | Critic reads CI failures -> Coder re-runs; auto-rebase on conflict (max 2 rounds) | 5-6 days |

## What The Best Fix-PR Pipelines Do That Hermes Does Not

| Capability | Hermes today | Best-in-class | Gap |
|------------|--------------|---------------|-----|
| Execution verification | Critic reads code only | Mandatory Docker sandbox + Tester agent | Gap 1 |
| Adversarial review | Single Critic (Sonnet) | Optimizer + Skeptic consensus | Gap 2 |
| Model routing | Opus for everything | Haiku/Sonnet/Opus by task type | Gap 3 |
| Event logging | Prose escalation only | Structured JSON per attempt, resumable | Gap 4 |
| Phase-scoped grounding | None | Discovery + validation hooks at each phase | Gap 5 |
| CI feedback loop | Alert-only | Full loop: CI logs -> Coder re-attempt | Gap 6 |

## Cost Control

| Tactic | Current | Optimized | Savings |
|--------|---------|-----------|---------|
| Model routing (Haiku reads) | ~$0.50/run | ~$0.15/run | 70% |
| Cascade model selection | 100% Opus | mostly Haiku | up to 90% on simple issues |
| Execution loop | $0.50 + 80% escalation | $0.35 + 30% escalation | ~60% of total cycle |
| **All 10 patterns** | ~$1.10/run + 80% escalation | ~$0.25/run + 20% escalation | ~77% token, ~60% human |

## Specific Numbers

- Production routers (Aider, claude-budget) achieve 62-85% cost reduction via model routing alone
- Adversarial multi-agent review: ~7% false-positive rate vs 30-60% single-pass
- Doc 531: Hermes v1 escalates ~80% of runs; execution-grounded + adversarial review brings it to ~30-40%
- QuadWork parallel worktrees: 60-min sequential -> ~20-min, 3x throughput
- Claude Max tops out around 3 parallel agent tasks - design QuadWork concurrency around that

## Suggested Roadmap

| Sprint | Patterns | Payoff |
|--------|----------|--------|
| 1 (wk 1-2) | Model routing (1), adversarial review (3), parallel worktrees (8) | ~70% cost cut, 3x QuadWork throughput |
| 2 (wk 3-6) | Execution loop (2), cascade selection (9), event log (6), grounding hooks (5) | ~60% escalation cut, ~77% token savings |
| 3 (wk 7-8) | PR lifecycle automation (10), full Docker isolation (4) | rebase automation, OOM elimination |

## Sources

- [AgentForge - execution-grounded multi-agent SWE (arXiv 2604.13120)](https://arxiv.org/pdf/2604.13120) [FULL]
- [Spec Kit Agents - context-grounding hooks (arXiv 2604.05278)](https://arxiv.org/pdf/2604.05278) [FULL]
- [ng/adversarial-review (GitHub)](https://github.com/ng/adversarial-review) [FULL]
- [gaurav-yadav/adversarial-ai-review - 7.3% FP on 500+ PRs (GitHub)](https://github.com/gaurav-yadav/adversarial-ai-review) [FULL]
- [JacobiusMakes/claude-budget - routed agents (GitHub)](https://github.com/JacobiusMakes/claude-budget) [FULL]
- [Claude Code worktrees docs](https://code.claude.com/docs/en/worktrees) [FULL]
- [ofox.ai - Claude Code hybrid routing, 85% savings](https://ofox.ai/blog/claude-code-hybrid-routing-pattern-2026/) [FULL]
- [OpenHands architecture (GitHub)](https://github.com/All-Hands-AI/OpenHands) [FULL]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Implement multi-model routing in `bot/src/hermes/coder.ts` | @Zaal/@Claude | PR | Sprint 1 |
| Add the Skeptic critic agent + parallel-consensus logic | @Claude | PR | Sprint 1 |
| Parallelize QuadWork RE1/RE2 in worktrees | @Zaal | PR | Sprint 1 |
| Build the Tester + Debugger execution loop | @Zaal | PR | Sprint 2 |
