---
topic: agents
type: guide
status: research-complete
last-validated: 2026-06-30
related-docs: 927, 918
original-query: "learn online how to be a better agent too in your loops"
tier: STANDARD
---

# 928 - Agent-loop best practices (learned online 2026-06-30)

> **Goal:** Concrete, behavior-changing practices for autonomous coding-agent loops (self-paced /loop building + deploying to the ZAO bot fleet). Distilled into the operating rule at `.claude/rules/agent-loops.md`.

## The practices (prioritized)

1. **Hard cost + iteration ceilings before running.** Layered stops: token budget, iteration limit, daily cost cap. Circuit breakers terminate, not just alert. Agents assume "it stops when done" - it stops when broke ($6,500 edge-case bills reported). Maps to us: the work-loop's daily cap + file-lock + empty-queue-zero-spend; ZOE call-budget.
2. **Plan before acting; explicit goals + success criteria to a file.** Decompose, store, resume from it. We do this via decompose/dispatch + the loop prompt carrying state; a persistent session-state file is the upgrade.
3. **Close every loop on observable ground truth** (typecheck + lint + build + boot + tests), never on the model's confidence. LLMs claim "fixed" after skimming. We already boot-verify (esbuild+tsc+vitest); make it automatic per feature claim.
4. **Track state at every restart; read the progress file first.** Context resets. Don't re-derive or re-test passing features. Write commit hash + done + blockers + next after each pass.
5. **One feature at a time; never leave a broken state.** Plan-code-verify-commit one thing fully before the next.
6. **Poka-yoke tool interfaces.** Absolute paths, enums over free strings, validate tool responses before trusting them. Prevents silent schema-drift failures.
7. **Explicit error propagation; no silent swallowing.** Check finish_reason; token exhaustion returns HTTP 200 with empty choices. Never treat a degraded call as success (mirrors our honest-fail rule).
8. **Subagents for bounded research/isolation; inline for the hot path.** Subagents ~67% fewer tokens per bounded task via context isolation; inline is faster for code-verify-commit.
9. **Persist lessons to the repo (.claude/rules / skills), not just session memory.** Institutional knowledge future loops read. This doc + the rule file ARE that.
10. **Workflows, not agents, for deterministic paths.** "test then deploy if green" = a workflow (cheap, deterministic); reserve agentic loops for dynamic branching.
11. **Read state before acting; avoid redundant context.** git log + typecheck at the top; open only the files the task touches, not all of src/.
12. **PR-only + human gate as the circuit breaker.** Never push/force-push main; outbound + on-chain + spend stay human-gated. Check PRs for review feedback every N iterations.

## Contradictions to naive instinct
- More context is NOT better - bigger context = compounding token cost; trim prior context.
- Agents are pattern-matchers, not trusted employees - ground truth (tests/lint/boot) beats confidence.
- Prefer short self-paced loops with saved state + batched human approvals over one big weekly run - easier to debug, less waste.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Land the operating rule at .claude/rules/agent-loops.md | Claude | PR | this PR |
| Add a session-state file to the /loop (read on restart) | Claude | build | next loop |
| Learn-online step every N loop cycles, fold into the rule | Claude | ongoing | recurring |

## Sources

- [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) - FULL
- [Anthropic: Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) - FULL
- [Anthropic: When Not to Build AI Agents](https://mer.vin/2026/05/when-not-to-build-ai-agents-anthropics-workflow-vs-agent-playbook/) - FULL
- [ExplainX: Loop Engineering for Coding Agents (2026)](https://explainx.ai/blog/loop-engineering-coding-agents-claude-code-guide-2026) - FULL
- [Earezki: Why LLM Agents Fail Silently](https://earezki.com/ai-news/2026-06-27-why-llm-agents-fail-silently-and-how-to-debug-them/) - FULL
- [Nexgismo: AI Agent Budget Guards](https://www.nexgismo.com/blog/ai-agent-budget-guards-stop-runaway-api-costs) - PARTIAL
- [Medium: Subagent Patterns 2026](https://medium.com/design-bootcamp/how-agents-manage-other-agents-four-subagents-patterns-in-2026-7abe5ab83b88) - PARTIAL
