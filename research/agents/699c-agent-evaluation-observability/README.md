---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-21
related-docs: 699, 698
original-query: "Agent evaluation + observability for ZAO's agents - tooling, methodology, catching silent failures. (sub-study of doc 699)"
tier: STANDARD
---

# 699c - Agent Evaluation + Observability for ZAO

> **Goal:** Decide how ZAO evaluates and observes ZOE, Hermes, and ZAOcoworkingBot - none have formal eval today.

## Key Decisions (DO THIS)

| # | Decision | Why |
|---|----------|-----|
| 1 | ADOPT a 3-layer stack: Langfuse (observability) + PromptFoo (regression) + hand-rolled LLM-as-judge (domain correctness) | All OSS, self-hostable on VPS 1, ~$10-15/mo total, no vendor lock-in - matches ZAO's OSS-first posture |
| 2 | SELF-HOST Langfuse on VPS 1 - it has native Claude SDK / OpenTelemetry support | Captures every Claude call, tokens, latency, tool execution with near-zero integration overhead |
| 3 | PUT PromptFoo regression suites in the repo, run them in CI, fail-closed on regression | Pre-merge gate; catches latency/cost/quality regressions before a PR lands |
| 4 | BUILD hand-rolled LLM-as-judge evals per agent - generic tooling is too coarse for ZOE/Hermes-specific correctness | "Did the concierge actually solve it?" / "Did the PR fix actually pass CI?" needs domain logic |
| 5 | TREAT evaluation as the highest-ROI agent spend, not overhead | Doc 699 finding: 18-24% eval budget -> 63% year-1 ROI; under 8% -> 28% |

## Tooling Comparison

| Tool | OSS | Self-host | Cost (self-hosted) | Best for | ZAO fit |
|------|-----|-----------|--------------------|----|---------|
| **Langfuse** | Yes | Yes (Docker) | ~$5-10/mo VPS | Tracing, prompt mgmt, scoring, OTel-native | ADOPT (Layer 1) |
| **PromptFoo** | Yes | Yes (CLI) | Free | Regression suites, red-teaming, CI/CD | ADOPT (Layer 2) |
| **DeepEval** | Yes | Yes (local) | Free | 50+ metrics, RAG/safety | Optional |
| **Phoenix/Arize** | Partial | Limited | $600+/mo cloud | Real-time prod monitoring | Overkill for ZAO scale |
| **Braintrust** | Partial | No (SaaS) | $500+/mo | Release gates, team governance | Skip - no self-host |
| **Opik (Comet)** | Partial | Yes (Docker) | ~$10/mo | Auto-instrument Claude Code | Optional - strong Claude Code fit |

## The Eval Plan Per Agent

**ZOE (concierge):** measure task completion, clarity, hallucination ("claimed to do X but logs show no query"), brand-voice fit. Langfuse logs every DM+response; PromptFoo runs 20 golden conversations; weekly Claude-Sonnet judge scores 50 sampled chats 1-5, anything <3 to human review.

**Hermes (fix-PR pipeline):** measure fix success (green CI, binary), regressions introduced, tool-calls vs human baseline, no new secret leaks. PromptFoo pre-flight: no 64-char hex, no `.env`, biome clean, vitest pass. Weekly post-merge audit of 10 PRs scored 1-5 on "did the fix actually solve the bug."

**ZAOcoworkingBot:** measure capture accuracy (action + due date + assignee), reminder follow-through, and silent failures ("said captured" but tracker shows nothing). PromptFoo asserts valid action JSON + parseable date + valid @mention.

## Catching Silent Failures

The doc 699 finding: observability tells you it is *running*; evaluation tells you it is *working*. Silent failures (agent reports success, delivered wrong result) hide in the gap. Concrete catches:
- Hermes says "deployed" but `git log` shows no commit -> PromptFoo diff-output assertion
- ZOE says "I checked your uploads" but query logs show 0 queries -> LLM judge scores <2 on "did you actually do this?"
- ZAOcoworkingBot "captured" but @mention silently failed validation -> regex assertion on Telegram user ID vs group members

## Specific Numbers

- Eval cost estimate: ~3,000 evals/mo at ~$0.003 each (Claude Sonnet judge) = ~$9/mo; full stack ~$12-15/mo on VPS 1
- Doc 699: 18-24% eval budget -> 63% year-1 ROI vs 28% under 8%
- Target: 0 undetected silent completions in 30 days; 100% of Claude calls traced by week 2
- Regression gate: fail CI on >15% latency increase or >10% success-rate drop

## Sources

- [Observability for Claude Agent SDK with Langfuse](https://langfuse.com/integrations/frameworks/claude-agent-sdk) [FULL]
- [PromptFoo (GitHub)](https://github.com/promptfoo/promptfoo) [FULL]
- [Agent observability complete guide 2026 (Braintrust)](https://www.braintrust.dev/articles/agent-observability-complete-guide-2026) [FULL]
- [Top 6 agent observability platforms 2026 (Laminar)](https://laminar.sh/article/2026-04-23-top-6-agent-observability-platforms) [FULL]
- [Taxonomy of Failure Mode in Agentic AI Systems (Microsoft)](https://www.microsoft.com/en-us/security/blog/) [PARTIAL]
- [Why AI agents break - field analysis of production failures (Arize)](https://arize.com/blog/common-ai-agent-failures/) [FULL]
- [HN - Ask HN: How are people doing AI evals these days?](https://news.ycombinator.com/item?id=47319587) [FULL]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Self-host Langfuse Docker on VPS 1, wire ZOE+Hermes OTel export | @Zaal | Infra | Next sprint |
| Add PromptFoo regression suites for ZOE/Hermes/coworking to the repo + CI | @Claude | PR | Next sprint |
| Collect 20 golden conversations per agent for the regression baseline | @Zaal | Todo | Next sprint |
| Wire the weekly LLM-as-judge batch eval cron | @Claude | PR | After Langfuse is up |
