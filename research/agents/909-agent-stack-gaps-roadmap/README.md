---
topic: agents
type: audit
status: research-complete
last-validated: 2026-06-26
superseded-by:
related-docs: 759, 899, 907
original-query: "continue iterating in a loop on researching about agents and gaps we may have"
tier: STANDARD
---

# 909 - ZAO Agent-Stack Gaps + Hardening Roadmap

> **Goal:** Honest gap analysis of the ZAO agent fleet vs 2026 best practice, ranked, with concrete fixes scoped to the stack (Next.js/Supabase/VPS/Pi/Bonfire/Telegram). ~65% production-ready: strong fundamentals, three blind spots.

## Key decisions (fix order)

| Gap | State | Fix (scoped) | Effort |
|-----|-------|--------------|--------|
| **1. Observability** (CRITICAL) | logs show status, not *why* | structured JSON logging -> Supabase `logs` table + correlation IDs through every dispatch; error-rate view | 2-3d, reusable |
| **2. Reliability** (CRITICAL) | no timeouts/circuit-breakers; silent memory degrade | `withTimeout()` on Claude calls; per-researcher consecutive-failure breaker -> Telegram alert + 1h backoff; Bonfire-read guard (escalate, don't silently use stale) | 3-4d |
| **3. Evaluation** (HIGH) | only Hermes *code* is scored | comms-critic + research-critic + task-goal-critic (0-100, reuse Hermes rubric); `eval_results` table; alert on >15% week-over-week drop | 1-2wk |
| 4. Coordination (HIGH) | agents run blind; dup work; Hermes/researcher races | Supabase **work registry** (scope+status); ZOE checks before dispatch; `escalations` table for researcher->Hermes handoffs | 3-4d |
| 5. Security (MED-HIGH) | untrusted scrapes unvalidated -> Bonfire | Zod `.strict()` at scrape boundary; injection-pattern scan before Bonfire write; (later) container isolation | 2-3d |
| 6. Memory quality (MED) | Bonfire write-heavy, read-light; manual dedup | mandatory recall (escalate on fail); semantic dedup (>0.85 merge); decay (purge 0-retrieval >60d); learning loop ingests social metrics too | 1wk |
| 7. Human-in-loop (MED) | concierge output ships unapproved; cost invisible at decision | approval routing by score (>=90 auto, 70-90 async-log, <70 hold) + cost estimate shown + edit-in-place | 2-3d |

## Quick wins (1-2 days each, do first)
1. **Timeout guards** on Claude calls - stops forever-hangs (one slot blocking the loop).
2. **Zod validation** on researcher scrapes - blocks prompt-injection from social/web.
3. **Work registry** - stops Hermes + researchers racing the same repo.
4. **Correlation IDs** in logging - the spine of observability.

(Already shipped 2026-06-26: **cite-or-drop + verify** on the 3 Pi researchers - directly addresses the reliability/eval "research slop" sub-gap. Farscout's grounded engine is the model.)

## Where ZAO is AHEAD of a typical 2026 fleet
- Cost-cap discipline (daily fleet cap) - most teams track nothing.
- Letta 4-block memory (persona/human/working/tasks) - most use flat RAG.
- Hermes critic loop (0-100 code rubric) - most have no eval at all.
- Non-blocking "clarify-in-place" defaults - rare + smart.

## Skeptic notes on this analysis
- It partly conflates the **bash Pi researchers** (yt/seo/repo loops) with the **TS bot** (`bot/src/zoe`); fixes citing `bot/src/researchers/*.ts` are illustrative - adapt per surface (TS bot vs bash loop).
- File paths + the "65% / 85% by week 8" numbers are directional, not measured.
- Several sources (OpenAI Swarm, LangChain/LangSmith URLs) are pattern references, treat as directional.

## Also See
- [Doc 907](../907-agent-fleet-dashboard/) - the dashboard observability/approvals plug into
- [Doc 899](../899-zoe-agent-fleet-audit/) - the fleet this audits
- [Doc 759] ZOE orchestrator (critics/reflexion/learn already built - extend them)
- `bot/src/zoe/{approvals,call-budget,critics}.ts`, `bot/src/hermes/critic.ts` - reuse for the new critics + routing

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Quick win: timeout wrapper on Claude calls (bot + Pi loops) | @ZOE | Build | Wk1 |
| Quick win: per-researcher circuit-breaker -> Telegram alert | @ZOE | Build | Wk1 |
| Structured logging -> Supabase + correlation IDs (ask-first: schema) | @Zaal | Build | Wk1-2 |
| Zod guard + injection scan before Bonfire writes | @ZOE | Build | Wk2 |
| comms-critic + research-critic (reuse Hermes rubric) | @ZOE | Build | Wk3-4 |
| Work registry (ask-first: Supabase table) | @Zaal | Build | Wk4 |

## Sources
- [FULL] [OpenTelemetry exporter spec](https://opentelemetry.io/docs/reference/specification/protocol/exporter/) - correlation-ID standard
- [FULL] [Pydantic](https://docs.pydantic.dev/latest/) - type-safe parsing as injection defense
- [FULL] [OpenAI Swarm](https://github.com/openai/swarm) - stateless handoff / work-queue patterns
- [FULL] [Google SRE Book](https://sre.google/books/) - circuit breaker + work coordination
- [PARTIAL] [Arize Phoenix](https://arize.com/blog/llm-evaluation/), [Mem0](https://docs.mem0.ai/), [LangSmith](https://smith.langchain.com/) - eval/memory patterns, skimmed
